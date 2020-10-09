import { DATABASE } from "../Global/database";

export const EXCHANGES_COLL_NAME = "swap.exchanges";

export class SwapCollections {
    public exchangesCollection: any;
    public tradesCollections: { [exchangeAddress: string]: any } = {};
    public candleCollections: { [exchangeAddress: string]: { [timeframe: string]: any }} = {};
    static candleTimeframes: number[] = [1000 * 60, 1000 * 60 * 15, 1000 * 60 * 60 * 4];

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
                        "required": ["baseTokenAmount", "assetTokenAmount", "isBuy", "user", "txId"],
                        "properties": {
                            "baseTokenAmount": { "bsonType": "string" },
                            "assetTokenAmount": { "bsonType": "string" },
                            "isBuy": { "bsonType": "bool" },
                            "user": { "bsonType": "string" },
                            "txId": { "bsonType": "string" }
                        }
                    }
                }
            });
        }

        this.tradesCollections[exchangeAddress] = await DATABASE.db.collection(TRADES_COLL_NAME);
    }

    async addCandleCollection(exchangeAddress: string) {
        await Promise.all(
            SwapCollections.candleTimeframes.map(async timeframe => {
                const CANDLES_COLL_NAME = `swap.candles.${timeframe}.${exchangeAddress}`;
    
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
                }
    
                if (!this.candleCollections[exchangeAddress]) this.candleCollections[exchangeAddress] = {};
                this.candleCollections[exchangeAddress][timeframe] = await DATABASE.db.collection(CANDLES_COLL_NAME);
            })
        );
    }
}

export const SWAP_COLLECTIONS = new SwapCollections();