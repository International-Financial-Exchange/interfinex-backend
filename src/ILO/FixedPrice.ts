import { newContract } from "../Global/web3";
import { ILO_COLLECTIONS } from "./collections";
import { SimpleILODetails } from "./factory";

export type FixedPriceDetails = {
    tokensPerEth: number,
    totalAssetTokensBought: number,
};

export class FixedPrice {
    public simpleDetails: SimpleILODetails;
    public contract: any;

    constructor(simpleIloDetails: SimpleILODetails) {
        this.simpleDetails = simpleIloDetails;
        this.contract = newContract("FixedPricedILO", simpleIloDetails.contractAddress);
    }

    async start() {
        // TODO.
        // Start the listeners for deposits, withdrawals
        // Each time an event on the contract changes run the updater
    }

    async updateStats() {
        const additionalDetails: FixedPriceDetails = {
            tokensPerEth: parseInt(await this.contract.methods.tokensPerEth().call()),
            totalAssetTokensBought: parseInt(await this.contract.methods.totalAssetTokensBought().call()),
        };
        
        const ethInvested = additionalDetails.totalAssetTokensBought / additionalDetails.tokensPerEth;
        const score = 0;

        return ILO_COLLECTIONS.iloListCollection.updateOne(
            { contractAddress: this.simpleDetails.contractAddress },
            { "$set": { additionalDetails, ethInvested, score }},
        );
    }

    async stop() {

    }
}