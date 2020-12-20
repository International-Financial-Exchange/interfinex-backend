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
                        "type",
                        "assetToken",
                        "assetTokenAmount",
                        "startDate", 
                        "endDate", 
                        "softCap",
                        "percentageToLock",
                        "liquidityUnlockDate"
                    ],
                    "properties": {
                        "contractAddress": { "bsonType": "string" },
                        "name": { "bsonType": "string" },
                        "description": { "bsonType": "string" },
                        "type": { "bsonType": "int" },
                        "assetToken": { 
                            "bsonType": "object",
                            "properties": {
                                "name": { "bsonType": "string" },
                                "symbol": { "bsonType": "string" },
                                "decimals": { "bsonType": "int" },
                                "address": { "bsonType": "string" },
                            }
                        },
                        "assetTokenAmount": { "bsonType": "int" },
                        "startDate": { "bsonType": "int" },
                        "endDate": { "bsonType": "int" },
                        "softCap": { "bsonType": "int" },
                        "percentageToLock": { "bsonType": "int" },
                        "liquidityUnlockDate": { "bsonType": "int" },
                        "additionalDetails": { "bsonType": "object" },
                    }
                }
            }
        });

        return iloListCollection;
    }
}

export const ILO_COLLECTIONS = new ILOCollections();