import { humanizeTokenAmount } from "../../Global/utils";
import { newContract } from "../../Global/web3";
import { ILO_COLLECTIONS } from "../collections";
import { ILODetails, ILO_TO_ABI_NAME, ILO_TYPES, SimpleILODetails } from "../factory";

export type ILODeposit = {
    ethInvested: number,
    assetTokensBought: number,
    user: string,
    txId: string,
    timestamp: number,
};

// This is an extendable class that is used by other child classes
// e.g. FixedPriceListener, DutchAuctionListener etc. all extend this class with custom updateStats methods
export class ILOListener {
    public simpleDetails: SimpleILODetails;
    public details!: ILODetails;
    public contract: any;
    public type: ILO_TYPES;
    public eventListeners: any[] = [];
    public depositHistoryCollection: any;

    constructor(simpleIloDetails: SimpleILODetails, type: ILO_TYPES) {
        this.simpleDetails = simpleIloDetails;
        this.contract = newContract(ILO_TO_ABI_NAME[type], simpleIloDetails.contractAddress);
        this.type = type;
    }

    //@ts-ignore
    async updateStats(): Promise<ILODetails> {};

    getScore(ethInvested: number): number {
        console.log(this.details.startDate);
        const timeScore = this.details.startDate / 600000;
        const ethScore = Math.log(1 + ethInvested);
        
        return timeScore + ethScore;
    }

    async start() {
        await ILO_COLLECTIONS.addDepositHistoryCollection(this.contract.options.address);
        this.depositHistoryCollection = ILO_COLLECTIONS.depositHistoryCollections[this.contract.options.address];
        this.details = await ILO_COLLECTIONS.iloListCollection.findOne({ contractAddress: this.simpleDetails.contractAddress });

        await this.updateStats(); // Initialiser case
        await this.startDepositListener();
        await this.startStatsListener();
    }

    async startStatsListener() {
        const subscription = this.contract.events.allEvents(
            {}, 
            async () => this.details = await this.updateStats()
        );
        this.eventListeners.push(subscription);
    }

    async stop() {
        this.eventListeners.forEach(listener => {
            listener.unsubscribe();
        });
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
}