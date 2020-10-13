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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SWAP_COLLECTIONS = exports.SwapCollections = exports.EXCHANGES_COLL_NAME = void 0;
const database_1 = require("../Global/database");
const constants_1 = require("../Global/constants");
const utils_1 = require("../Global/utils");
exports.EXCHANGES_COLL_NAME = "swap.exchanges";
class SwapCollections {
    constructor() {
        this.tradeHistoryCollections = {};
        this.candleCollections = {};
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Fetching Swap collections`);
            this.exchangesCollection = yield this.getExchangeCollection();
        });
    }
    getExchangeCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            const collections = yield database_1.DATABASE.db.listCollections({ name: exports.EXCHANGES_COLL_NAME }).toArray();
            const exchangesExists = collections.length > 0;
            if (exchangesExists)
                return database_1.DATABASE.db.collection(exports.EXCHANGES_COLL_NAME);
            console.log(`   ⛏️  Creating ${exports.EXCHANGES_COLL_NAME} collection`);
            const exchangesCollection = yield database_1.DATABASE.db.createCollection(exports.EXCHANGES_COLL_NAME, {
                "validator": {
                    "$jsonSchema": {
                        "bsonType": "object",
                        "required": ["assetTokenAddress", "baseTokenAddress", "exchangeAddress"],
                        "properties": {
                            "assetTokenAddress": { "bsonType": "string" },
                            "baseTokenAddress": { "bsonType": "string" },
                            "exchangeAddress": { "bsonType": "string" }
                        }
                    }
                }
            });
            return exchangesCollection;
        });
    }
    addTradeHistoryCollection(exchangeAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const TRADES_COLL_NAME = `swap.tradeHistory.${exchangeAddress}`;
            let tradesCollExists = (yield database_1.DATABASE.db.listCollections({ name: TRADES_COLL_NAME }).toArray())[0];
            if (!tradesCollExists) {
                console.log(`   ⛏️  Creating ${TRADES_COLL_NAME} collection`);
                yield database_1.DATABASE.db.createCollection(TRADES_COLL_NAME, {
                    "validator": {
                        "$jsonSchema": {
                            "bsonType": "object",
                            "required": ["baseTokenAmount", "assetTokenAmount", "isBuy", "user", "txId", "timestamp"],
                            "properties": {
                                "baseTokenAmount": { "bsonType": "string" },
                                "assetTokenAmount": { "bsonType": "string" },
                                "isBuy": { "bsonType": "bool" },
                                "user": { "bsonType": "string" },
                                "txId": { "bsonType": "string" },
                                "timestamp": { "bsonType": "double" }
                            }
                        }
                    }
                });
                // Remove trades after a week
                database_1.DATABASE.db.collection(TRADES_COLL_NAME).createIndex({ "timestamp": 1 }, { expireAfterSeconds: 1000 * 60 * 60 * 24 * 7 });
                database_1.DATABASE.db.collection(TRADES_COLL_NAME).createIndex({ "user": 1, "txId": 1 });
            }
            this.tradeHistoryCollections[exchangeAddress] = yield database_1.DATABASE.db.collection(TRADES_COLL_NAME);
        });
    }
    addCandleCollection(baseTokenAddress, assetTokenAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(SwapCollections.candleTimeframes.map(({ timeframe, stalePeriod }) => __awaiter(this, void 0, void 0, function* () {
                const CANDLES_COLL_NAME = `swap.candles.${timeframe}.${baseTokenAddress}.${assetTokenAddress}`;
                let candlesCollExists = (yield database_1.DATABASE.db.listCollections({ name: CANDLES_COLL_NAME }).toArray()).first();
                if (!candlesCollExists) {
                    console.log(`   ⛏️  Creating ${CANDLES_COLL_NAME} collection`);
                    yield database_1.DATABASE.db.createCollection(CANDLES_COLL_NAME, {
                        "validator": {
                            "$jsonSchema": {
                                "bsonType": "object",
                                "required": ["high", "low", "open", "close", "volume", "openTimestamp"],
                                "properties": {
                                    "high": { "bsonType": "string" },
                                    "low": { "bsonType": "string" },
                                    "open": { "bsonType": "string" },
                                    "close": { "bsonType": "string" },
                                    "volume": { "bsonType": "string" },
                                    "openTimestamp": { "bsonType": "double" },
                                }
                            }
                        }
                    });
                    // Remove any stale candles using a TTL index
                    // stalePeriod can be undefined, in which case candles will never expire
                    database_1.DATABASE.db.collection(CANDLES_COLL_NAME).createIndex({ "openTimestamp": 1 }, utils_1.removeEmptyFields({ expireAfterSeconds: stalePeriod }));
                }
                if (!this.candleCollections[baseTokenAddress])
                    this.candleCollections[baseTokenAddress] = {};
                if (!this.candleCollections[baseTokenAddress][assetTokenAddress])
                    this.candleCollections[baseTokenAddress][assetTokenAddress] = {};
                this.candleCollections[baseTokenAddress][assetTokenAddress][timeframe] = yield database_1.DATABASE.db.collection(CANDLES_COLL_NAME);
            })));
        });
    }
}
exports.SwapCollections = SwapCollections;
SwapCollections.candleTimeframes = [
    { timeframe: constants_1.TIMEFRAMES["1m"], stalePeriod: 1000 * 60 * 60 * 24 },
    { timeframe: constants_1.TIMEFRAMES["15m"], stalePeriod: 1000 * 60 * 60 * 24 * 7 },
    { timeframe: constants_1.TIMEFRAMES["4h"], }
];
exports.SWAP_COLLECTIONS = new SwapCollections();
//# sourceMappingURL=collections.js.map