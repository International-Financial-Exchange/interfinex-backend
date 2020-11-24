import parseArgs from "minimist";
import contracts from "../contracts/contracts.json";
import ENV from "./.env.json";

const enum Network {
    localhost = "localhost",
    kovan = "kovan",
    mainnet = "mainnet",
};

const ENV_CONFIG: {
    network?: Network
} = parseArgs(process.argv.slice(2)) as any;

export const ETH_NODE_URL: string = ENV.ethNodeUrls[ENV_CONFIG.network ?? Network.localhost];
// @ts-ignore
export const CONTRACTS: any = contracts[ENV_CONFIG.network ?? Network.localhost];


import DividendERC20Abi from "../contracts/abi/DividendERC20.json";
import ERC20Abi from "../contracts/abi/ERC20.json";
import MarginFactoryAbi from "../contracts/abi/MarginFactory.json";
import MarginMarketAbi from "../contracts/abi/MarginMarket.json";
import SwapExchangeAbi from "../contracts/abi/SwapExchange.json";
import SwapFactoryAbi from "../contracts/abi/SwapFactory.json";
export const ABI = {
    DividendERC20: DividendERC20Abi,
    ERC20: ERC20Abi,
    MarginFactory: MarginFactoryAbi,
    MarginMarket: MarginMarketAbi,
    SwapExchange: SwapExchangeAbi,
    SwapFactory: SwapFactoryAbi,
};

//@ts-ignore
export const getAbi = (abiName: string) => ABI[abiName];