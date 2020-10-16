"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provider = void 0;
const ethers_1 = require("ethers");
const ENV_1 = require("../ENV");
exports.provider = new ethers_1.ethers.providers.JsonRpcProvider(ENV_1.ETH_NODE_URL);
//# sourceMappingURL=ethers.js.map