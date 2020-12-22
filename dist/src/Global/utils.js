"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getTokenInfo = exports.getTokenSymbol = exports.getTokenName = exports.getTokenDecimals = exports.humanizeTokenAmount = exports.isObject = exports.removeEmptyFields = void 0;
const _ = __importStar(require("lodash"));
const ethers_1 = require("ethers");
// Empty out all keys in an object that have a field of undefined
exports.removeEmptyFields = ($obj) => {
    for (const k of Object.keys($obj)) {
        if ($obj[k] === undefined)
            delete $obj[k];
        if (exports.isObject($obj[k]))
            exports.removeEmptyFields($obj[k]);
    }
    return $obj;
};
exports.isObject = (item) => typeof item === "object" && !Array.isArray(item) && item !== null;
exports.humanizeTokenAmount = (amount, decimals = 18) => parseFloat(ethers_1.ethers.utils.formatUnits(amount, decimals));
exports.getTokenDecimals = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const decimals = yield token.methods.decimals().call()
        .catch(() => token.methods.DECIMALS().call())
        .catch(() => token.methods.Decimals().call())
        .catch(() => 18); // Default decimals to 18 if a contract does not implement decimals variable
    return parseFloat(decimals);
});
exports.getTokenName = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const name = yield token.methods.name().call()
        .catch(() => token.methods.NAME().call())
        .catch(() => token.methods.Name().call())
        .catch(() => "Unknown Name");
    return name;
});
exports.getTokenSymbol = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const symbol = yield token.methods.symbol().call()
        .catch(() => token.methods.SYMBOL().call())
        .catch(() => token.methods.Symbol().call())
        .catch(() => "N/A");
    return symbol;
});
exports.getTokenInfo = (token) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        decimals: yield exports.getTokenDecimals(token),
        name: yield exports.getTokenName(token),
        symbol: yield exports.getTokenSymbol(token),
        address: token.options.address,
    };
});
Array.prototype.last = function () {
    return _.cloneDeep(this[this.length - 1]);
};
Array.prototype.first = function () {
    return _.cloneDeep(this[0]);
};
//# sourceMappingURL=utils.js.map