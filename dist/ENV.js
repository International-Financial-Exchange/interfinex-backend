"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETH_NODE_URL = void 0;
const minimist_1 = __importDefault(require("minimist"));
const _env_json_1 = __importDefault(require("./.env.json"));
var Network;
(function (Network) {
    Network["dev"] = "dev";
    Network["kovan"] = "kovan";
    Network["mainnet"] = "mainnet";
})(Network || (Network = {}));
;
const ENV_CONFIG = minimist_1.default(process.argv.slice(2));
exports.ETH_NODE_URL = _env_json_1.default.ethNodeUrls[(_a = ENV_CONFIG.network) !== null && _a !== void 0 ? _a : "dev" /* dev */];
//# sourceMappingURL=ENV.js.map