import parseArgs from "minimist";
import ENV from "./.env.json";

const enum Network {
    dev = "dev",
    kovan = "kovan",
    mainnet = "mainnet",
};

const ENV_CONFIG: {
    network?: Network
} = parseArgs(process.argv.slice(2)) as any;

export const ETH_NODE_URL: string = ENV.ethNodeUrls[ENV_CONFIG.network ?? Network.dev];
