import { GLOBAL_API } from "../Global/api";
import { MARGIN_MARKET_COLLECTIONS, } from "./collections";
import { removeEmptyFields } from "../Global/utils";
import { isString } from "lodash";
// import { TIMEFRAMES } from "../Global/constants";

class MarginMarketApi {
    static URL_PREFIX = "/marginMarket/";

    async start() {
        this.getFundingHistory();
        this.getPositions();
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

    async getPositions() {
        type PositionsQuery = {
            marginMarketContract: string,
            user?: string,
            offset: number,
            limit: number,
        };

        GLOBAL_API.app.get(`${MarginMarketApi.URL_PREFIX}positions`, async (req, res) => {
            const query: PositionsQuery = {
                marginMarketContract: isString(req.query.marginMarketContract) ? req.query.marginMarketContract : "",
                user: isString(req.query.user) ? req.query.user : undefined,
                limit: isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                offset: isString(req.query.offset) ? parseFloat(req.query.offset) : 0,
            };

            const positionsCollection = MARGIN_MARKET_COLLECTIONS.positionCollections[query.marginMarketContract];
            console.log(query)
            const positions = await positionsCollection
                .find(removeEmptyFields({ user: query.user }))
                .sort({ collateralisationRatio: -1 })
                .skip(query.offset)
                .limit(Math.min(query.limit, 500)) // Max of 500
                .toArray();

            res.json(positions);
        });
    }
}

export const MARGIN_MARKET_API = new MarginMarketApi();