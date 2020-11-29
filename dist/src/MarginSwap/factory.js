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
exports.FACTORY = void 0;
const collections_1 = require("./collections");
const web3_1 = require("../Global/web3");
const utils_1 = require("../Global/utils");
const events_1 = require("events");
const ENV_1 = require("../ENV");
class Factory {
    constructor() {
        this.factoryContract = web3_1.newContract("MarginFactory", ENV_1.CONTRACTS["MarginFactory"].address);
        this.events = new events_1.EventEmitter();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\n🏁 Starting Margin Swap Factory at: ${this.factoryContract.options.address}`);
            yield this.initMarginMarketsCollection();
            yield this.startMarginMarketCreationListener();
        });
    }
    initMarginMarketsCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   ⛏️  Initialising ${collections_1.MARGIN_MARKETS_COLL_NAME} collection`);
            const marginMarketCount = parseFloat(yield this.factoryContract.methods.id_count().call());
            const createdMarginMarkets = (yield Promise.all(Array.from(Array(marginMarketCount).keys())
                .map((_, i) => i + 1)
                .map((market_id) => __awaiter(this, void 0, void 0, function* () {
                const marginMarketAddress = yield this.factoryContract.methods.id_to_margin_market(market_id).call();
                if (!(yield collections_1.MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.findOne({ marginMarketAddress }))) {
                    yield this.addMarginMarket(marginMarketAddress);
                    return true;
                }
                return false;
            })))).filter(v => v);
            console.log(`   ⛏️  Inserted ${createdMarginMarkets.length} new swap margin markets`);
        });
    }
    startMarginMarketCreationListener() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   🎧 Starting swap margin market exchange creation listener`);
            this.factoryContract.events.NewMarginMarket()
                .on("data", ({ returnValues: { margin_market_address } }) => __awaiter(this, void 0, void 0, function* () {
                yield this.addMarginMarket(margin_market_address);
                this.events.emit("NewMarginMarket", { marginMarketAddress: margin_market_address });
            }))
                .on("changed", ({ returnValues: { margin_market_address } }) => __awaiter(this, void 0, void 0, function* () {
                console.log(`   ⛏️  Chain reorg - Removing swap exchange`);
                yield collections_1.MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.deleteOne({ marginMarketAddress: margin_market_address });
                this.events.emit("RemovedMarginMarket", { marginMarketAddress: margin_market_address });
            }));
        });
    }
    addMarginMarket(marginMarketAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   ⛏️  Inserting new swap margin market exchange for: ${marginMarketAddress}`);
            const marginMarket = web3_1.newContract("MarginMarket", marginMarketAddress);
            const [collateralTokenAddress, assetTokenAddress] = [
                yield marginMarket.methods.collateralToken().call(),
                yield marginMarket.methods.assetToken().call()
            ];
            const [collateralToken, assetToken] = [
                web3_1.newContract("ERC20", collateralTokenAddress),
                web3_1.newContract("ERC20", assetTokenAddress),
            ];
            const [collateralTokenDecimals, assetTokenDecimals] = [
                yield utils_1.getTokenDecimals(collateralToken),
                yield utils_1.getTokenDecimals(assetToken),
            ];
            return collections_1.MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.updateOne({ collateralTokenAddress, assetTokenAddress, assetTokenDecimals, collateralTokenDecimals }, { "$set": { marginMarketAddress } }, { upsert: true });
        });
    }
}
exports.FACTORY = new Factory();
//# sourceMappingURL=factory.js.map