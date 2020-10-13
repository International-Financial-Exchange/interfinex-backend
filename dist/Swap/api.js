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
exports.SWAP_API = void 0;
const api_1 = require("../Global/api");
const collections_1 = require("./collections");
const utils_1 = require("../Global/utils");
const lodash_1 = require("lodash");
const constants_1 = require("../Global/constants");
class SwapApi {
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.getTradesHistory();
            this.getCandles();
        });
    }
    getTradesHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            api_1.GLOBAL_API.app.get(`${SwapApi.URL_PREFIX}tradesHistory`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const query = {
                    exchangeContract: lodash_1.isString(req.query.exchangeContract) ? req.query.exchangeContract : "",
                    from: lodash_1.isString(req.query.from) ? parseFloat(req.query.from) : undefined,
                    to: lodash_1.isString(req.query.to) ? parseFloat(req.query.to) : Date.now(),
                    limit: lodash_1.isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                    user: lodash_1.isString(req.query.user) ? req.query.user : undefined,
                };
                const tradeHistoryCollection = collections_1.SWAP_COLLECTIONS.tradeHistoryCollections[query.exchangeContract];
                const trades = yield tradeHistoryCollection
                    .find(utils_1.removeEmptyFields({ timestamp: { $gte: query.from, $lt: query.to }, user: query.user }))
                    .sort({ timestamp: -1 })
                    .limit(Math.min(query.limit, 500)) // Max of 500
                    .toArray();
                res.json(trades);
            }));
        });
    }
    getCandles() {
        return __awaiter(this, void 0, void 0, function* () {
            api_1.GLOBAL_API.app.get(`${SwapApi.URL_PREFIX}candles`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const query = {
                    baseTokenAddress: lodash_1.isString(req.query.baseTokenAddress) ? req.query.baseTokenAddress : "",
                    assetTokenAddress: lodash_1.isString(req.query.assetTokenAddress) ? req.query.assetTokenAddress : "",
                    timeframe: (_a = (lodash_1.isString(req.query.timeframe) ? constants_1.TIMEFRAMES[req.query.timeframe] : constants_1.TIMEFRAMES["15m"])) !== null && _a !== void 0 ? _a : constants_1.TIMEFRAMES["15m"],
                    from: lodash_1.isString(req.query.from) ? parseFloat(req.query.from) : undefined,
                    to: lodash_1.isString(req.query.to) ? parseFloat(req.query.to) : Date.now(),
                    limit: lodash_1.isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                };
                const candleCollection = collections_1.SWAP_COLLECTIONS.candleCollections[query.baseTokenAddress][query.assetTokenAddress][query.timeframe];
                const candles = yield candleCollection
                    .find(utils_1.removeEmptyFields({ openTimestamp: { $gte: query.from, $lt: query.to } }))
                    .sort({ openTimestamp: -1 })
                    .limit(Math.min(query.limit, 500)) // Max of 500
                    .toArray();
                res.json(candles);
            }));
        });
    }
}
SwapApi.URL_PREFIX = "/swap/";
exports.SWAP_API = new SwapApi();
//# sourceMappingURL=api.js.map