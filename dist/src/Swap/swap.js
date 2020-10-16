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
exports.SWAP = void 0;
const all_exchanges_1 = require("./all_exchanges");
const factory_1 = require("./factory");
const collections_1 = require("./collections");
class Swap {
    constructor() {
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield collections_1.SWAP_COLLECTIONS.init();
            yield factory_1.FACTORY.start();
            yield all_exchanges_1.ALL_EXCHANGES.start();
        });
    }
}
exports.SWAP = new Swap();
//# sourceMappingURL=swap.js.map