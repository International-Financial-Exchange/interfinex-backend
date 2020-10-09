import { SWAP_COLLECTIONS, SwapCollections } from "./collections";
import { FACTORY } from "./factory";
import exchangeArtifact from "./contracts/Exchange.json";
import { newContract } from "../Global/web3";
import { EventEmitter } from "events";
import Web3 from "web3";

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
    high: string,
    low: string,
    open: string,
    close: string,
    volume: string,
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

        FACTORY.factoryContract.events.NewExchange()
            .on("data", async ({ returnValues: { contract }}: any) => {
                console.log(`   🎧 Started listening to a new swap exchange at: ${contract}`);
                this.addExchange(contract);
            })
            .on("change", async ({ returnValues: { contract }}: any) => {
                this.removeExchange(contract);
            });

        const listeners = await Promise.all(
            exchanges.map(async ({ exchangeAddress }) => this.addExchange(exchangeAddress))
        );

        console.log(`   🎧 Listening to ${listeners.length} swap exchanges`);
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
    private swapEventEmitter!: EventEmitter;
    private tradesCollection: any;

    constructor(contractAddress: string) {
        this.contract = newContract(exchangeArtifact.abi, contractAddress);
    }
    
    async start() {
        await SWAP_COLLECTIONS.addTradeHistoryCollection(this.contract.options.address);
        await SWAP_COLLECTIONS.addCandleCollection(this.contract.options.address);
        this.tradesCollection = SWAP_COLLECTIONS.tradesCollections[this.contract.options.address];
        await this.startTradeListener();
    }

    async stop() {
        this.swapEventEmitter.removeAllListeners("data");
        this.swapEventEmitter.removeAllListeners("change");
    }

    async startTradeListener() {
        this.swapEventEmitter = this.contract.events.Swap()
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
                this.removeTradeFromHistory(event.transactionHash, event.returnValues.user);
            });
    }

    async addTradeToHistory(trade: Trade) {
        await this.tradesCollection.insertOne(trade);
    }

    async removeTradeFromHistory(txId: string, user: string) {
        await this.tradesCollection.deleteOne({ txId, user });
    }

    async addTradeToCandles(trade: Trade) {
        Promise.all(
            SwapCollections.candleTimeframes.map(async timeframe => {
                const candleCollection = SWAP_COLLECTIONS.candleCollections[this.contract.options.address][timeframe];
                const openTimestamp = Math.floor(Date.now() / timeframe) * timeframe;
                const assetPrice = new BN(Web3.utils.toWei(trade.assetTokenAmount)).div(new BN(trade.baseTokenAmount));

                // Get the current candle in this openTimestamp or create a new candle
                const lastCandle: Candle = await candleCollection.findOne({ openTimestamp });
                const currentCandle = lastCandle ?? {
                    high: "0",
                    low: "0",
                    open: assetPrice.toString(),
                    close: "0",
                    openTimestamp,
                };

                currentCandle.high = BN.max(new BN(currentCandle.high), assetPrice).toString();
                currentCandle.low = currentCandle.low === "0" ? assetPrice.toString() : BN.min(new BN(currentCandle.low), assetPrice).toString();
                currentCandle.close = assetPrice.toString();
                currentCandle.volume = new BN(currentCandle.volume).add(new BN(trade.baseTokenAmount)).toString();

                console.log("last Candle", lastCandle);
                console.log("current candle", currentCandle);

                await candleCollection.updateOne({ openTimestamp }, { "$set": currentCandle }, { upsert: true });
            })
        );
    }
}

export const ALL_EXCHANGES = new AllExchanges();