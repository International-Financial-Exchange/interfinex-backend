import Web3 from "web3";

export const web3 = new Web3("ws://localhost:7545");

export const newContract = (abi: any, address: string) => {
    return new web3.eth.Contract(abi, address);
};
