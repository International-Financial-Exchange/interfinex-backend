"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newContract = exports.web3 = void 0;
const web3_1 = __importDefault(require("web3"));
const ENV_1 = require("../ENV");
const web3_providers_ws_1 = __importDefault(require("web3-providers-ws"));
console.log(`Utilising Eth Node: ${ENV_1.ETH_NODE_URL}`);
// @ts-ignore
// Required so that we can reconnect to websocket while listening to events instead of timing out
const wsProvider = new web3_providers_ws_1.default(ENV_1.ETH_NODE_URL, {
    clientConfig: {
        // Useful to keep a connection alive
        keepalive: true,
        keepaliveInterval: 60000 // ms
    },
    // Enable auto reconnection
    reconnect: {
        auto: true,
        delay: 5000,
        maxAttempts: 5,
        onTimeout: false
    }
});
exports.web3 = new web3_1.default(wsProvider);
exports.newContract = (abi, address) => {
    return new exports.web3.eth.Contract(abi, address);
};
//# sourceMappingURL=web3.js.map