import { SWAP_COLLECTIONS, SwapCollections } from "./collections";
import { FACTORY } from "./factory";
import { newContract } from "../Global/web3";
import Web3 from "web3";
import { humanizeTokenAmount } from "../Global/utils";
import { TIMEFRAMES } from "../Global/constants";

//@ts-ignore
const BN = Web3.utils.BN;

type Trade = {
    baseTokenAmount: string,
    assetTokenAmount: string,
    isBuy: boolean,
    user: string,
    txId: string,
    timestamp: number,
};

type Candle = {
    high: number,
    low: number,
    open: number,
    close: number,
    volume: number,
    openTimestamp: number,
};

class AllExchanges {
    public exchanges: Exchange[] = [];

    async start() {
        console.log(`\n🏁 Starting Swap Exchange`);

        await this.startAllSwapListeners();
    }

    async startAllSwapListeners() {
        const exchanges: { [key: string]: string }[] = await SWAP_COLLECTIONS.exchangesCollection.find().toArray();

        FACTORY.events.on("NewExchange", ({ exchangeAddress }) => {
            console.log(`   🎧 Started listening to a new swap exchange at: ${exchangeAddress}`);
            this.addExchange(exchangeAddress);
        });

        FACTORY.events.on("RemovedExchange", ({ exchangeAddress }) => {
            console.log(`   🎧 Stopped listening to a removed swap exchange at: ${exchangeAddress}`);
            this.removeExchange(exchangeAddress);
        });

        const listeners = await Promise.all(
            exchanges.map(async ({ exchangeAddress, assetTokenAddress, baseTokenAddress }) => 
                this.addExchange(exchangeAddress)
            )
        );

        console.log(`   🎧 Listening to ${listeners.length} swap exchanges`);
        // console.log(`   DEV: Deployed Exchanges:`, exchanges);
    }

    async addExchange(contract: string) {
        const exchange = new Exchange(contract);
        await exchange.start();
        this.exchanges.push(exchange);
    }

    async removeExchange(contractToRemove: string) {
        const exchangeToRemove = this.exchanges.find(exchange => exchange.contract === contractToRemove);
        if (exchangeToRemove) {
            exchangeToRemove.stop();
        }
    }
}

class Exchange {
    public contract: any;
    public baseTokenAddress!: string;
    public assetTokenAddress!: string;
    public assetTokenDecimals!: number;
    public baseTokenDecimals!: number;
    private swapListener!: any;
    private tradeHistoryCollection: any;

    constructor(contractAddress: string) {
        this.contract = newContract("SwapExchange", contractAddress);
    }
    
    async start() {
        const { 
            baseTokenAddress, 
            assetTokenAddress, 
            assetTokenDecimals, 
            baseTokenDecimals 
        } = await SWAP_COLLECTIONS.exchangesCollection.findOne({ exchangeAddress: this.contract.options.address });

        this.baseTokenAddress = baseTokenAddress;
        this.assetTokenAddress = assetTokenAddress;
        this.baseTokenDecimals = baseTokenDecimals;
        this.assetTokenDecimals = assetTokenDecimals;

        await SWAP_COLLECTIONS.addTradeHistoryCollection(this.contract.options.address);
        await SWAP_COLLECTIONS.addCandleCollection(this.baseTokenAddress, this.assetTokenAddress);
        await SWAP_COLLECTIONS.addCandleCollection(this.assetTokenAddress, this.baseTokenAddress);
        this.tradeHistoryCollection = SWAP_COLLECTIONS.tradeHistoryCollections[this.contract.options.address];
        await this.startTradeListener();
    }

    async stop() {
        this.swapListener.unsubscribe();
    }

    async startTradeListener() {
        this.swapListener = this.contract.events.Swap()
            .on("data", async (event: any) => {
                const trade: Trade = {
                    baseTokenAmount: event.returnValues.base_token_amount,
                    assetTokenAmount: event.returnValues.asset_token_amount,
                    isBuy: event.returnValues.is_buy,
                    user: event.returnValues.user,
                    txId: event.transactionHash,
                    timestamp: Date.now(),
                };

                this.addTradeToHistory(trade);
                this.addTradeToCandles(trade);
            })
            .on("change", async (event: any) => {
                const trade: Trade = {
                    baseTokenAmount: event.returnValues.base_token_amount,
                    assetTokenAmount: event.returnValues.asset_token_amount,
                    isBuy: event.returnValues.is_buy,
                    user: event.returnValues.user,
                    txId: event.transactionHash,
                    timestamp: Date.now(),
                };

                this.removeTradeFromHistory(trade);
                this.removeTradeFromCandles(trade);
            });
    }

    async addTradeToHistory(trade: Trade) {
        await this.tradeHistoryCollection.insertOne(trade);
    }

    async removeTradeFromHistory({ user, txId }: Trade) {
        await this.tradeHistoryCollection.deleteOne({ user, txId });
    }

    async addTradeToCandles(trade: Trade) {
        Promise.all(
            SwapCollections.candleTimeframes.map(async ({ timeframe }) => {
                // Insert candles for base/asset and asset/base
                const assetTokenAmount = humanizeTokenAmount(trade.assetTokenAmount, this.assetTokenDecimals);
                const baseTokenAmount = humanizeTokenAmount(trade.baseTokenAmount, this.baseTokenDecimals);

                Promise.all([
                    {
                        candleCollection: SWAP_COLLECTIONS.candleCollections[this.baseTokenAddress][this.assetTokenAddress][timeframe],
                        assetPrice: baseTokenAmount / assetTokenAmount,
                        volume: baseTokenAmount,
                    },
                    {
                        candleCollection: SWAP_COLLECTIONS.candleCollections[this.assetTokenAddress][this.baseTokenAddress][timeframe],
                        assetPrice: assetTokenAmount / baseTokenAmount,
                        volume: assetTokenAmount,
                    }
                ].map(async ({ candleCollection, assetPrice, volume }) => {
                    const openTimestamp = Math.floor(Date.now() / timeframe) * timeframe;

                    // Get the current candle in this openTimestamp or create a new candle.
                    const lastCandle: Candle | undefined = await candleCollection.findOne({ openTimestamp });
                    const currentCandle: Candle = lastCandle ?? {
                        high: 0,
                        low: 0,
                        open: assetPrice,
                        close: 0,
                        volume: 0,
                        openTimestamp,
                    };
    
                    currentCandle.high = Math.max(currentCandle.high, assetPrice);
                    currentCandle.low = currentCandle.low === 0 ? assetPrice : Math.min(currentCandle.low, assetPrice);
                    currentCandle.close = assetPrice;
                    currentCandle.volume += volume;

                    if (timeframe === TIMEFRAMES["1m"]) {
                        console.log(trade);
                        console.log("last Candle", lastCandle);
                        console.log("current candle", currentCandle);
                    }
    
                    await candleCollection.updateOne({ openTimestamp }, { "$set": currentCandle }, { upsert: true });
                }))
            })
        );
    }

    async removeTradeFromCandles({ user, txId }: Trade) {
        const trade = await this.tradeHistoryCollection.findOne({ user, txId });

        await Promise.all(
            SwapCollections.candleTimeframes.map(async ({ timeframe }) => {
                const assetTokenAmount = humanizeTokenAmount(trade.assetTokenAmount, this.assetTokenDecimals);
                const baseTokenAmount = humanizeTokenAmount(trade.baseTokenAmount, this.baseTokenDecimals);

                Promise.all(
                    [
                        {
                            candleCollection: SWAP_COLLECTIONS.candleCollections[this.baseTokenAddress][this.assetTokenAddress][timeframe],
                            volume: baseTokenAmount,
                        },
                        {
                            candleCollection: SWAP_COLLECTIONS.candleCollections[this.assetTokenAddress][this.baseTokenAddress][timeframe],
                            volume: assetTokenAmount,
                        }
                    ].map(async ({ candleCollection, volume }) => {
                        const openTimestamp = Math.floor(trade.timestamp / timeframe) * timeframe;
                        const candle: Candle = await candleCollection.findOne({ openTimestamp });
                        
                        // Simple update - just deduct the volume from the existing candle
                        // Possible TODO: Add in more fine-grained removal - Track the highest, lowest and close prices to see if they
                        // need updating too.
                        if (candle) {
                            candle.volume -= volume;
                            candleCollection.updateOne({ openTimestamp }, candle);
                        }
                    })
                )
            })
        );
    }
}

export const ALL_EXCHANGES = new AllExchanges();