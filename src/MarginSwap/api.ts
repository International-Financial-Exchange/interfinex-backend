import { GLOBAL_API } from "../Global/api";
import { MARGIN_MARKET_COLLECTIONS, } from "./collections";
import { removeEmptyFields } from "../Global/utils";
import { isString } from "lodash";
// import { TIMEFRAMES } from "../Global/constants";

class MarginMarketApi {
    static URL_PREFIX = "/marginMarket/";

    async start() {
        this.getFundingHistory();
        // this.getCandles();
    }

    async getFundingHistory() {
        type FundingHistoryQuery = {
            marginMarketContract: string,
            user?: string,
            from?: number,
            to?: number,
            limit: number,
        };

        GLOBAL_API.app.get(`${MarginMarketApi.URL_PREFIX}fundingHistory`, async (req, res) => {
            const query: FundingHistoryQuery = {
                marginMarketContract: isString(req.query.marginMarketContract) ? req.query.marginMarketContract : "",
                from: isString(req.query.from) ? parseFloat(req.query.from) : undefined,
                to: isString(req.query.to) ? parseFloat(req.query.to) : Date.now(),
                limit: isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                user: isString(req.query.user) ? req.query.user : undefined,
            };

            const fundingHistoryCollection = MARGIN_MARKET_COLLECTIONS.fundingHistoryCollections[query.marginMarketContract];
            const fundingEvents = await fundingHistoryCollection
                .find(removeEmptyFields({ timestamp: { $gte: query.from, $lt: query.to }, user: query.user }))
                .sort({ timestamp: -1 })
                .limit(Math.min(query.limit, 500)) // Max of 500
                .toArray();

            res.json(fundingEvents);
        });
    }

    // async getCandles() {
    //     type CandleQuery = {
    //         baseTokenAddress: string,
    //         assetTokenAddress: string,
    //         timeframe: number,
    //         from?: number,
    //         to: number,
    //         limit: number,
    //     };

    //     GLOBAL_API.app.get(`${MarginMarketApi.URL_PREFIX}candles`, async (req, res) => {
    //         const query: CandleQuery = {
    //             baseTokenAddress: isString(req.query.baseTokenAddress) ? req.query.baseTokenAddress : "",
    //             assetTokenAddress: isString(req.query.assetTokenAddress) ? req.query.assetTokenAddress : "",
    //             timeframe: (isString(req.query.timeframe) ? parseFloat(req.query.timeframe) : TIMEFRAMES["15m"]) ?? TIMEFRAMES["15m"],
    //             from: isString(req.query.from) ? parseFloat(req.query.from) : undefined,
    //             to: isString(req.query.to) ? parseFloat(req.query.to) : Date.now(),
    //             limit: isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
    //         };

    //         const candleCollection = SWAP_COLLECTIONS.candleCollections[query.baseTokenAddress][query.assetTokenAddress][query.timeframe];
    //         const candles = await candleCollection
    //             .find(removeEmptyFields({ openTimestamp: { $gt: query.from, $lte: query.to }}))
    //             .sort({ openTimestamp: 1 })
    //             .limit(Math.min(query.limit, 500)) // Max of 500
    //             .toArray();

    //         res.json(candles);
    //     });
    // }
}

export const MARGIN_MARKET_API = new MarginMarketApi();