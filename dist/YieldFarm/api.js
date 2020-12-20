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
exports.YIELD_FARM_API = void 0;
const api_1 = require("../Global/api");
const collections_1 = require("./collections");
const lodash_1 = require("lodash");
class YieldFarmApi {
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.getFarms();
        });
    }
    getFarms() {
        return __awaiter(this, void 0, void 0, function* () {
            api_1.GLOBAL_API.app.get(`${YieldFarmApi.URL_PREFIX}farms`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const query = {
                    limit: lodash_1.isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                };
                const farmsCollection = collections_1.YIELD_FARM_COLLECTIONS.farmsCollection;
                const farms = yield farmsCollection
                    .find()
                    .limit(Math.min(query.limit, 500)) // Max of 500
                    .toArray();
                res.json(farms);
            }));
        });
    }
}
YieldFarmApi.URL_PREFIX = "/yieldFarm/";
exports.YIELD_FARM_API = new YieldFarmApi();
//# sourceMappingURL=api.js.map