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
exports.ILO_COLLECTIONS = exports.ILOCollections = exports.ILO_LIST_COLL_NAME = void 0;
const database_1 = require("../Global/database");
exports.ILO_LIST_COLL_NAME = "ilo.list";
class ILOCollections {
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\nFetching ILO collections`);
            this.iloListCollection = yield this.getIloListCollection();
        });
    }
    getIloListCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            const collections = yield database_1.DATABASE.db.listCollections({ name: exports.ILO_LIST_COLL_NAME }).toArray();
            const iloListExists = collections.length > 0;
            if (iloListExists)
                return database_1.DATABASE.db.collection(exports.ILO_LIST_COLL_NAME);
            console.log(`   ⛏️  Creating ${exports.ILO_LIST_COLL_NAME} collection`);
            const iloListCollection = yield database_1.DATABASE.db.createCollection(exports.ILO_LIST_COLL_NAME, {
                "validator": {
                    "$jsonSchema": {
                        "bsonType": "object",
                        "required": [
                            "contractAddress",
                            "name",
                            "description",
                            "id",
                            "type",
                            "assetToken",
                            "assetTokenAmount",
                            "startDate",
                            "endDate",
                            "softCap",
                            "percentageToLock",
                            "liquidityUnlockDate",
                            "score",
                            "ethInvested",
                            "creationDate",
                            "hasEnded",
                        ],
                        "properties": {
                            "contractAddress": { "bsonType": "string" },
                            "name": { "bsonType": "string" },
                            "description": { "bsonType": "string" },
                            "id": { "bsonType": ["int", "double"] },
                            "type": { "bsonType": ["int", "double"] },
                            "assetToken": {
                                "bsonType": "object",
                                "properties": {
                                    "name": { "bsonType": "string" },
                                    "symbol": { "bsonType": "string" },
                                    "decimals": { "bsonType": ["int", "double"] },
                                    "address": { "bsonType": "string" },
                                }
                            },
                            "assetTokenAmount": { "bsonType": ["int", "double"] },
                            "startDate": { "bsonType": ["int", "double"] },
                            "endDate": { "bsonType": ["int", "double"] },
                            "softCap": { "bsonType": ["int", "double"] },
                            "percentageToLock": { "bsonType": ["int", "double"] },
                            "liquidityUnlockDate": { "bsonType": ["int", "double"] },
                            "score": { "bsonType": ["int", "double"] },
                            "ethInvested": { "bsonType": ["int", "double"] },
                            "creationDate": { "bsonType": ["int", "double"] },
                            "hasEnded": { "bsonType": "bool" },
                            "additionalDetails": { "bsonType": "object" },
                        }
                    }
                }
            });
            return iloListCollection;
        });
    }
}
exports.ILOCollections = ILOCollections;
exports.ILO_COLLECTIONS = new ILOCollections();
//# sourceMappingURL=collections.js.map