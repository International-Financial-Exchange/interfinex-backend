"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbi = exports.ABI = exports.CONTRACTS = exports.ETH_NODE_URL = void 0;
const minimist_1 = __importDefault(require("minimist"));
const contracts_json_1 = __importDefault(require("../contracts/contracts.json"));
const _env_json_1 = __importDefault(require("./.env.json"));
var Network;
(function (Network) {
    Network["localhost"] = "localhost";
    Network["kovan"] = "kovan";
    Network["mainnet"] = "mainnet";
})(Network || (Network = {}));
;
const ENV_CONFIG = minimist_1.default(process.argv.slice(2));
exports.ETH_NODE_URL = _env_json_1.default.ethNodeUrls[(_a = ENV_CONFIG.network) !== null && _a !== void 0 ? _a : "localhost" /* localhost */];
// @ts-ignore
exports.CONTRACTS = contracts_json_1.default[(_b = ENV_CONFIG.network) !== null && _b !== void 0 ? _b : "localhost" /* localhost */];
const DividendERC20_json_1 = __importDefault(require("../contracts/abi/DividendERC20.json"));
const ERC20_json_1 = __importDefault(require("../contracts/abi/ERC20.json"));
const MarginFactory_json_1 = __importDefault(require("../contracts/abi/MarginFactory.json"));
const MarginMarket_json_1 = __importDefault(require("../contracts/abi/MarginMarket.json"));
const SwapExchange_json_1 = __importDefault(require("../contracts/abi/SwapExchange.json"));
const SwapFactory_json_1 = __importDefault(require("../contracts/abi/SwapFactory.json"));
exports.ABI = {
    DividendERC20: DividendERC20_json_1.default,
    ERC20: ERC20_json_1.default,
    MarginFactory: MarginFactory_json_1.default,
    MarginMarket: MarginMarket_json_1.default,
    SwapExchange: SwapExchange_json_1.default,
    SwapFactory: SwapFactory_json_1.default,
};
//@ts-ignore
exports.getAbi = (abiName) => exports.ABI[abiName];
//# sourceMappingURL=ENV.js.map