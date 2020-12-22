import { humanizeTokenAmount } from "../Global/utils";
import { newContract } from "../Global/web3";
import { ILO_COLLECTIONS } from "./collections";
import { ILODetails, SimpleILODetails } from "./factory";

export type FixedPriceDetails = {
    tokensPerEth: number,
    totalAssetTokensBought: number,
};

type ILODeposit = {
    ethInvested: number,
    assetTokensBought: number,
    user: string,
    txId: string,
    timestamp: number,
};

export class FixedPrice {
    public simpleDetails: SimpleILODetails;
    public details!: ILODetails;
    public contract: any;
    private eventListeners: any[] = [];
    private depositHistoryCollection: any;

    constructor(simpleIloDetails: SimpleILODetails) {
        this.simpleDetails = simpleIloDetails;
        this.contract = newContract("FixedPricedILO", simpleIloDetails.contractAddress);
    }

    async start() {
        await ILO_COLLECTIONS.addDepositHistoryCollection(this.contract.options.address);
        this.depositHistoryCollection = ILO_COLLECTIONS.depositHistoryCollections[this.contract.options.address];

        this.details = await this.updateStats(); // Initialiser case

        await this.startDepositListener();
        await this.startStatsListener();
    }

    async startDepositListener() {
        const listener = this.contract.events.Invest()
            .on("data", async (event: any) => {
                const { investAmount, assetTokensBought, user } = event.returnValues;

                const deposit: ILODeposit = {
                    ethInvested: humanizeTokenAmount(investAmount.toString(), 18),
                    assetTokensBought: humanizeTokenAmount(assetTokensBought.toString(), this.details.assetToken.decimals),
                    user,
                    txId: event.transactionHash,
                    timestamp: Date.now(),
                };

                await this.depositHistoryCollection.insertOne(deposit);
            })
            .on("change", async (event: any) => {
                const { user } = event.returnValues;

                await this.depositHistoryCollection.deleteOne({ user, txId: event.transactionHash });
            });

        this.eventListeners.push(listener);
        
        // add this contract address to userILO's for the respective user
    }

    async startStatsListener() {
        const subscription = this.contract.events.allEvents({}, () => this.updateStats());
        this.eventListeners.push(subscription);
    }

    async updateStats(): Promise<ILODetails> {
        const additionalDetails: FixedPriceDetails = {
            tokensPerEth: parseInt(await this.contract.methods.tokensPerEth().call()),
            totalAssetTokensBought: parseInt(await this.contract.methods.totalAssetTokensBought().call()),
        };
        
        const hasEnded = await this.contract.methods.hasEnded().call();
        const hasCreatorWithdrawn = await this.contract.methods.hasCreatorWithdrawn().call();
        const ethInvested = additionalDetails.totalAssetTokensBought / additionalDetails.tokensPerEth;
        const score = 0;

        const iloDetails = await ILO_COLLECTIONS.iloListCollection.findOneAndUpdate(
            { contractAddress: this.simpleDetails.contractAddress, },
            { "$set": { additionalDetails, ethInvested, score, hasEnded, hasCreatorWithdrawn }},
            { returnOriginal: false },
        );

        return iloDetails.value;
    }

    async stop() {
        this.eventListeners.forEach(listener => {
            listener.unsubscribe();
        });
    }
}