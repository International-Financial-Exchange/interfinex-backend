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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_MARGIN_MARKETS = void 0;
const collections_1 = require("./collections");
const factory_1 = require("./factory");
const web3_1 = require("../Global/web3");
const web3_2 = __importDefault(require("web3"));
const utils_1 = require("../Global/utils");
const collections_2 = require("../Swap/collections");
//@ts-ignore
const BN = web3_2.default.utils.BN;
class AllMarginMarkets {
    constructor() {
        this.marginMarketListeners = [];
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\n🏁 Starting Swap Margin Market listeners`);
            yield this.startAllSwapListeners();
        });
    }
    startAllSwapListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            const marginMarkets = yield collections_1.MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.find().toArray();
            factory_1.FACTORY.events.on("NewMarginMarket", ({ marginMarketAddress }) => {
                console.log(`   🎧 Started listening to a new swap margin market at: ${marginMarketAddress}`);
                this.addMarginMarket(marginMarketAddress);
            });
            factory_1.FACTORY.events.on("RemovedMarginMarket", ({ marginMarketAddress }) => {
                console.log(`   🎧 Stopped listening to a removed swap margin market at: ${marginMarketAddress}`);
                this.removeMarginMarket(marginMarketAddress);
            });
            const listeners = yield Promise.all(marginMarkets.map(({ marginMarketAddress, assetTokenAddress, baseTokenAddress }) => __awaiter(this, void 0, void 0, function* () { return this.addMarginMarket(marginMarketAddress); })));
            console.log(`   🎧 Listening to ${listeners.length} swap margin markets`);
            // console.log(`   DEV: Margin Markets:`, marginMarkets);
        });
    }
    addMarginMarket(contract) {
        return __awaiter(this, void 0, void 0, function* () {
            const marginMarket = new MarginMarket(contract);
            yield marginMarket.start();
            this.marginMarketListeners.push(marginMarket);
        });
    }
    removeMarginMarket(contractToRemove) {
        return __awaiter(this, void 0, void 0, function* () {
            const marginMarketToRemove = this.marginMarketListeners.find(marginMarket => marginMarket.contract.options.address === contractToRemove);
            if (marginMarketToRemove) {
                yield marginMarketToRemove.stop();
                this.marginMarketListeners = this.marginMarketListeners.filter(marginMarket => marginMarket.contract.options.address !== contractToRemove);
            }
        });
    }
}
class MarginMarket {
    constructor(contractAddress) {
        this.eventListeners = [];
        this.contract = web3_1.newContract("MarginMarket", contractAddress);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const { collateralTokenAddress, assetTokenAddress, assetTokenDecimals, collateralTokenDecimals } = yield collections_1.MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.findOne({ marginMarketAddress: this.contract.options.address });
            this.collateralTokenAddress = collateralTokenAddress;
            this.assetTokenAddress = assetTokenAddress;
            this.collateralTokenDecimals = collateralTokenDecimals;
            this.assetTokenDecimals = assetTokenDecimals;
            const { exchangeAddress: swapExchangeAddress } = yield collections_2.SWAP_COLLECTIONS.exchangesCollection.findOne({
                $or: [
                    { assetTokenAddress, baseTokenAddress: collateralTokenAddress },
                    { assetTokenAddress: collateralTokenAddress, baseTokenAddress: assetTokenAddress },
                ]
            });
            this.swapExchange = web3_1.newContract("SwapExchange", swapExchangeAddress);
            yield collections_1.MARGIN_MARKET_COLLECTIONS.addFundingHistoryCollection(this.contract.options.address);
            this.fundingHistoryCollection = collections_1.MARGIN_MARKET_COLLECTIONS.fundingHistoryCollections[this.contract.options.address];
            yield collections_1.MARGIN_MARKET_COLLECTIONS.addPositionsCollection(this.contract.options.address);
            this.positionsCollection = collections_1.MARGIN_MARKET_COLLECTIONS.positionCollections[this.contract.options.address];
            yield this.startFundingListener();
            yield this.startPositionsListener();
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.eventListeners.forEach(listener => {
                listener.unsubscribe();
            });
        });
    }
    startFundingListener() {
        return __awaiter(this, void 0, void 0, function* () {
            const depositListener = this.contract.events.Deposit()
                .on("data", (event) => __awaiter(this, void 0, void 0, function* () {
                const deposit = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: true,
                    timestamp: Date.now()
                };
                this.addEventToFundingHistory(deposit);
            }))
                .on("change", (event) => __awaiter(this, void 0, void 0, function* () {
                const deposit = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: true,
                    timestamp: Date.now()
                };
                this.removeEventFromFundingHistory(deposit);
            }));
            const withdrawListener = this.contract.events.Withdraw()
                .on("data", (event) => __awaiter(this, void 0, void 0, function* () {
                const deposit = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: false,
                    timestamp: Date.now()
                };
                this.addEventToFundingHistory(deposit);
            }))
                .on("change", (event) => __awaiter(this, void 0, void 0, function* () {
                const deposit = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: false,
                    timestamp: Date.now()
                };
                this.removeEventFromFundingHistory(deposit);
            }));
            this.eventListeners.push(depositListener);
            this.eventListeners.push(withdrawListener);
        });
    }
    addEventToFundingHistory(event) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fundingHistoryCollection.insertOne(event);
        });
    }
    removeEventFromFundingHistory({ user, txId }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fundingHistoryCollection.deleteOne({ user, txId });
        });
    }
    startPositionsListener() {
        return __awaiter(this, void 0, void 0, function* () {
            const handlePositionChange = (event) => __awaiter(this, void 0, void 0, function* () {
                const { user, } = event.returnValues;
                const { maintenanceMargin, borrowedAmount: originalBorrowedAmount, collateralAmount, lastInterestIndex } = yield this.contract.methods.account_to_position(user).call();
                const collateralValue = utils_1.humanizeTokenAmount(yield this.swapExchange.methods.getInputToOutputAmount(this.collateralTokenAddress, collateralAmount).call(), this.collateralTokenDecimals);
                const collateralisationRatio = utils_1.humanizeTokenAmount(originalBorrowedAmount, this.assetTokenDecimals) / collateralValue;
                const position = {
                    user,
                    maintenanceMargin: utils_1.humanizeTokenAmount(maintenanceMargin, this.assetTokenDecimals),
                    originalBorrowedAmount: utils_1.humanizeTokenAmount(originalBorrowedAmount, this.assetTokenDecimals),
                    collateralAmount: utils_1.humanizeTokenAmount(collateralAmount, this.collateralTokenDecimals),
                    lastInterestIndex,
                    collateralisationRatio: Number.isNaN(collateralisationRatio) ? 0 : collateralisationRatio,
                };
                console.log("new position", position);
                yield this.updatePosition(position);
            });
            const increaseListener = this.contract.events.IncreasePosition()
                .on("data", handlePositionChange)
                .on("change", handlePositionChange);
            const decreaseListener = this.contract.events.DecreasePosition()
                .on("data", handlePositionChange)
                .on("change", handlePositionChange);
            const liquidatorListener = this.contract.events.LiquidatePosition()
                .on("data", handlePositionChange)
                .on("change", handlePositionChange);
            this.eventListeners = this.eventListeners.concat([increaseListener, decreaseListener, liquidatorListener]);
        });
    }
    updatePosition(position) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.positionsCollection.updateOne({ user: position.user }, { "$set": Object.assign({}, position) }, { upsert: true });
        });
    }
}
exports.ALL_MARGIN_MARKETS = new AllMarginMarkets();
//# sourceMappingURL=all_margin_markets.js.map