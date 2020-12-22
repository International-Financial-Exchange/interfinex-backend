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
export const humanizeTokenAmount = (amount: string, decimals: number = 18) => parseFloat(ethers.utils.formatUnits(amount, decimals));

export const getTokenDecimals = async (token: any): Promise<number> => {
    const decimals = await token.methods.decimals().call()
        .catch(() => token.methods.DECIMALS().call())
        .catch(() => token.methods.Decimals().call())
        .catch(() => 18); // Default decimals to 18 if a contract does not implement decimals variable

    return parseFloat(decimals);
};

export const getTokenName = async (token: any ): Promise<string> => {
    const name = await token.methods.name().call()
        .catch(() => token.methods.NAME().call())
        .catch(() => token.methods.Name().call())
        .catch(() => "Unknown Name");

    return name;
};

export const getTokenSymbol = async (token: any): Promise<string> => {
    const symbol = await token.methods.symbol().call()
        .catch(() => token.methods.SYMBOL().call())
        .catch(() => token.methods.Symbol().call())
        .catch(() => "N/A");

    return symbol;
};

export type TokenInfo = {
    decimals: number,
    name: string,
    symbol: string,
    address: string,
};

export const getTokenInfo = async (token: any): Promise<TokenInfo> => {
    return {
        decimals: await getTokenDecimals(token),
        name: await getTokenName(token),
        symbol: await getTokenSymbol(token),
        address: token.options.address,
    };
};

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
