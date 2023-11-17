<template>
  <div class="flex items-start justify-center min-h-screen bg-gray-100 pt-12">
    <div
      v-if="account"
      @click="displayMintModal"
      class="safe-display border rounded bg-black text-white sci-fi-animate"
    >
      <div class="flex items-center">
        <div class="flex-grow">
          <h3>
            <span>{{ account }}</span>
          </h3>
        </div>
        <div class="active-indicator"></div>
      </div>
      <p>
        <strong
          ><span>{{ formatNumber(ethBalance) }} ETH</span></strong
        >
      </p>
    </div>
    <div
      v-if="account && showMintModal"
      class="modal-overlay"
      @click="closeMintModal"
    >
      <div class="modal sci-fi-modal" @click.stop="handleMintInput">
        <h2>How Much $MINT Should We Mint?</h2>
        <div class="input-group">
          <input
            type="number"
            v-model="mintAmount"
            class="sci-fi-input"
            @input="handleMintInput"
            @focus="handleMintInput"
            min="0"
          />
          <span class="input-label">$MINT</span>
        </div>
        <div class="button-container">
          <button @click.stop="storeMintAmount" class="lfg-button">LFG</button>
        </div>
      </div>
    </div>
    <div
      v-if="showDisperseModal"
      class="modal-overlay"
      @click="closeDisperseModal"
    >
      <div class="modal sci-fi-modal" @click.stop="handleDisperseInput">
        <h2>Who should we send $MINT to?</h2>

        <div
          v-for="(recipient, index) in recipients"
          :key="index"
          class="recipient-group"
        >
          <input
            type="text"
            v-model="recipient.recipientAddress"
            placeholder="Recipient Address"
            class="sci-fi-input sci-fi-input-recipients w-96"
            @input="() => handleDisperseInput(index)"
            @focus="() => handleDisperseInput(index)"
          />
          <input
            type="number"
            v-model="recipient.mintAmount"
            placeholder="Amount"
            class="sci-fi-input sci-fi-input-recipient"
            min="0"
            @input="() => handleDisperseInput(index)"
            @focus="() => handleDisperseInput(index)"
          />
          <button
            v-if="recipients.length > 1"
            @click.stop="removeRecipient(index)"
            class="delete-button"
          >
            Remove
          </button>
        </div>

        <button @click.stop="addRecipient" class="add-button">
          Add Recipient
        </button>
        <button @click.stop="disperseTokens" class="lfg-button">
          Disperse
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import { createPublicClient, encodeFunctionData, http, parseEther } from "viem";
import { arbitrum } from "viem/chains";
import { onMounted, ref } from "vue";

const backSound = new Audio("back-button.mp3");
const closeModalSound = new Audio("/close-modal.ogg");
const connectionDisplayClickSound = new Audio("/connected-safe.wav");
const disperseTokensSound = new Audio("/disperse-tokens.ogg");
const mintLfgSound = new Audio("/mint-lfg.ogg");
const inputSound = new Audio("/mint-input.wav");
const removeRecipientSound = new Audio("/remove-recipient.wav");

const client = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

const PEREPTUAL_MINT_DIAMOND_ADDRESS =
  "0x791b648AA3Bd21964417690C635040F40ce974a5";

const TOKEN_PROXY_DIAMOND_ADDRESS =
  "0xEf97C7394F71851880A7868D21df3A9dF24FAfC7";

const playConnectionDisplaySound = () => {
  connectionDisplayClickSound.play();
};

const playMintLfgSound = () => {
  mintLfgSound.play();
};

function truncateAddress(addr, firstN = 6, lastN = 4) {
  const firstPart = addr.substring(0, firstN);
  const lastPart = addr.substring(addr.length - lastN);
  return `${firstPart}...${lastPart}`;
}

export default {
  setup() {
    const account = ref(null);
    const appsSdkRef = ref(null);
    const ethBalance = ref(0);
    const error = ref("");
    const mintAmount = ref(100000); // Default to 100,000 $MINT
    const recipients = ref([{ recipientAddress: "", mintAmount: 100000 }]);
    const showDisperseModal = ref(false);
    const showMintModal = ref(false);
    const txs = ref([]);

    const addRecipient = () => {
      playMintLfgSound();

      recipients.value.push({ recipientAddress: "", mintAmount: 100000 });
    };

    const closeDisperseModal = () => {
      closeModalSound.play();

      showDisperseModal.value = false;
    };

    const closeMintModal = () => {
      closeModalSound.play();

      showMintModal.value = false;
    };

    const disperseTokens = async () => {
      disperseTokensSound.play();

      // Extract recipient addresses
      const recipientAddresses = recipients.value.map(
        (recipient) => recipient.recipientAddress,
      );

      // Extract mint amounts
      const mintAmounts = recipients.value.map((recipient) =>
        parseEther(recipient.mintAmount.toString()),
      );

      console.log(recipientAddresses, mintAmounts);

      txs.value.push({
        to: TOKEN_PROXY_DIAMOND_ADDRESS,
        value: 0,
        data: encodeFunctionData({
          abi: [
            {
              inputs: [
                {
                  internalType: "address[]",
                  name: "recipients",
                  type: "address[]",
                },
                {
                  internalType: "uint256[]",
                  name: "amounts",
                  type: "uint256[]",
                },
              ],
              name: "disperseTokens",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          functionName: "disperseTokens",
          args: [recipientAddresses, mintAmounts],
        }),
      });

      // eslint-disable-next-line
      BigInt.prototype.toJSON = function () {
        return this.toString();
      };

      try {
        await appsSdkRef.value.txs.send({
          txs: JSON.parse(JSON.stringify(txs.value)),
        });

        // Logic to disperse tokens
        console.log("Dispersing to:", recipients.value);
        showDisperseModal.value = false;
      } catch (err) {
        backSound.play();

        console.error(err);

        txs.value.pop();
      }
    };

    const displayMintModal = () => {
      playConnectionDisplaySound();

      showMintModal.value = true;
      txs.value = [];
    };

    const formatNumber = (num) => {
      return new Intl.NumberFormat("en-US").format(num);
    };

    const handleMintInput = () => {
      inputSound.play();

      if (mintAmount.value < 0) {
        mintAmount.value = 0;
      }
    };

    const handleDisperseInput = (index) => {
      inputSound.play();

      if (recipients.value[index]?.mintAmount < 0) {
        recipients.value[index].mintAmount = 0;
      }
    };

    const removeRecipient = (index) => {
      removeRecipientSound.play();

      if (recipients.value.length > 1) {
        recipients.value.splice(index, 1);
      }
    };

    const storeMintAmount = async () => {
      playMintLfgSound();

      // Convert to wei
      const mintAmountInWei = parseEther(mintAmount.value.toString());

      const ethToMintRatio = await client.readContract({
        abi: [
          {
            inputs: [],
            name: "ethToMintRatio",
            outputs: [
              {
                internalType: "uint256",
                name: "ratio",
                type: "uint256",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
        ],
        address: PEREPTUAL_MINT_DIAMOND_ADDRESS,
        functionName: "ethToMintRatio",
      });

      console.log("ethToMintRatio:", ethToMintRatio);

      txs.value.push({
        to: PEREPTUAL_MINT_DIAMOND_ADDRESS,
        value: mintAmountInWei / ethToMintRatio,
        data: encodeFunctionData({
          abi: [
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "amount",
                  type: "uint256",
                },
              ],
              name: "mintAirdrop",
              outputs: [],
              stateMutability: "payable",
              type: "function",
            },
          ],
          functionName: "mintAirdrop",
          args: [mintAmountInWei],
        }),
      });

      // Logic to store mintAmount for a transaction
      console.log("Mint amount to be used:", mintAmountInWei);

      console.log(txs);

      // Possibly close the modal or trigger the next step
      showMintModal.value = false;

      showDisperseModal.value = true;
    };

    // Async function to fetch wallet info and balance
    const fetchWalletInfo = async () => {
      try {
        const opts = {
          allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/],
          debug: false,
        };

        const appsSdk = new SafeAppsSDK(opts);

        appsSdkRef.value = appsSdk;

        const info = await appsSdk.safe.getInfo();

        account.value = truncateAddress(info.safeAddress);

        console.log(info);

        // Now fetch the balance
        if (account.value) {
          const balance = await appsSdk.eth.getBalance([info.safeAddress]);

          // Convert from hexadecimal wei to decima eth
          ethBalance.value = parseInt(balance, 16) / 1e18;

          showMintModal.value = true;

          console.log(balance);
        }
      } catch (err) {
        console.error(err);
      }
    };

    onMounted(() => {
      fetchWalletInfo();
    });

    return {
      account,
      addRecipient,
      closeDisperseModal,
      closeMintModal,
      disperseTokens,
      displayMintModal,
      ethBalance,
      error,
      formatNumber,
      handleDisperseInput,
      handleMintInput,
      mintAmount,
      playConnectionDisplaySound,
      recipients,
      removeRecipient,
      showDisperseModal,
      showMintModal,
      storeMintAmount,
    };
  },
};
</script>

<style>
.button-animate {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.button-animate:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pulse-animate {
  animation: pulse 2s infinite, fadeIn 0.5s ease-out;
}

.safe-display {
  position: relative;
  text-align: left;
  padding: 1rem 1rem 1rem 2rem;
  border-radius: 10px;
  background: #111;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
  transition: transform 0.3s ease;
}

.safe-display h3,
.safe-display p {
  font-family: "Orbitron", sans-serif; /* A sci-fi inspired font */
  margin: 5px 0;
}

.safe-display span {
  color: #4caf50;
}

.active-indicator {
  top: 10px;
  right: 10px;
  width: 15px;
  height: 15px;
  background-color: #4caf50;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.7);
  animation: pulsate 1s infinite ease-in-out;
  margin: 0 0 0 20px;
}

@keyframes pulsate {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.sci-fi-animate {
  animation: fadeIn 0.5s ease-out, glow 1.5s infinite alternate;
}

@keyframes glow {
  from {
    box-shadow: 0 0 10px #00ff00;
  }
  to {
    box-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
}

.sci-fi-modal {
  background-color: #111;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
  text-align: center;
}

.sci-fi-modal h2 {
  color: #4caf50;
  font-family: "Orbitron", sans-serif;
}

.input-group {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sci-fi-input {
  padding: 0.5rem;
  border: 1px solid #4caf50;
  background: transparent;
  color: white;
  font-family: "Orbitron", sans-serif;
  margin-right: 0.5rem;
}

.input-label {
  color: #4caf50;
}

.sci-fi-input::-webkit-outer-spin-button,
.sci-fi-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.lfg-button {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  border: none;
  border-radius: 5px;
  color: white;
  font-family: "Orbitron", sans-serif;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.7);
}

.lfg-button:hover {
  background-color: #3e8e41;
  transform: translateY(-3px);
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.9);
}

.button-container {
  margin-top: 1rem;
  text-align: center;
}

.recipient-group {
  margin: 1rem;
}

.add-button,
.delete-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  font-family: "Orbitron", sans-serif;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-right: 1rem;
}

.add-button:hover,
.delete-button:hover {
  background-color: #3e8e41;
}

.sci-fi-input-recipients {
  margin-right: 0.5rem;
}
</style>
