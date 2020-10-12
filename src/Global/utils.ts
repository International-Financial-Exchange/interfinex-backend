import { provider } from "./ethers";
import { ethers } from "ethers";
import * as _ from "lodash";

export const newContract = (address: string, abi: any) => {
    return new ethers.Contract(address, abi, provider);
}

// Empty out all keys in an object that have a field of undefined
export const removeEmptyFields = ($obj: { [key: string]: any }) => {
    for (const k of Object.keys($obj)) {
        if ($obj[k] === undefined) 
            delete $obj[k];

        if (isObject($obj[k])) 
            removeEmptyFields($obj[k]);
    }

    return $obj;
}

export const isObject = (item: any) => typeof item === "object" && !Array.isArray(item) && item !== null;

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
