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
exports.ILOListener = void 0;
const utils_1 = require("../../Global/utils");
const web3_1 = require("../../Global/web3");
const collections_1 = require("../collections");
const factory_1 = require("../factory");
// This is an extendable class that is used by other child classes
// e.g. FixedPriceListener, DutchAuctionListener etc. all extend this class with custom updateStats methods
class ILOListener {
    constructor(simpleIloDetails, type) {
        this.eventListeners = [];
        this.simpleDetails = simpleIloDetails;
        this.contract = web3_1.newContract(factory_1.ILO_TO_ABI_NAME[type], simpleIloDetails.contractAddress);
        this.type = type;
    }
    //@ts-ignore
    updateStats() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    ;
    getScore(ethInvested) {
        console.log(this.details.startDate);
        const timeScore = this.details.startDate / 600000;
        const ethScore = Math.log(1 + ethInvested);
        return timeScore + ethScore;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield collections_1.ILO_COLLECTIONS.addDepositHistoryCollection(this.contract.options.address);
            this.depositHistoryCollection = collections_1.ILO_COLLECTIONS.depositHistoryCollections[this.contract.options.address];
            this.details = yield collections_1.ILO_COLLECTIONS.iloListCollection.findOne({ contractAddress: this.simpleDetails.contractAddress });
            yield this.updateStats(); // Initialiser case
            yield this.startDepositListener();
            yield this.startStatsListener();
        });
    }
    startStatsListener() {
        return __awaiter(this, void 0, void 0, function* () {
            const subscription = this.contract.events.allEvents({}, () => __awaiter(this, void 0, void 0, function* () { return this.details = yield this.updateStats(); }));
            this.eventListeners.push(subscription);
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.eventListeners.forEach(listener => {
                listener.unsubscribe();
            });
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
}
exports.ILOListener = ILOListener;
//# sourceMappingURL=ILO.js.map