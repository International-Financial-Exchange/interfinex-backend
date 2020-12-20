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
exports.YIELD_FARM = void 0;
const collections_1 = require("./collections");
const YieldFarmContract_1 = require("./YieldFarmContract");
class YieldFarm {
    constructor() {
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield collections_1.YIELD_FARM_COLLECTIONS.init();
            yield YieldFarmContract_1.YIELD_FARM_CONTRACT.start();
            // await ALL_EXCHANGES.start();
        });
    }
}
exports.YIELD_FARM = new YieldFarm();
//# sourceMappingURL=yieldfarm.js.map