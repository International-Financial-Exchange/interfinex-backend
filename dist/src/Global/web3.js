"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newContract = exports.web3 = void 0;
const web3_1 = __importDefault(require("web3"));
exports.web3 = new web3_1.default("ws://localhost:7545");
exports.newContract = (abi, address) => {
    return new exports.web3.eth.Contract(abi, address);
};
//# sourceMappingURL=web3.js.map