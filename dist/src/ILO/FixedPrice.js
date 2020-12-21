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
exports.FixedPrice = void 0;
const web3_1 = require("../Global/web3");
const collections_1 = require("./collections");
class FixedPrice {
    constructor(simpleIloDetails) {
        this.simpleDetails = simpleIloDetails;
        this.contract = web3_1.newContract("FixedPricedILO", simpleIloDetails.contractAddress);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO.
            // Start the listeners for deposits, withdrawals
            // Each time an event on the contract changes run the updater
            yield this.updateStats();
        });
    }
    updateStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const additionalDetails = {
                tokensPerEth: parseInt(yield this.contract.methods.tokensPerEth().call()),
                totalAssetTokensBought: parseInt(yield this.contract.methods.totalAssetTokensBought().call()),
            };
            const ethInvested = additionalDetails.totalAssetTokensBought / additionalDetails.tokensPerEth;
            const score = 0;
            return collections_1.ILO_COLLECTIONS.iloListCollection.updateOne({ contractAddress: this.simpleDetails.contractAddress }, { "$set": { additionalDetails, ethInvested, score } });
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.FixedPrice = FixedPrice;
//# sourceMappingURL=FixedPrice.js.map