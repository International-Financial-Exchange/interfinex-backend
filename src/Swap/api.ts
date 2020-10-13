import { GLOBAL_API } from "../Global/api";
import { SWAP_COLLECTIONS } from "./collections";
import { removeEmptyFields } from "../Global/utils";
import { isString } from "lodash";
import { TIMEFRAMES } from "../Global/constants";

class SwapApi {
    static URL_PREFIX = "/swap/";

    async start() {
        this.getTradesHistory();
        this.getCandles();
    }

    async getTradesHistory() {
        type TradeHistoryQuery = {
            exchangeContract: string,
            user?: string,
            from?: number,
            to: number,
            limit: number,
        };

        GLOBAL_API.app.get(`${SwapApi.URL_PREFIX}tradesHistory`, async (req, res) => {
            const query: TradeHistoryQuery = {
                exchangeContract: isString(req.query.exchangeContract) ? req.query.exchangeContract : "",
                from: isString(req.query.from) ? parseFloat(req.query.from) : undefined,
                to: isString(req.query.to) ? parseFloat(req.query.to) : Date.now(),
                limit: isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                user: isString(req.query.user) ? req.query.user : undefined,
            };

            const tradeHistoryCollection = SWAP_COLLECTIONS.tradeHistoryCollections[query.exchangeContract];
            const trades = await tradeHistoryCollection
                .find(removeEmptyFields({ timestamp: { $gte: query.from, $lt: query.to }, user: query.user }))
                .sort({ timestamp: -1 })
                .limit(Math.min(query.limit, 500)) // Max of 500
                .toArray();

            res.json(trades);
        });
    }

    async getCandles() {
        type CandleQuery = {
            baseTokenAddress: string,
            assetTokenAddress: string,
            timeframe: number,
            from?: number,
            to: number,
            limit: number,
        };

        GLOBAL_API.app.get(`${SwapApi.URL_PREFIX}candles`, async (req, res) => {
            const query: CandleQuery = {
                baseTokenAddress: isString(req.query.baseTokenAddress) ? req.query.baseTokenAddress : "",
                assetTokenAddress: isString(req.query.assetTokenAddress) ? req.query.assetTokenAddress : "",
                timeframe: (isString(req.query.timeframe) ? TIMEFRAMES[req.query.timeframe] : TIMEFRAMES["15m"]) ?? TIMEFRAMES["15m"],
                from: isString(req.query.from) ? parseFloat(req.query.from) : undefined,
                to: isString(req.query.to) ? parseFloat(req.query.to) : Date.now(),
                limit: isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
            };

            const candleCollection = SWAP_COLLECTIONS.candleCollections[query.baseTokenAddress][query.assetTokenAddress][query.timeframe];
            const candles = await candleCollection
                .find(removeEmptyFields({ openTimestamp: { $gte: query.from, $lt: query.to }}))
                .sort({ openTimestamp: -1 })
                .limit(Math.min(query.limit, 500)) // Max of 500
                .toArray();

            res.json(candles);
        });
    }
}

export const SWAP_API = new SwapApi();