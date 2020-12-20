import { DATABASE } from "../Global/database";

export const ILO_LIST_COLL_NAME = "ilo.list";

export class ILOCollections {
    public iloListCollection: any;

    async init() {
        console.log(`\nFetching ILO collections`);

        this.iloListCollection = await this.getIloListCollection();
    }

    async getIloListCollection(): Promise<any> {
        const collections = await DATABASE.db.listCollections({ name: ILO_LIST_COLL_NAME }).toArray();
        const iloListExists = collections.length > 0;
        if (iloListExists) return DATABASE.db.collection(ILO_LIST_COLL_NAME);

        console.log(`   ⛏️  Creating ${ILO_LIST_COLL_NAME} collection`);

        const iloListCollection = await DATABASE.db.createCollection(ILO_LIST_COLL_NAME, {
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
    }
}

export const ILO_COLLECTIONS = new ILOCollections();