import { provider } from "./ethers";
import { ethers } from "ethers";
import * as _ from "lodash";

export const newContract = (address: string, abi: any) => {
    return new ethers.Contract(address, abi, provider);
}

declare global {
    interface Array<T> {
        last(this: T[]): T;
        first(this: T[]): T;
    }
}

Array.prototype.last = function<T>(this: Array<T>) { 
    return _.cloneDeep(this[this.length - 1]); 
};

Array.prototype.first = function<T>(this: Array<T>) { 
    return _.cloneDeep(this[0]); 
};
