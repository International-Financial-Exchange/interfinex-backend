import { DATABASE } from "../Global/database";

export const MARGIN_MARKETS_COLL_NAME: string = "swap.margin.markets";

export class MarginMarketCollections {
    public marginMarketsCollection: any;
    public fundingHistoryCollections: { [marginMarketAddress: string]: any } = {};
    public positionCollections: { [marginMarketAddress: string]: any } = {};

    async init() {
        console.log(`\nFetching Margin Market collections`);

        this.marginMarketsCollection = await this.getMarginMarketsCollection();
    }

    async getMarginMarketsCollection(): Promise<any> {
        const collections = await DATABASE.db.listCollections({ name: MARGIN_MARKETS_COLL_NAME }).toArray();
        const marginMarketsExists = collections.length > 0;
        if (marginMarketsExists) return DATABASE.db.collection(MARGIN_MARKETS_COLL_NAME);

        console.log(`   ⛏️  Creating ${MARGIN_MARKETS_COLL_NAME} collection`);

        const marginMarketsCollection = await DATABASE.db.createCollection(MARGIN_MARKETS_COLL_NAME, {
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
    }

    async addFundingHistoryCollection(marginMarketAddress: string) {
        const FUNDING_COLL_NAME = `swap.margin.fundingHistory.${marginMarketAddress}`;
        let fundingCollExists = (await DATABASE.db.listCollections({ name: FUNDING_COLL_NAME }).toArray())[0];
        if (!fundingCollExists) {
            console.log(`   ⛏️  Creating ${FUNDING_COLL_NAME} collection`);
            await DATABASE.db.createCollection(FUNDING_COLL_NAME, {
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
            DATABASE.db.collection(FUNDING_COLL_NAME).createIndex(
                { "timestamp": 1 }, 
                { expireAfterSeconds: 1000 * 60 * 60 * 24 * 7 }
            );

            DATABASE.db.collection(FUNDING_COLL_NAME).createIndex({ "user": 1, "txId": 1 },);
        }

        this.fundingHistoryCollections[marginMarketAddress] = await DATABASE.db.collection(FUNDING_COLL_NAME);
    }

    async addPositionsCollection(marginMarketAddress: string) {
        const POSITIONS_COLL_NAME = `swap.margin.positions.${marginMarketAddress}`;
        let positionsCollExists = (await DATABASE.db.listCollections({ name: POSITIONS_COLL_NAME }).toArray())[0];
        if (!positionsCollExists) {
            console.log(`   ⛏️  Creating ${POSITIONS_COLL_NAME} collection`);
            await DATABASE.db.createCollection(POSITIONS_COLL_NAME, {
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

            DATABASE.db.collection(POSITIONS_COLL_NAME).createIndex({ "user": 1, },);
            DATABASE.db.collection(POSITIONS_COLL_NAME).createIndex({ "collateralisationRatio": 1, },);
        }

        this.positionCollections[marginMarketAddress] = await DATABASE.db.collection(POSITIONS_COLL_NAME);
    }
}

export const MARGIN_MARKET_COLLECTIONS = new MarginMarketCollections();