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
exports.MARGIN_SWAP = void 0;
const factory_1 = require("./factory");
const collections_1 = require("./collections");
const all_margin_markets_1 = require("./all_margin_markets");
class MarginSwap {
    constructor() {
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield collections_1.MARGIN_MARKET_COLLECTIONS.init();
            yield factory_1.FACTORY.start();
            yield all_margin_markets_1.ALL_MARGIN_MARKETS.start();
        });
    }
}
exports.MARGIN_SWAP = new MarginSwap();
//# sourceMappingURL=MarginSwap.js.map