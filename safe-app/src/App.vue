<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gray-100"
  >
    <div
      v-if="account"
      @click="playSound"
      class="connected-display mt-4 p-4 border rounded bg-white pulse-animate"
    >
      <h3 class="text-green-500">Safe Connected</h3>
      <p>Address: {{ account }}</p>
    </div>
  </div>
</template>

<script>
import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import { onMounted, ref } from "vue";
import "viem/window";

const buttonSound = new Audio("/connect-wallet.wav");
// const switchSound = new Audio("/switch-to-arb.wav");

const playSound = () => {
  buttonSound.play();
};

// const playSwitchSound = () => {
//   switchSound.play();
// };

export default {
  setup() {
    onMounted(() => {
      const opts = {
        allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/],
        debug: false,
      };

      const appsSdk = new SafeAppsSDK(opts);

      appsSdk.safe.getInfo().then((info) => {
        account.value = info.safeAddress;

        console.log(info);
      });
    });

    const account = ref(null);
    const error = ref("");

    const sendTransaction = async () => {
      if (!account.value) return;
    };

    return {
      account,
      sendTransaction,
      error,
      playSound,
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

.connected-display {
  text-align: center;
  padding: 20px;
  border-radius: 10px;
  background: linear-gradient(145deg, #ffffff, #e6e6e6);
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
}

.connected-display h3 {
  font-size: 1.5em;
  color: #4caf50;
  margin-bottom: 10px;
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
</style>
