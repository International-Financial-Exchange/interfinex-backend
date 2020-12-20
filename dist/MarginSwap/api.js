"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MARGIN_MARKET_API = void 0;
const api_1 = require("../Global/api");
const collections_1 = require("./collections");
const utils_1 = require("../Global/utils");
const lodash_1 = require("lodash");
// import { TIMEFRAMES } from "../Global/constants";
class MarginMarketApi {
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.getFundingHistory();
            this.getPositions();
        });
    }
    getFundingHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            api_1.GLOBAL_API.app.get(`${MarginMarketApi.URL_PREFIX}fundingHistory`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const query = {
                    marginMarketContract: lodash_1.isString(req.query.marginMarketContract) ? req.query.marginMarketContract : "",
                    from: lodash_1.isString(req.query.from) ? parseFloat(req.query.from) : undefined,
                    to: lodash_1.isString(req.query.to) ? parseFloat(req.query.to) : Date.now(),
                    limit: lodash_1.isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                    user: lodash_1.isString(req.query.user) ? req.query.user : undefined,
                };
                const fundingHistoryCollection = collections_1.MARGIN_MARKET_COLLECTIONS.fundingHistoryCollections[query.marginMarketContract];
                const fundingEvents = yield fundingHistoryCollection
                    .find(utils_1.removeEmptyFields({ timestamp: { $gte: query.from, $lt: query.to }, user: query.user }))
                    .sort({ timestamp: -1 })
                    .limit(Math.min(query.limit, 500)) // Max of 500
                    .toArray();
                res.json(fundingEvents);
            }));
        });
    }
    getPositions() {
        return __awaiter(this, void 0, void 0, function* () {
            api_1.GLOBAL_API.app.get(`${MarginMarketApi.URL_PREFIX}positions`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const query = {
                    marginMarketContract: lodash_1.isString(req.query.marginMarketContract) ? req.query.marginMarketContract : "",
                    user: lodash_1.isString(req.query.user) ? req.query.user : undefined,
                    limit: lodash_1.isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                    offset: lodash_1.isString(req.query.offset) ? parseFloat(req.query.offset) : 0,
                };
                const positionsCollection = collections_1.MARGIN_MARKET_COLLECTIONS.positionCollections[query.marginMarketContract];
                console.log(query);
                const positions = yield positionsCollection
                    .find(utils_1.removeEmptyFields({ user: query.user }))
                    .sort({ collateralisationRatio: -1 })
                    .skip(query.offset)
                    .limit(Math.min(query.limit, 500)) // Max of 500
                    .toArray();
                res.json(positions);
            }));
        });
    }
}
MarginMarketApi.URL_PREFIX = "/marginMarket/";
exports.MARGIN_MARKET_API = new MarginMarketApi();
//# sourceMappingURL=api.js.map