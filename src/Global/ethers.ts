import { ethers } from "ethers";
import { ETH_NODE_URL } from "../ENV";

export const provider = new ethers.providers.JsonRpcProvider(ETH_NODE_URL);
