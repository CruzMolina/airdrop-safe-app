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
    hot: true,
    https: {
      key: readFileSync(join(__dirname, "./localhost+2-key.pem")),
      cert: readFileSync(join(__dirname, "./localhost+2.pem")),
    },
  },
  transpileDependencies: false,
  parallel: false,
});
