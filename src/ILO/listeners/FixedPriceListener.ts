import { BigNumber } from "ethers";
import { ILO_COLLECTIONS } from "../collections";
import { ILODetails, ILO_TYPES, SimpleILODetails } from "../factory";
import { ILOListener } from "./ILO";

export type FixedPriceDetails = {
    tokensPerEth: string,
    totalAssetTokensBought: string,
    softCap: string,
};

export class FixedPriceListener extends ILOListener {
    constructor(simpleIloDetails: SimpleILODetails) {
        super(simpleIloDetails, ILO_TYPES.FixedPrice);
    }

    async updateStats(): Promise<ILODetails> {
        const additionalDetails: FixedPriceDetails = {
            tokensPerEth: await this.contract.methods.tokensPerEth().call(),
            totalAssetTokensBought: await this.contract.methods.totalAssetTokensBought().call(),
            softCap: await this.contract.methods.softCap().call(),
        };

        console.log(additionalDetails);
        
        const hasEnded = await this.contract.methods.hasEnded().call();
        const hasCreatorWithdrawn = await this.contract.methods.hasCreatorWithdrawn().call();
        const ethInvested: number = parseFloat(BigNumber.from(additionalDetails.totalAssetTokensBought).div(additionalDetails.tokensPerEth).toString());
        const score = this.getScore(ethInvested);

        console.log({ additionalDetails, ethInvested, score, hasEnded, hasCreatorWithdrawn, });

        const iloDetails = await ILO_COLLECTIONS.iloListCollection.findOneAndUpdate(
            { contractAddress: this.simpleDetails.contractAddress, },
            { "$set": { additionalDetails, ethInvested, score, hasEnded, hasCreatorWithdrawn, }},
            { returnOriginal: false },
        );

        return iloDetails.value;
    }
}