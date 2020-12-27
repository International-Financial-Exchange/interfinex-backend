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
exports.FixedPriceListener = void 0;
const ethers_1 = require("ethers");
const collections_1 = require("../collections");
const factory_1 = require("../factory");
const ILO_1 = require("./ILO");
class FixedPriceListener extends ILO_1.ILOListener {
    constructor(simpleIloDetails) {
        super(simpleIloDetails, factory_1.ILO_TYPES.FixedPrice);
    }
    updateStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const additionalDetails = {
                tokensPerEth: yield this.contract.methods.tokensPerEth().call(),
                totalAssetTokensBought: yield this.contract.methods.totalAssetTokensBought().call(),
                softCap: yield this.contract.methods.softCap().call(),
            };
            console.log(additionalDetails);
            const hasEnded = yield this.contract.methods.hasEnded().call();
            const hasCreatorWithdrawn = yield this.contract.methods.hasCreatorWithdrawn().call();
            const ethInvested = parseFloat(ethers_1.BigNumber.from(additionalDetails.totalAssetTokensBought).div(additionalDetails.tokensPerEth).toString());
            const score = this.getScore(ethInvested);
            console.log({ additionalDetails, ethInvested, score, hasEnded, hasCreatorWithdrawn, });
            const iloDetails = yield collections_1.ILO_COLLECTIONS.iloListCollection.findOneAndUpdate({ contractAddress: this.simpleDetails.contractAddress, }, { "$set": { additionalDetails, ethInvested, score, hasEnded, hasCreatorWithdrawn, } }, { returnOriginal: false });
            return iloDetails.value;
        });
    }
}
exports.FixedPriceListener = FixedPriceListener;
//# sourceMappingURL=FixedPriceListener.js.map