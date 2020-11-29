import { DATABASE } from "../Global/database";

export const FARMS_COLL_NAME = "yieldfarm.farms";

export class YieldFarmCollections {
    public farmsCollection: any;
    public tradeHistoryCollections: { [tokenContract: string]: any } = {};

    async init() {
        console.log(`\nFetching Yield Farm collections`);

        this.farmsCollection = await this.getFarmCollection();
    }

    async getFarmCollection(): Promise<any> {
        const collections = await DATABASE.db.listCollections({ name: FARMS_COLL_NAME }).toArray();
        const farmsExists = collections.length > 0;
        if (farmsExists) return DATABASE.db.collection(FARMS_COLL_NAME);

        console.log(`   ⛏️  Creating ${FARMS_COLL_NAME} collection`);

        const farmsCollection = await DATABASE.db.createCollection(FARMS_COLL_NAME, {
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
    }
}

export const YIELD_FARM_COLLECTIONS = new YieldFarmCollections();