import Web3 from "web3";
import { ETH_NODE_URL } from "../ENV";

export const web3 = new Web3(ETH_NODE_URL);

export const newContract = (abi: any, address: string) => {
    return new web3.eth.Contract(abi, address);
};
