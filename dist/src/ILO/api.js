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
exports.ILO_API = void 0;
const api_1 = require("../Global/api");
const collections_1 = require("./collections");
const lodash_1 = require("lodash");
var SortType;
(function (SortType) {
    SortType[SortType["hot"] = 0] = "hot";
    SortType[SortType["new"] = 1] = "new";
    SortType[SortType["top"] = 2] = "top";
    SortType[SortType["endingSoonest"] = 3] = "endingSoonest";
})(SortType || (SortType = {}));
class IloApi {
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.getIloList();
        });
    }
    getIloList() {
        return __awaiter(this, void 0, void 0, function* () {
            api_1.GLOBAL_API.app.get(`${IloApi.URL_PREFIX}list`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const query = {
                    limit: lodash_1.isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                    sortType: lodash_1.isString(req.query.sortType) ? parseInt(req.query.sortType) : SortType.hot,
                };
                const currentDateSeconds = Math.floor(Date.now() / 1000);
                const findQuery = (() => {
                    switch (query.sortType) {
                        case SortType.hot:
                            return {
                                startDate: { "lt": { currentDateSeconds } },
                                endDate: { "gt": { currentDateSeconds } },
                            };
                        case SortType.new:
                        case SortType.top:
                            return {};
                        case SortType.endingSoonest:
                            return {
                                hasEnded: false,
                                startDate: { "lt": { currentDateSeconds } },
                                endDate: { "gt": { currentDateSeconds } },
                            };
                    }
                })();
                const sortQuery = (() => {
                    switch (query.sortType) {
                        case SortType.hot:
                            return { score: -1 };
                        case SortType.new:
                            return { creationDate: -1 };
                        case SortType.top:
                            return { ethInvested: -1 };
                        case SortType.endingSoonest:
                            return { endDate: 1, };
                    }
                })();
                const iloListCollection = collections_1.ILO_COLLECTIONS.iloListCollection;
                const iloList = yield iloListCollection
                    .find(findQuery)
                    .sort(sortQuery)
                    .limit(Math.min(query.limit, 500)) // Max of 500
                    .toArray();
                res.json(iloList);
            }));
        });
    }
}
IloApi.URL_PREFIX = "/ilo/";
exports.ILO_API = new IloApi();
//# sourceMappingURL=api.js.map