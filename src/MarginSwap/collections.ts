import { DATABASE } from "../Global/database";

export const MARGIN_MARKETS_COLL_NAME: string = "swap.margin.markets";

export class MarginMarketCollections {
    public marginMarketsCollection: any;
    public fundingHistoryCollections: { [marginMarketAddress: string]: any } = {};

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

    // async addCandleCollection(baseTokenAddress: string, assetTokenAddress: string) {
    //     await Promise.all(
    //         SwapCollections.candleTimeframes.map(async ({ timeframe, stalePeriod }) => {
    //             const CANDLES_COLL_NAME = `swap.candles.${timeframe}.${baseTokenAddress}.${assetTokenAddress}`;
    
    //             let candlesCollExists = (await DATABASE.db.listCollections({ name: CANDLES_COLL_NAME }).toArray()).first();
    //             if (!candlesCollExists) {
    //                 console.log(`   ⛏️  Creating ${CANDLES_COLL_NAME} collection`);
    //                 await DATABASE.db.createCollection(CANDLES_COLL_NAME, {
    //                     "validator": {
    //                         "$jsonSchema": { 
    //                             "bsonType": "object",
    //                             "required": ["high", "low", "open", "close", "volume", "openTimestamp"],
    //                             "properties": {
    //                                 "high": { "bsonType": ["int", "double"] },
    //                                 "low": { "bsonType": ["int", "double"] },
    //                                 "open": { "bsonType": ["int", "double"] },
    //                                 "close": { "bsonType": ["int", "double"] },
    //                                 "volume": { "bsonType": ["int", "double"] },
    //                                 "openTimestamp": { "bsonType": "double" },
    //                             }
    //                         }
    //                     }
    //                 });

    //                 // Remove any stale candles using a TTL index
    //                 // stalePeriod can be undefined, in which case candles will never expire
    //                 DATABASE.db.collection(CANDLES_COLL_NAME).createIndex(
    //                     { "openTimestamp": 1 },
    //                     removeEmptyFields({ expireAfterSeconds: stalePeriod })
    //                 );
    //             }
    
    //             if (!this.candleCollections[baseTokenAddress]) this.candleCollections[baseTokenAddress] = {};
    //             if (!this.candleCollections[baseTokenAddress][assetTokenAddress]) this.candleCollections[baseTokenAddress][assetTokenAddress] = {};
    //             this.candleCollections[baseTokenAddress][assetTokenAddress][timeframe] = await DATABASE.db.collection(CANDLES_COLL_NAME);
    //         })
    //     );
    // }
}

export const MARGIN_MARKET_COLLECTIONS = new MarginMarketCollections();