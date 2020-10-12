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
exports.FACTORY = void 0;
const Factory_json_1 = __importDefault(require("./contracts/Factory.json"));
const ethers_1 = require("ethers");
const ethers_2 = require("../Global/ethers");
const Exchange_json_1 = __importDefault(require("./contracts/Exchange.json"));
const collections_1 = require("./collections");
const web3_1 = require("../Global/web3");
class Factory {
    constructor() {
        this.factoryContract = web3_1.newContract(Factory_json_1.default.abi, Factory_json_1.default.address);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\n🏁 Starting Swap Factory`);
            yield this.initExchangesCollection();
            yield this.startExchangeCreationListener();
        });
    }
    initExchangesCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   ⛏️  Initialising ${collections_1.EXCHANGES_COLL_NAME} collection`);
            const exchange_count = parseFloat(yield this.factoryContract.methods.exchange_count().call());
            const pairs = yield Promise.all(Array.from(Array(exchange_count).keys())
                .map((exchange_id) => __awaiter(this, void 0, void 0, function* () {
                const exchangeAddress = yield this.factoryContract.methods.id_to_exchange(exchange_id).call();
                const exchange = new ethers_1.ethers.Contract(exchangeAddress, Exchange_json_1.default.abi, ethers_2.provider);
                const [baseTokenAddress, assetTokenAddress] = [
                    yield exchange.base_token({ gasLimit: 100000 }),
                    yield exchange.asset_token({ gasLimit: 100000 })
                ];
                // If more fine-grained details about the tokens are needed then we can get the token contracts here
                // const [baseToken, assetToken] = [
                //     new ethers.Contract(baseTokenAddress, erc20Contract.abi as any, provider), 
                //     new ethers.Contract(assetTokenAddress, erc20Contract.abi as any, provider),
                // ];
                return {
                    baseTokenAddress,
                    assetTokenAddress,
                    exchangeAddress,
                };
            })));
            // Update 'swap.exchanges' so that it contains all of the exchanges
            yield Promise.all(pairs.map(({ baseTokenAddress, assetTokenAddress, exchangeAddress }) => collections_1.SWAP_COLLECTIONS.exchangesCollection.updateOne({ baseTokenAddress, assetTokenAddress }, { "$set": { exchangeAddress } }, { upsert: true })));
        });
    }
    startExchangeCreationListener() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   🎧 Starting swap exchange creation listener`);
            this.factoryContract.events.NewExchange()
                .on("data", ({ returnValues: { base_token, asset_token, contract } }) => __awaiter(this, void 0, void 0, function* () {
                console.log(`   ⛏️  Inserting new swap exchange for: ${contract}`);
                collections_1.SWAP_COLLECTIONS.exchangesCollection.updateOne({ baseTokenAddress: base_token, assetTokenAddress: asset_token }, { "$set": { exchangeAddress: contract } }, { upsert: true });
            }))
                .on("changed", ({ returnValues: { contract } }) => __awaiter(this, void 0, void 0, function* () {
                console.log(`   ⛏️  Chain reorg - Removing swap exchange`);
                collections_1.SWAP_COLLECTIONS.exchangesCollection.deleteOne({ exchangeAddress: contract });
            }));
        });
    }
}
exports.FACTORY = new Factory();
//# sourceMappingURL=factory.js.map