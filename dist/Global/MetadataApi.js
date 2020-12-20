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
exports.METADATA_API = void 0;
const ethers_1 = require("ethers");
const ENV_1 = require("../ENV");
const api_1 = require("./api");
const utils_1 = require("./utils");
const web3_1 = require("./web3");
console.log(ENV_1.CONTRACTS["IfexToken"]);
class MetadataApi {
    constructor() {
        this.ifexContract = web3_1.newContract("DividendERC20", ENV_1.CONTRACTS["IfexToken"].address);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.getTotalSupply();
            this.getCirculatingSupply();
        });
    }
    getTotalSupply() {
        return __awaiter(this, void 0, void 0, function* () {
            api_1.GLOBAL_API.app.get(`${MetadataApi.URL_PREFIX}ifex/totalSupply`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const rawTotalSupply = yield this.ifexContract.methods.totalSupply().call();
                const humanizedTotalSupply = utils_1.humanizeTokenAmount(rawTotalSupply, 18);
                res.json(humanizedTotalSupply);
            }));
        });
    }
    getCirculatingSupply() {
        return __awaiter(this, void 0, void 0, function* () {
            const lockedAddresses = [
                "0x7ea17dcaF7dc70258Fb680DfFA1936DBeB6FEE21",
                "0x15E6aE26EbFD684F2c547663A1E4eDd0e880724c",
                ENV_1.CONTRACTS["YieldFarm"].address,
                ENV_1.CONTRACTS["TeamReservedVault"].address,
                ENV_1.CONTRACTS["MarketingVaultContract"].address,
                ENV_1.CONTRACTS["CommunityVault"].address,
            ];
            api_1.GLOBAL_API.app.get(`${MetadataApi.URL_PREFIX}ifex/circulatingSupply`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const rawTotalSupply = ethers_1.BigNumber.from(yield this.ifexContract.methods.totalSupply().call());
                const balances = yield Promise.all(lockedAddresses.map((address) => __awaiter(this, void 0, void 0, function* () { return yield this.ifexContract.methods.balanceOf(address).call(); })));
                const rawCirculatingSupply = rawTotalSupply.sub(balances.reduce(($acc, balance) => $acc.add(balance), ethers_1.BigNumber.from("0")));
                const humanizedCirculatingSupply = utils_1.humanizeTokenAmount(rawCirculatingSupply.toString(), 18);
                res.json(humanizedCirculatingSupply);
            }));
        });
    }
}
MetadataApi.URL_PREFIX = "/meta/";
exports.METADATA_API = new MetadataApi();
//# sourceMappingURL=MetadataApi.js.map