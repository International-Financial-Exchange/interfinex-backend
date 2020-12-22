import { DATABASE } from "../Global/database";

export const ILO_LIST_COLL_NAME = "ilo.list";

export class ILOCollections {
    public iloListCollection: any;
    public depositHistoryCollections: { [contractAddress: string]: any } = {};

    async init() {
        console.log(`\nFetching ILO collections`);

        this.iloListCollection = await this.getIloListCollection();
    }

    async addDepositHistoryCollection(contractAddress: string): Promise<any> {
        const DEPOSITS_COLL_NAME = `ilo.depositHistory.${contractAddress}`;
        let collExists = (await DATABASE.db.listCollections({ name: DEPOSITS_COLL_NAME }).toArray())[0];
        if (!collExists) {
            console.log(`   ⛏️  Creating ${DEPOSITS_COLL_NAME} collection`);
            await DATABASE.db.createCollection(DEPOSITS_COLL_NAME, {
                "validator": {
                    "$jsonSchema": { 
                        "bsonType": "object",
                        "required": ["ethInvested", "assetTokensBought", "user", "txId", "timestamp"],
                        "properties": {
                            "ethInvested": { "bsonType": ["int", "double"] },
                            "assetTokensBought": { "bsonType": ["int", "double"] },
                            "user": { "bsonType": "string" },
                            "txId": { "bsonType": "string" },
                            "timestamp": { "bsonType": ["int", "double"] },
                        }
                    }
                }
            });

            DATABASE.db.collection(DEPOSITS_COLL_NAME).createIndex({ "timestamp": -1, });
            DATABASE.db.collection(DEPOSITS_COLL_NAME).createIndex({ "user": 1, "txId": 1 });
        }

        this.depositHistoryCollections[contractAddress] = await DATABASE.db.collection(DEPOSITS_COLL_NAME);
    };

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
                        "percentageToLock",
                        "liquidityUnlockDate",
                        "score",
                        "ethInvested",
                        "creationDate",
                        "creator",
                        "hasEnded",
                        "hasCreatorWithdrawn",
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
                        "percentageToLock": { "bsonType": ["int", "double"] },
                        "liquidityUnlockDate": { "bsonType": ["int", "double"] },
                        "score": { "bsonType": ["int", "double"] },
                        "ethInvested": { "bsonType": ["int", "double"] },
                        "creationDate": { "bsonType": ["int", "double"] },
                        "hasEnded": { "bsonType": "bool" },
                        "creator": { "bsonType": "string" },
                        "hasCreatorWithdrawn": { "bsonType": "bool" },
                        "additionalDetails": { "bsonType": "object" },
                    }
                }
            }
        });

        iloListCollection.createIndex({ "startDate": 1, });
        iloListCollection.createIndex({ "name": 1, });
        iloListCollection.createIndex({ "endDate": 1, });
        iloListCollection.createIndex({ "creationDate": 1, });
        iloListCollection.createIndex({ "ethInvested": 1, });
        iloListCollection.createIndex({ "score": 1, });

        return iloListCollection;
    }
}

export const ILO_COLLECTIONS = new ILOCollections();