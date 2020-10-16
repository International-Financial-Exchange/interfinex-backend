import * as _ from "lodash";
import { ethers } from "ethers";

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
export const humanizeTokenAmount = (amount: string, decimals: number) => parseFloat(ethers.utils.formatUnits(amount, decimals));


// Default decimals to 18 if a contract does not implement decimals
export const getTokenDecimals = async (token: any) => parseFloat(
    (await (token.methods?.decimals().call() || token.methods?.DECIMALS().call() || token.methods?.Decimals().call())) ?? 18
);

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
