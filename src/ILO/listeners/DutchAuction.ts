import { humanizeTokenAmount } from "../../Global/utils";
import { ILO_COLLECTIONS } from "../collections";
import { ILODetails, ILO_TYPES, SimpleILODetails } from "../factory";
import { ILOListener } from "./ILO";

export type DutchAuctionDetails = {
    totalAssetTokensBought: string,
    endTokensPerEth: string,
    startTokensPerEth: string,
};

export class DutchAuctionListener extends ILOListener {
    constructor(simpleIloDetails: SimpleILODetails) {
        super(simpleIloDetails, ILO_TYPES.DutchAuction);
    }

    async updateStats(): Promise<ILODetails> {
        const additionalDetails: DutchAuctionDetails = {
            totalAssetTokensBought: await this.contract.methods.totalAssetTokensBought().call(),
            startTokensPerEth: await this.contract.methods.startTokensPerEth().call(),
            endTokensPerEth: await this.contract.methods.endTokensPerEth().call(),
        };
        
        const hasEnded = await this.contract.methods.hasEnded().call();
        const hasCreatorWithdrawn = await this.contract.methods.hasCreatorWithdrawn().call();
        const ethInvested: number = humanizeTokenAmount(await this.contract.methods.etherAmountRaised().call(), 18);
        const score = this.getScore(ethInvested);

        const iloDetails = await ILO_COLLECTIONS.iloListCollection.findOneAndUpdate(
            { contractAddress: this.simpleDetails.contractAddress, },
            { "$set": { additionalDetails, ethInvested, score, hasEnded, hasCreatorWithdrawn }},
            { returnOriginal: false },
        );

        return iloDetails.value;
    }
}