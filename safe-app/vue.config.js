const { defineConfig } = require("@vue/cli-service");
const { readFileSync } = require("fs");
const { join } = require("path");

module.exports = defineConfig({
  devServer: {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers":
        "X-Requested-With, content-type, Authorization",
    },
    https: {
      key: readFileSync(join(__dirname, "./localhost+2-key.pem")),
      cert: readFileSync(join(__dirname, "./localhost+2.pem")),
    },
    // public: "https://192.168.0.143:8080", // Use your local IP and port
  },
  transpileDependencies: true,
});
