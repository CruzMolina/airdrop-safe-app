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
          ><span>{{ ethBalance }} ETH</span></strong
        >
      </p>
    </div>
    <div
      v-if="account && showMintModal"
      class="modal-overlay"
      @click="closeMintModal"
    >
      <div class="modal sci-fi-modal" @click.stop="handleInput">
        <h2>How Much $MINT Should We Mint?</h2>
        <div class="input-group">
          <input
            type="number"
            v-model="mintAmount"
            class="sci-fi-input"
            @input="handleInput"
            @focus="handleInput"
            min="0"
          />
          <span class="input-label">$MINT</span>
        </div>
        <div class="button-container">
          <button @click.stop="storeMintAmount" class="lfg-button">LFG</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import { parseEther } from "viem";
import { onMounted, ref } from "vue";

const closeModalSound = new Audio("/close-modal.ogg");
const connectionDisplayClickSound = new Audio("/connected-safe.wav");
const mintLfgSound = new Audio("/mint-lfg.ogg");
const inputSound = new Audio("/mint-input.wav");

const PEREPTUAL_MINT_DIAMOND_ADDRESS =
  "0x791b648AA3Bd21964417690C635040F40ce974a5";

// const TOKEN_PROXY_DIAMOND_ADDRESS =
//   "0xEf97C7394F71851880A7868D21df3A9dF24FAfC7";

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
    const ethBalance = ref(0);
    const error = ref("");
    const mintAmount = ref(100000); // Default to 100,000 $MINT
    const showMintModal = ref(false);
    const txs = ref([]);

    const closeMintModal = () => {
      closeModalSound.play();

      showMintModal.value = false;
    };

    const displayMintModal = () => {
      playConnectionDisplaySound();

      showMintModal.value = true;
      txs.value = [];
    };

    const handleInput = () => {
      inputSound.play();

      if (mintAmount.value < 0) {
        mintAmount.value = 0;
      }
    };

    const storeMintAmount = () => {
      playMintLfgSound();

      // Convert to wei
      const mintAmountInWei = parseEther(mintAmount.value.toString());

      txs.value.push({
        to: PEREPTUAL_MINT_DIAMOND_ADDRESS,
        value: 0,
        data: mintAmountInWei,
      });

      // Logic to store mintAmount for a transaction
      console.log("Mint amount to be used:", mintAmountInWei);

      console.log(txs);

      // Possibly close the modal or trigger the next step
      showMintModal.value = false;
    };

    // Async function to fetch wallet info and balance
    const fetchWalletInfo = async () => {
      try {
        const opts = {
          allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/],
          debug: false,
        };

        const appsSdk = new SafeAppsSDK(opts);

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
      closeMintModal,
      displayMintModal,
      ethBalance,
      error,
      handleInput,
      mintAmount,
      playConnectionDisplaySound,
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
</style>
