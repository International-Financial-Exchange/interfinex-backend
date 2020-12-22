import { ILO_COLLECTIONS } from "../collections";
import { ILODetails, ILO_TYPES, SimpleILODetails } from "../factory";
import { ILOListener } from "./ILO";

export type FixedPriceDetails = {
    tokensPerEth: number,
    totalAssetTokensBought: number,
    softCap: number,
};

export class FixedPriceListener extends ILOListener {
    constructor(simpleIloDetails: SimpleILODetails) {
        super(simpleIloDetails, ILO_TYPES.FixedPrice);
    }

    async updateStats(): Promise<ILODetails> {
        const additionalDetails: FixedPriceDetails = {
            tokensPerEth: parseInt(await this.contract.methods.tokensPerEth().call()),
            totalAssetTokensBought: parseInt(await this.contract.methods.totalAssetTokensBought().call()),
            softCap: parseInt(await this.contract.methods.softCap().call()),
        };
        
        const hasEnded = await this.contract.methods.hasEnded().call();
        const hasCreatorWithdrawn = await this.contract.methods.hasCreatorWithdrawn().call();
        const ethInvested = additionalDetails.totalAssetTokensBought / additionalDetails.tokensPerEth;
        const score = 0;

        const iloDetails = await ILO_COLLECTIONS.iloListCollection.findOneAndUpdate(
            { contractAddress: this.simpleDetails.contractAddress, },
            { "$set": { additionalDetails, ethInvested, score, hasEnded, hasCreatorWithdrawn, }},
            { returnOriginal: false },
        );

        return iloDetails.value;
    }
}