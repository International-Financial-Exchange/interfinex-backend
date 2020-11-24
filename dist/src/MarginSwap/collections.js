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
exports.MARGIN_MARKET_COLLECTIONS = exports.MarginMarketCollections = exports.MARGIN_MARKETS_COLL_NAME = void 0;
const database_1 = require("../Global/database");
exports.MARGIN_MARKETS_COLL_NAME = "swap.margin.markets";
class MarginMarketCollections {
    constructor() {
        this.fundingHistoryCollections = {};
        this.positionCollections = {};
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\nFetching Margin Market collections`);
            this.marginMarketsCollection = yield this.getMarginMarketsCollection();
        });
    }
    getMarginMarketsCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            const collections = yield database_1.DATABASE.db.listCollections({ name: exports.MARGIN_MARKETS_COLL_NAME }).toArray();
            const marginMarketsExists = collections.length > 0;
            if (marginMarketsExists)
                return database_1.DATABASE.db.collection(exports.MARGIN_MARKETS_COLL_NAME);
            console.log(`   ⛏️  Creating ${exports.MARGIN_MARKETS_COLL_NAME} collection`);
            const marginMarketsCollection = yield database_1.DATABASE.db.createCollection(exports.MARGIN_MARKETS_COLL_NAME, {
                "validator": {
                    "$jsonSchema": {
                        "bsonType": "object",
                        "required": ["assetTokenAddress", "collateralTokenAddress", "marginMarketAddress", "collateralTokenDecimals", "assetTokenDecimals"],
                        "properties": {
                            "assetTokenAddress": { "bsonType": "string" },
                            "collateralTokenAddress": { "bsonType": "string" },
                            "assetTokenDecimals": { "bsonType": "int" },
                            "collateralTokenDecimals": { "bsonType": "int" },
                            "marginMarketAddress": { "bsonType": "string" }
                        }
                    }
                }
            });
            return marginMarketsCollection;
        });
    }
    addFundingHistoryCollection(marginMarketAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const FUNDING_COLL_NAME = `swap.margin.fundingHistory.${marginMarketAddress}`;
            let fundingCollExists = (yield database_1.DATABASE.db.listCollections({ name: FUNDING_COLL_NAME }).toArray())[0];
            if (!fundingCollExists) {
                console.log(`   ⛏️  Creating ${FUNDING_COLL_NAME} collection`);
                yield database_1.DATABASE.db.createCollection(FUNDING_COLL_NAME, {
                    "validator": {
                        "$jsonSchema": {
                            "bsonType": "object",
                            "required": ["isDeposit", "assetTokenAmount", "user", "txId", "timestamp"],
                            "properties": {
                                "isDeposit": { "bsonType": "bool" },
                                "assetTokenAmount": { "bsonType": "string" },
                                "isBuy": { "bsonType": "bool" },
                                "user": { "bsonType": "string" },
                                "txId": { "bsonType": "string" },
                                "timestamp": { "bsonType": "double" }
                            }
                        }
                    }
                });
                // Remove history after a week
                database_1.DATABASE.db.collection(FUNDING_COLL_NAME).createIndex({ "timestamp": 1 }, { expireAfterSeconds: 1000 * 60 * 60 * 24 * 7 });
                database_1.DATABASE.db.collection(FUNDING_COLL_NAME).createIndex({ "user": 1, "txId": 1 });
            }
            this.fundingHistoryCollections[marginMarketAddress] = yield database_1.DATABASE.db.collection(FUNDING_COLL_NAME);
        });
    }
    addPositionsCollection(marginMarketAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const POSITIONS_COLL_NAME = `swap.margin.positions.${marginMarketAddress}`;
            let positionsCollExists = (yield database_1.DATABASE.db.listCollections({ name: POSITIONS_COLL_NAME }).toArray())[0];
            if (!positionsCollExists) {
                console.log(`   ⛏️  Creating ${POSITIONS_COLL_NAME} collection`);
                yield database_1.DATABASE.db.createCollection(POSITIONS_COLL_NAME, {
                    "validator": {
                        "$jsonSchema": {
                            "bsonType": "object",
                            "required": ["user", "collateralisationRatio", "originalBorrowedAmount", "collateralAmount", "maintenanceMargin", "lastInterestIndex"],
                            "properties": {
                                "user": { "bsonType": "string" },
                                "collateralisationRatio": { "bsonType": "double" },
                                "originalBorrowedAmount": { "bsonType": "string" },
                                "collateralAmount": { "bsonType": "string" },
                                "maintenanceMargin": { "bsonType": "string" },
                                "lastInterestIndex": { "bsonType": "string" },
                            }
                        }
                    }
                });
                database_1.DATABASE.db.collection(POSITIONS_COLL_NAME).createIndex({ "user": 1, });
                database_1.DATABASE.db.collection(POSITIONS_COLL_NAME).createIndex({ "collateralisationRatio": 1, });
            }
            this.positionCollections[marginMarketAddress] = yield database_1.DATABASE.db.collection(POSITIONS_COLL_NAME);
        });
    }
}
exports.MarginMarketCollections = MarginMarketCollections;
exports.MARGIN_MARKET_COLLECTIONS = new MarginMarketCollections();
//# sourceMappingURL=collections.js.map