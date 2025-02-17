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
exports.ILO = void 0;
const all_ilos_1 = require("./all_ilos");
const collections_1 = require("./collections");
const factory_1 = require("./factory");
class Ilo {
    constructor() {
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield collections_1.ILO_COLLECTIONS.init();
            yield factory_1.FACTORY.start();
            yield all_ilos_1.ALL_ILOS.start();
        });
    }
}
exports.ILO = new Ilo();
//# sourceMappingURL=ILO.js.map