import Web3 from "web3";
import { ETH_NODE_URL, getAbi } from "../ENV";
import Web3WsProvider from "web3-providers-ws";

console.log(`Utilising Eth Node: ${ETH_NODE_URL}`)

// @ts-ignore
// Required so that we can reconnect to websocket while listening to events instead of timing out
const wsProvider = new Web3WsProvider(ETH_NODE_URL, {
    clientConfig: {
        // Useful to keep a connection alive
        keepalive: true,
        keepaliveInterval: 60000 // ms
    },

    // Enable auto reconnection
    reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 5,
        onTimeout: false
    }
});

export const web3 = new Web3(wsProvider);

export const newContract = (abiName: string, address: string) => {
    return new web3.eth.Contract(getAbi(abiName), address);
};