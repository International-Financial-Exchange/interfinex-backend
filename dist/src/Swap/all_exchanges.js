"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_EXCHANGES = void 0;
const collections_1 = require("./collections");
const factory_1 = require("./factory");
const web3_1 = require("../Global/web3");
const web3_2 = __importDefault(require("web3"));
const utils_1 = require("../Global/utils");
const constants_1 = require("../Global/constants");
//@ts-ignore
const BN = web3_2.default.utils.BN;
class AllExchanges {
    constructor() {
        this.exchanges = [];
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\n🏁 Starting Swap Exchange`);
            yield this.startAllSwapListeners();
        });
    }
    startAllSwapListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            const exchanges = yield collections_1.SWAP_COLLECTIONS.exchangesCollection.find().toArray();
            factory_1.FACTORY.events.on("NewExchange", ({ exchangeAddress }) => {
                console.log(`   🎧 Started listening to a new swap exchange at: ${exchangeAddress}`);
                this.addExchange(exchangeAddress);
            });
            factory_1.FACTORY.events.on("RemovedExchange", ({ exchangeAddress }) => {
                console.log(`   🎧 Stopped listening to a removed swap exchange at: ${exchangeAddress}`);
                this.removeExchange(exchangeAddress);
            });
            const listeners = yield Promise.all(exchanges.map(({ exchangeAddress, assetTokenAddress, baseTokenAddress }) => __awaiter(this, void 0, void 0, function* () { return this.addExchange(exchangeAddress); })));
            console.log(`   🎧 Listening to ${listeners.length} swap exchanges`);
            // console.log(`   DEV: Deployed Exchanges:`, exchanges);
        });
    }
    addExchange(contract) {
        return __awaiter(this, void 0, void 0, function* () {
            const exchange = new Exchange(contract);
            yield exchange.start();
            this.exchanges.push(exchange);
        });
    }
    removeExchange(contractToRemove) {
        return __awaiter(this, void 0, void 0, function* () {
            const exchangeToRemove = this.exchanges.find(exchange => exchange.contract === contractToRemove);
            if (exchangeToRemove) {
                exchangeToRemove.stop();
            }
        });
    }
}
class Exchange {
    constructor(contractAddress) {
        this.contract = web3_1.newContract("SwapExchange", contractAddress);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const { baseTokenAddress, assetTokenAddress, assetTokenDecimals, baseTokenDecimals } = yield collections_1.SWAP_COLLECTIONS.exchangesCollection.findOne({ exchangeAddress: this.contract.options.address });
            this.baseTokenAddress = baseTokenAddress;
            this.assetTokenAddress = assetTokenAddress;
            this.baseTokenDecimals = baseTokenDecimals;
            this.assetTokenDecimals = assetTokenDecimals;
            yield collections_1.SWAP_COLLECTIONS.addTradeHistoryCollection(this.contract.options.address);
            yield collections_1.SWAP_COLLECTIONS.addCandleCollection(this.baseTokenAddress, this.assetTokenAddress);
            yield collections_1.SWAP_COLLECTIONS.addCandleCollection(this.assetTokenAddress, this.baseTokenAddress);
            this.tradeHistoryCollection = collections_1.SWAP_COLLECTIONS.tradeHistoryCollections[this.contract.options.address];
            yield this.startTradeListener();
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.swapListener.unsubscribe();
        });
    }
    startTradeListener() {
        return __awaiter(this, void 0, void 0, function* () {
            this.swapListener = this.contract.events.Swap()
                .on("data", (event) => __awaiter(this, void 0, void 0, function* () {
                const trade = {
                    baseTokenAmount: event.returnValues.base_token_amount,
                    assetTokenAmount: event.returnValues.asset_token_amount,
                    isBuy: event.returnValues.is_buy,
                    user: event.returnValues.user,
                    txId: event.transactionHash,
                    timestamp: Date.now(),
                };
                this.addTradeToHistory(trade);
                this.addTradeToCandles(trade);
            }))
                .on("change", (event) => __awaiter(this, void 0, void 0, function* () {
                const trade = {
                    baseTokenAmount: event.returnValues.base_token_amount,
                    assetTokenAmount: event.returnValues.asset_token_amount,
                    isBuy: event.returnValues.is_buy,
                    user: event.returnValues.user,
                    txId: event.transactionHash,
                    timestamp: Date.now(),
                };
                this.removeTradeFromHistory(trade);
                this.removeTradeFromCandles(trade);
            }));
        });
    }
    addTradeToHistory(trade) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.tradeHistoryCollection.insertOne(trade);
        });
    }
    removeTradeFromHistory({ user, txId }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.tradeHistoryCollection.deleteOne({ user, txId });
        });
    }
    addTradeToCandles(trade) {
        return __awaiter(this, void 0, void 0, function* () {
            Promise.all(collections_1.SwapCollections.candleTimeframes.map(({ timeframe }) => __awaiter(this, void 0, void 0, function* () {
                // Insert candles for base/asset and asset/base
                const assetTokenAmount = utils_1.humanizeTokenAmount(trade.assetTokenAmount, this.assetTokenDecimals);
                const baseTokenAmount = utils_1.humanizeTokenAmount(trade.baseTokenAmount, this.baseTokenDecimals);
                Promise.all([
                    {
                        candleCollection: collections_1.SWAP_COLLECTIONS.candleCollections[this.baseTokenAddress][this.assetTokenAddress][timeframe],
                        assetPrice: baseTokenAmount / assetTokenAmount,
                        volume: baseTokenAmount,
                    },
                    {
                        candleCollection: collections_1.SWAP_COLLECTIONS.candleCollections[this.assetTokenAddress][this.baseTokenAddress][timeframe],
                        assetPrice: assetTokenAmount / baseTokenAmount,
                        volume: assetTokenAmount,
                    }
                ].map(({ candleCollection, assetPrice, volume }) => __awaiter(this, void 0, void 0, function* () {
                    const openTimestamp = Math.floor(Date.now() / timeframe) * timeframe;
                    // Get the current candle in this openTimestamp or create a new candle.
                    const lastCandle = yield candleCollection.findOne({ openTimestamp });
                    const currentCandle = lastCandle !== null && lastCandle !== void 0 ? lastCandle : {
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
                    if (timeframe === constants_1.TIMEFRAMES["1m"]) {
                        console.log(trade);
                        console.log("last Candle", lastCandle);
                        console.log("current candle", currentCandle);
                    }
                    yield candleCollection.updateOne({ openTimestamp }, { "$set": currentCandle }, { upsert: true });
                })));
            })));
        });
    }
    removeTradeFromCandles({ user, txId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const trade = yield this.tradeHistoryCollection.findOne({ user, txId });
            yield Promise.all(collections_1.SwapCollections.candleTimeframes.map(({ timeframe }) => __awaiter(this, void 0, void 0, function* () {
                const assetTokenAmount = utils_1.humanizeTokenAmount(trade.assetTokenAmount, this.assetTokenDecimals);
                const baseTokenAmount = utils_1.humanizeTokenAmount(trade.baseTokenAmount, this.baseTokenDecimals);
                Promise.all([
                    {
                        candleCollection: collections_1.SWAP_COLLECTIONS.candleCollections[this.baseTokenAddress][this.assetTokenAddress][timeframe],
                        volume: baseTokenAmount,
                    },
                    {
                        candleCollection: collections_1.SWAP_COLLECTIONS.candleCollections[this.assetTokenAddress][this.baseTokenAddress][timeframe],
                        volume: assetTokenAmount,
                    }
                ].map(({ candleCollection, volume }) => __awaiter(this, void 0, void 0, function* () {
                    const openTimestamp = Math.floor(trade.timestamp / timeframe) * timeframe;
                    const candle = yield candleCollection.findOne({ openTimestamp });
                    // Simple update - just deduct the volume from the existing candle
                    // Possible TODO: Add in more fine-grained removal - Track the highest, lowest and close prices to see if they
                    // need updating too.
                    if (candle) {
                        candle.volume -= volume;
                        candleCollection.updateOne({ openTimestamp }, candle);
                    }
                })));
            })));
        });
    }
}
exports.ALL_EXCHANGES = new AllExchanges();
//# sourceMappingURL=all_exchanges.js.map