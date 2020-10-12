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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = exports.removeEmptyFields = exports.newContract = void 0;
const ethers_1 = require("./ethers");
const ethers_2 = require("ethers");
const _ = __importStar(require("lodash"));
exports.newContract = (address, abi) => {
    return new ethers_2.ethers.Contract(address, abi, ethers_1.provider);
};
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
Array.prototype.last = function () {
    return _.cloneDeep(this[this.length - 1]);
};
Array.prototype.first = function () {
    return _.cloneDeep(this[0]);
};
//# sourceMappingURL=utils.js.map