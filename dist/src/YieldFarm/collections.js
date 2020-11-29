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
exports.YIELD_FARM_COLLECTIONS = exports.YieldFarmCollections = exports.FARMS_COLL_NAME = void 0;
const database_1 = require("../Global/database");
exports.FARMS_COLL_NAME = "yieldfarm.farms";
class YieldFarmCollections {
    constructor() {
        this.tradeHistoryCollections = {};
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\nFetching Yield Farm collections`);
            this.farmsCollection = yield this.getFarmCollection();
        });
    }
    getFarmCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            const collections = yield database_1.DATABASE.db.listCollections({ name: exports.FARMS_COLL_NAME }).toArray();
            const farmsExists = collections.length > 0;
            if (farmsExists)
                return database_1.DATABASE.db.collection(exports.FARMS_COLL_NAME);
            console.log(`   ⛏️  Creating ${exports.FARMS_COLL_NAME} collection`);
            const farmsCollection = yield database_1.DATABASE.db.createCollection(exports.FARMS_COLL_NAME, {
                "validator": {
                    "$jsonSchema": {
                        "bsonType": "object",
                        "required": ["liquidityTokenContract", "token0Address", "token1Address",],
                        "properties": {
                            "liquidityTokenContract": { "bsonType": "string" },
                            "token0Address": { "bsonType": "string" },
                            "token1Address": { "bsonType": "string" },
                            "yieldPerBlock": { "bsonType": "string" },
                        }
                    }
                }
            });
            return farmsCollection;
        });
    }
}
exports.YieldFarmCollections = YieldFarmCollections;
exports.YIELD_FARM_COLLECTIONS = new YieldFarmCollections();
//# sourceMappingURL=collections.js.map