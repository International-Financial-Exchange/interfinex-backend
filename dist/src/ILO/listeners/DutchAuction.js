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
exports.DutchAuctionListener = void 0;
const utils_1 = require("../../Global/utils");
const collections_1 = require("../collections");
const factory_1 = require("../factory");
const ILO_1 = require("./ILO");
class DutchAuctionListener extends ILO_1.ILOListener {
    constructor(simpleIloDetails) {
        super(simpleIloDetails, factory_1.ILO_TYPES.DutchAuction);
    }
    updateStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const additionalDetails = {
                totalAssetTokensBought: parseInt(yield this.contract.methods.totalAssetTokensBought().call()),
                startTokensPerEth: parseInt(yield this.contract.methods.startTokensPerEth().call()),
                endTokensPerEth: parseInt(yield this.contract.methods.endTokensPerEth().call()),
            };
            const hasEnded = yield this.contract.methods.hasEnded().call();
            const hasCreatorWithdrawn = yield this.contract.methods.hasCreatorWithdrawn().call();
            const ethInvested = utils_1.humanizeTokenAmount(yield this.contract.methods.etherAmountRaised().call(), 18);
            const score = 0;
            const iloDetails = yield collections_1.ILO_COLLECTIONS.iloListCollection.findOneAndUpdate({ contractAddress: this.simpleDetails.contractAddress, }, { "$set": { additionalDetails, ethInvested, score, hasEnded, hasCreatorWithdrawn } }, { returnOriginal: false });
            return iloDetails.value;
        });
    }
}
exports.DutchAuctionListener = DutchAuctionListener;
//# sourceMappingURL=DutchAuction.js.map