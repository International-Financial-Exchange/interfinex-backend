import { DATABASE } from "../Global/database";
import { TIMEFRAMES } from "../Global/constants";
import { removeEmptyFields } from "../Global/utils";

export const EXCHANGES_COLL_NAME = "swap.exchanges";

type CandleTimeframe = {
    timeframe: number,
    stalePeriod?: number,
};

export class SwapCollections {
    public exchangesCollection: any;
    public tradeHistoryCollections: { [exchangeAddress: string]: any } = {};
    public candleCollections: { [baseTokenAddress: string]: { [assetTokenAddress: string]: { [timeframe: number]: any } }} = {};
    
    static candleTimeframes: CandleTimeframe[] = [
        { timeframe: TIMEFRAMES["1m"], stalePeriod: 1000 * 60 * 60 * 24 }, 
        { timeframe: TIMEFRAMES["15m"], stalePeriod: 1000 * 60 * 60 * 24 * 7 }, 
        { timeframe: TIMEFRAMES["4h"], }
    ];

    async init() {
        console.log(`Fetching Swap collections`);

        this.exchangesCollection = await this.getExchangeCollection();
    }

    async getExchangeCollection(): Promise<any> {
        const collections = await DATABASE.db.listCollections({ name: EXCHANGES_COLL_NAME }).toArray();
        const exchangesExists = collections.length > 0;
        if (exchangesExists) return DATABASE.db.collection(EXCHANGES_COLL_NAME);

        console.log(`   ⛏️  Creating ${EXCHANGES_COLL_NAME} collection`);

        const exchangesCollection = await DATABASE.db.createCollection(EXCHANGES_COLL_NAME, {
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
    }

    async addTradeHistoryCollection(exchangeAddress: string) {
        const TRADES_COLL_NAME = `swap.tradeHistory.${exchangeAddress}`;
        let tradesCollExists = (await DATABASE.db.listCollections({ name: TRADES_COLL_NAME }).toArray())[0];
        if (!tradesCollExists) {
            console.log(`   ⛏️  Creating ${TRADES_COLL_NAME} collection`);
            await DATABASE.db.createCollection(TRADES_COLL_NAME, {
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
            DATABASE.db.collection(TRADES_COLL_NAME).createIndex(
                { "timestamp": 1 }, 
                { expireAfterSeconds: 1000 * 60 * 60 * 24 * 7 }
            );

            DATABASE.db.collection(TRADES_COLL_NAME).createIndex({ "user": 1, "txId": 1 },);
        }

        this.tradeHistoryCollections[exchangeAddress] = await DATABASE.db.collection(TRADES_COLL_NAME);
    }

    async addCandleCollection(baseTokenAddress: string, assetTokenAddress: string) {
        await Promise.all(
            SwapCollections.candleTimeframes.map(async ({ timeframe, stalePeriod }) => {
                const CANDLES_COLL_NAME = `swap.candles.${timeframe}.${baseTokenAddress}.${assetTokenAddress}`;
    
                let candlesCollExists = (await DATABASE.db.listCollections({ name: CANDLES_COLL_NAME }).toArray()).first();
                if (!candlesCollExists) {
                    console.log(`   ⛏️  Creating ${CANDLES_COLL_NAME} collection`);
                    await DATABASE.db.createCollection(CANDLES_COLL_NAME, {
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
                    DATABASE.db.collection(CANDLES_COLL_NAME).createIndex(
                        { "openTimestamp": 1 },
                        removeEmptyFields({ expireAfterSeconds: stalePeriod })
                    );
                }
    
                if (!this.candleCollections[baseTokenAddress]) this.candleCollections[baseTokenAddress] = {};
                if (!this.candleCollections[baseTokenAddress][assetTokenAddress]) this.candleCollections[baseTokenAddress][assetTokenAddress] = {};
                this.candleCollections[baseTokenAddress][assetTokenAddress][timeframe] = await DATABASE.db.collection(CANDLES_COLL_NAME);
            })
        );
    }
}

export const SWAP_COLLECTIONS = new SwapCollections();