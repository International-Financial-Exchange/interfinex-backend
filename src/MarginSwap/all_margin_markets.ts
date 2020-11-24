import { MARGIN_MARKET_COLLECTIONS, } from "./collections";
import { FACTORY } from "./factory";
import { newContract } from "../Global/web3";
import { EventEmitter } from "events";
import Web3 from "web3";
// import { humanizeTokenAmount } from "../Global/utils";

//@ts-ignore
const BN = Web3.utils.BN;
class AllMarginMarkets {
    public marginMarketListeners: MarginMarket[] = [];

    async start() {
        console.log(`\n🏁 Starting Swap Margin Market listeners`);

        await this.startAllSwapListeners();
    }

    async startAllSwapListeners() {
        const marginMarkets: { [key: string]: string }[] = await MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.find().toArray();

        FACTORY.events.on("NewMarginMarket", ({ marginMarketAddress }) => {
            console.log(`   🎧 Started listening to a new swap margin market at: ${marginMarketAddress}`);
            this.addMarginMarket(marginMarketAddress);
        });

        FACTORY.events.on("RemovedMarginMarket", ({ marginMarketAddress }) => {
            console.log(`   🎧 Stopped listening to a removed swap margin market at: ${marginMarketAddress}`);
            this.removeMarginMarket(marginMarketAddress);
        });

        const listeners = await Promise.all(
            marginMarkets.map(async ({ marginMarketAddress, assetTokenAddress, baseTokenAddress }) => 
                this.addMarginMarket(marginMarketAddress)
            )
        );

        console.log(`   🎧 Listening to ${listeners.length} swap margin markets`);
        // console.log(`   DEV: Margin Markets:`, marginMarkets);
    }

    async addMarginMarket(contract: string) {
        const marginMarket = new MarginMarket(contract);
        await marginMarket.start();
        this.marginMarketListeners.push(marginMarket);
    }

    async removeMarginMarket(contractToRemove: string) {
        const marginMarketToRemove = this.marginMarketListeners.find(marginMarket => marginMarket.contract.options.address === contractToRemove);
        if (marginMarketToRemove) {
            await marginMarketToRemove.stop();
            this.marginMarketListeners = this.marginMarketListeners.filter(marginMarket => marginMarket.contract.options.address !== contractToRemove);
        }
    }
}

type DepositWithdraw = {
    user: string, 
    assetTokenAmount: string,
    txId: string,
    isDeposit: boolean,
    timestamp: number
}

class MarginMarket {
    public contract: any;
    public collateralTokenAddress!: string;
    public assetTokenAddress!: string;
    public assetTokenDecimals!: number;
    public collateralTokenDecimals!: number;
    private eventEmitters: EventEmitter[] = [];
    private  fundingHistoryCollection!: any;

    constructor(contractAddress: string) {
        this.contract = newContract("MarginMarket", contractAddress);
    }
    
    async start() {
        const { 
            collateralTokenAddress, 
            assetTokenAddress, 
            assetTokenDecimals, 
            collateralTokenDecimals 
        } = await MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.findOne({ marginMarketAddress: this.contract.options.address });

        this.collateralTokenAddress = collateralTokenAddress;
        this.assetTokenAddress = assetTokenAddress;
        this.collateralTokenDecimals = collateralTokenDecimals;
        this.assetTokenDecimals = assetTokenDecimals;

        // console.log(this);

        await MARGIN_MARKET_COLLECTIONS.addFundingHistoryCollection(this.contract.options.address);
        this.fundingHistoryCollection = MARGIN_MARKET_COLLECTIONS.fundingHistoryCollections[this.contract.options.address];
        // await SWAP_COLLECTIONS.addCandleCollection(this.baseTokenAddress, this.assetTokenAddress);
        // await SWAP_COLLECTIONS.addCandleCollection(this.assetTokenAddress, this.baseTokenAddress);
        await this.startFundingListener();
    }

    async stop() {
        this.eventEmitters.map(emitter => {
            emitter.removeAllListeners("data");
            emitter.removeAllListeners("change");
        })
    }

    async startFundingListener() {
        const depositEmitter = this.contract.events.Deposit()
            .on("data", async (event: any) => {
                const deposit: DepositWithdraw = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: true,
                    timestamp: Date.now()
                };

                this.addEventToFundingHistory(deposit);
            })
            .on("change", async (event: any) => {
                const deposit: DepositWithdraw = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: true,
                    timestamp: Date.now()
                };

                this.removeEventFromFundingHistory(deposit);
            });

        const withdrawEmitter = this.contract.events.Withdraw()
            .on("data", async (event: any) => {
                const deposit: DepositWithdraw = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: false,
                    timestamp: Date.now()
                };
                
                this.addEventToFundingHistory(deposit);
            })
            .on("change", async (event: any) => {
                const deposit: DepositWithdraw = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: false,
                    timestamp: Date.now()
                };

                this.removeEventFromFundingHistory(deposit);
            });

        this.eventEmitters.push(depositEmitter);
        this.eventEmitters.push(withdrawEmitter);
    }

    async addEventToFundingHistory(event: DepositWithdraw) {
        await this.fundingHistoryCollection.insertOne(event);
    }

    async removeEventFromFundingHistory({ user, txId }: DepositWithdraw) {
        await this.fundingHistoryCollection.deleteOne({ user, txId });
    }

    // async addTradeToCandles(trade: Trade) {
    //     Promise.all(
    //         SwapCollections.candleTimeframes.map(async ({ timeframe }) => {
    //             // Insert candles for base/asset and asset/base
    //             const assetTokenAmount = humanizeTokenAmount(trade.assetTokenAmount, this.assetTokenDecimals);
    //             const baseTokenAmount = humanizeTokenAmount(trade.baseTokenAmount, this.collateralTokenDecimals);

    //             Promise.all([
    //                 {
    //                     candleCollection: SWAP_COLLECTIONS.candleCollections[this.baseTokenAddress][this.assetTokenAddress][timeframe],
    //                     assetPrice: baseTokenAmount / assetTokenAmount,
    //                     volume: baseTokenAmount,
    //                 },
    //                 {
    //                     candleCollection: SWAP_COLLECTIONS.candleCollections[this.assetTokenAddress][this.baseTokenAddress][timeframe],
    //                     assetPrice: assetTokenAmount / baseTokenAmount,
    //                     volume: assetTokenAmount,
    //                 }
    //             ].map(async ({ candleCollection, assetPrice, volume }) => {
    //                 const openTimestamp = Math.floor(Date.now() / timeframe) * timeframe;

    //                 // Get the current candle in this openTimestamp or create a new candle.
    //                 const lastCandle: Candle | undefined = await candleCollection.findOne({ openTimestamp });
    //                 const currentCandle: Candle = lastCandle ?? {
    //                     high: 0,
    //                     low: 0,
    //                     open: assetPrice,
    //                     close: 0,
    //                     volume: 0,
    //                     openTimestamp,
    //                 };
    
    //                 currentCandle.high = Math.max(currentCandle.high, assetPrice);
    //                 currentCandle.low = currentCandle.low === 0 ? assetPrice : Math.min(currentCandle.low, assetPrice);
    //                 currentCandle.close = assetPrice;
    //                 currentCandle.volume += volume;

    //                 if (timeframe === TIMEFRAMES["1m"]) {
    //                     console.log(trade);
    //                     console.log("last Candle", lastCandle);
    //                     console.log("current candle", currentCandle);
    //                 }
    
    //                 await candleCollection.updateOne({ openTimestamp }, { "$set": currentCandle }, { upsert: true });
    //             }))
    //         })
    //     );
    // }

    // async removeTradeFromCandles({ user, txId }: Trade) {
    //     const trade = await this.tradeHistoryCollection.findOne({ user, txId });

    //     await Promise.all(
    //         SwapCollections.candleTimeframes.map(async ({ timeframe }) => {
    //             const assetTokenAmount = humanizeTokenAmount(trade.assetTokenAmount, this.assetTokenDecimals);
    //             const baseTokenAmount = humanizeTokenAmount(trade.baseTokenAmount, this.collateralTokenDecimals);

    //             Promise.all(
    //                 [
    //                     {
    //                         candleCollection: SWAP_COLLECTIONS.candleCollections[this.baseTokenAddress][this.assetTokenAddress][timeframe],
    //                         volume: baseTokenAmount,
    //                     },
    //                     {
    //                         candleCollection: SWAP_COLLECTIONS.candleCollections[this.assetTokenAddress][this.baseTokenAddress][timeframe],
    //                         volume: assetTokenAmount,
    //                     }
    //                 ].map(async ({ candleCollection, volume }) => {
    //                     const openTimestamp = Math.floor(trade.timestamp / timeframe) * timeframe;
    //                     const candle: Candle = await candleCollection.findOne({ openTimestamp });
                        
    //                     // Simple update - just deduct the volume from the existing candle
    //                     // Possible TODO: Add in more fine-grained removal - Track the highest, lowest and close prices to see if they
    //                     // need updating too.
    //                     if (candle) {
    //                         candle.volume -= volume;
    //                         candleCollection.updateOne({ openTimestamp }, candle);
    //                     }
    //                 })
    //             )
    //         })
    //     );
    // }
}

export const ALL_MARGIN_MARKETS = new AllMarginMarkets();