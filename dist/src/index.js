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
const swap_1 = require("./Swap/swap");
const database_1 = require("./Global/database");
require("./Global/utils");
const api_1 = require("./Global/api");
const api_2 = require("./Swap/api");
require("./ENV");
const MarginSwap_1 = require("./MarginSwap/MarginSwap");
const api_3 = require("./MarginSwap/api");
const yieldfarm_1 = require("./YieldFarm/yieldfarm");
const api_4 = require("./YieldFarm/api");
const MetadataApi_1 = require("./Global/MetadataApi");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    yield database_1.DATABASE.init();
    yield swap_1.SWAP.start();
    yield MarginSwap_1.MARGIN_SWAP.start();
    yield yieldfarm_1.YIELD_FARM.start();
    yield api_1.GLOBAL_API.start();
    yield MetadataApi_1.METADATA_API.start();
    yield api_2.SWAP_API.start();
    yield api_3.MARGIN_MARKET_API.start();
    yield api_4.YIELD_FARM_API.start();
});
main();
//# sourceMappingURL=index.js.map