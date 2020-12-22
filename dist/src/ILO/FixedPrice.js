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
const utils_1 = require("../Global/utils");
const web3_1 = require("../Global/web3");
const collections_1 = require("./collections");
class FixedPrice {
    constructor(simpleIloDetails) {
        this.eventListeners = [];
        this.simpleDetails = simpleIloDetails;
        this.contract = web3_1.newContract("FixedPricedILO", simpleIloDetails.contractAddress);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield collections_1.ILO_COLLECTIONS.addDepositHistoryCollection(this.contract.options.address);
            this.depositHistoryCollection = collections_1.ILO_COLLECTIONS.depositHistoryCollections[this.contract.options.address];
            this.details = yield this.updateStats(); // Initialiser case
            yield this.startDepositListener();
            yield this.startStatsListener();
        });
    }
    startDepositListener() {
        return __awaiter(this, void 0, void 0, function* () {
            const listener = this.contract.events.Invest()
                .on("data", (event) => __awaiter(this, void 0, void 0, function* () {
                const { investAmount, assetTokensBought, user } = event.returnValues;
                const deposit = {
                    ethInvested: utils_1.humanizeTokenAmount(investAmount.toString(), 18),
                    assetTokensBought: utils_1.humanizeTokenAmount(assetTokensBought.toString(), this.details.assetToken.decimals),
                    user,
                    txId: event.transactionHash,
                    timestamp: Date.now(),
                };
                yield this.depositHistoryCollection.insertOne(deposit);
            }))
                .on("change", (event) => __awaiter(this, void 0, void 0, function* () {
                const { user } = event.returnValues;
                yield this.depositHistoryCollection.deleteOne({ user, txId: event.transactionHash });
            }));
            this.eventListeners.push(listener);
            // add this contract address to userILO's for the respective user
        });
    }
    startStatsListener() {
        return __awaiter(this, void 0, void 0, function* () {
            const subscription = this.contract.events.allEvents({}, () => this.updateStats());
            this.eventListeners.push(subscription);
        });
    }
    updateStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const additionalDetails = {
                tokensPerEth: parseInt(yield this.contract.methods.tokensPerEth().call()),
                totalAssetTokensBought: parseInt(yield this.contract.methods.totalAssetTokensBought().call()),
            };
            const hasEnded = yield this.contract.methods.hasEnded().call();
            const hasCreatorWithdrawn = yield this.contract.methods.hasCreatorWithdrawn().call();
            const ethInvested = additionalDetails.totalAssetTokensBought / additionalDetails.tokensPerEth;
            const score = 0;
            const iloDetails = yield collections_1.ILO_COLLECTIONS.iloListCollection.findOneAndUpdate({ contractAddress: this.simpleDetails.contractAddress, }, { "$set": { additionalDetails, ethInvested, score, hasEnded, hasCreatorWithdrawn } }, { returnOriginal: false });
            return iloDetails.value;
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.eventListeners.forEach(listener => {
                listener.unsubscribe();
            });
        });
    }
}
exports.FixedPrice = FixedPrice;
//# sourceMappingURL=FixedPrice.js.map