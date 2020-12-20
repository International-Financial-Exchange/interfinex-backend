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
exports.YIELD_FARM_CONTRACT = void 0;
const collections_1 = require("./collections");
const web3_1 = require("../Global/web3");
const events_1 = require("events");
const ENV_1 = require("../ENV");
const ethers_1 = require("ethers");
class YieldFarmContract {
    constructor() {
        this.yieldFarmContract = web3_1.newContract("YieldFarm", ENV_1.CONTRACTS["YieldFarm"].address);
        this.events = new events_1.EventEmitter();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\n🏁 Starting Yield Farm Contract at: ${this.yieldFarmContract.options.address}`);
            yield this.initFarmsCollection();
            yield this.startYieldFarmListener();
        });
    }
    initFarmsCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   ⛏️  Initialising ${collections_1.FARMS_COLL_NAME} collection`);
            const farms_count = parseFloat(yield this.yieldFarmContract.methods.farmId().call());
            const createdFarms = (yield Promise.all(Array.from(Array(farms_count).keys())
                .map((_, i) => i + 1)
                .map((farmId) => __awaiter(this, void 0, void 0, function* () {
                const liquidityTokenContract = yield this.yieldFarmContract.methods.idToFarmTokenAddress(farmId).call();
                if (liquidityTokenContract !== ethers_1.ethers.constants.AddressZero) {
                    const farmInfo = yield this.yieldFarmContract.methods.tokenToFarmInfo(liquidityTokenContract).call();
                    farmInfo.marketType = parseInt(farmInfo.marketType);
                    if (!(yield collections_1.YIELD_FARM_COLLECTIONS.farmsCollection.findOne({ liquidityTokenContract }))) {
                        yield this.updateFarm(farmInfo);
                        return true;
                    }
                }
                return false;
            })))).filter(v => v);
            console.log(`   ⛏️  Inserted ${createdFarms.length} new yield farms`);
        });
    }
    startYieldFarmListener() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   🎧 Starting yield farm creation listener`);
            const updateFarmInfo = (event) => __awaiter(this, void 0, void 0, function* () {
                const { tokenContract } = event.returnValues;
                const farmInfo = yield this.yieldFarmContract.methods.tokenToFarmInfo(tokenContract).call();
                farmInfo.marketType = parseInt(farmInfo.marketType);
                yield this.updateFarm(farmInfo);
            });
            this.yieldFarmContract.events.NewFarm()
                .on("data", updateFarmInfo);
            this.yieldFarmContract.events.UpdateFarm()
                .on("data", updateFarmInfo);
            this.yieldFarmContract.events.DeleteFarm()
                .on("data", updateFarmInfo);
        });
    }
    updateFarm({ tokenContract, marketType, yieldPerBlock }) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   ⛏️  Inserting new yield farm for: ${tokenContract}`);
            let token0Address, token1Address;
            let marketContract;
            if (marketType === 0) {
                const SwapFactory = web3_1.newContract("SwapFactory", ENV_1.CONTRACTS["SwapFactory"].address);
                [token0Address, token1Address] = [
                    yield SwapFactory.methods.liquidity_token_to_pair(tokenContract, 0).call(),
                    yield SwapFactory.methods.liquidity_token_to_pair(tokenContract, 1).call(),
                ];
                marketContract = yield SwapFactory.methods.pair_to_exchange(token0Address, token1Address).call();
            }
            return collections_1.YIELD_FARM_COLLECTIONS.farmsCollection.updateOne({ token0Address, token1Address, liquidityTokenContract: tokenContract, marketContract }, { "$set": { yieldPerBlock } }, { upsert: true });
        });
    }
}
exports.YIELD_FARM_CONTRACT = new YieldFarmContract();
//# sourceMappingURL=YieldFarmContract.js.map