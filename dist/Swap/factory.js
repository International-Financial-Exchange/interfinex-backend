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
const Exchange_json_1 = __importDefault(require("./contracts/Exchange.json"));
const ERC20_json_1 = __importDefault(require("./contracts/ERC20.json"));
const collections_1 = require("./collections");
const web3_1 = require("../Global/web3");
const utils_1 = require("../Global/utils");
const events_1 = require("events");
class Factory {
    constructor() {
        this.factoryContract = web3_1.newContract(Factory_json_1.default.abi, Factory_json_1.default.address);
        this.events = new events_1.EventEmitter();
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
            const createdExchanges = (yield Promise.all(Array.from(Array(exchange_count).keys())
                .map((exchange_id) => __awaiter(this, void 0, void 0, function* () {
                const exchangeAddress = yield this.factoryContract.methods.id_to_exchange(exchange_id).call();
                if (!(yield collections_1.SWAP_COLLECTIONS.exchangesCollection.findOne({ exchangeAddress }))) {
                    yield this.addExchange(exchangeAddress);
                    return true;
                }
                return false;
            })))).filter(v => v);
            console.log(`   ⛏️  Inserted ${createdExchanges.length} new swap exchanges`);
        });
    }
    addExchange(exchangeAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   ⛏️  Inserting new swap exchange for: ${exchangeAddress}`);
            const exchange = web3_1.newContract(Exchange_json_1.default.abi, exchangeAddress);
            const [baseTokenAddress, assetTokenAddress] = [
                yield exchange.methods.base_token().call(),
                yield exchange.methods.asset_token().call()
            ];
            const [baseToken, assetToken] = [
                web3_1.newContract(ERC20_json_1.default.abi, baseTokenAddress),
                web3_1.newContract(ERC20_json_1.default.abi, assetTokenAddress),
            ];
            const [assetTokenDecimals, baseTokenDecimals] = [
                yield utils_1.getTokenDecimals(assetToken),
                yield utils_1.getTokenDecimals(baseToken),
            ];
            return collections_1.SWAP_COLLECTIONS.exchangesCollection.updateOne({ baseTokenAddress, assetTokenAddress, assetTokenDecimals, baseTokenDecimals }, { "$set": { exchangeAddress } }, { upsert: true });
        });
    }
    startExchangeCreationListener() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   🎧 Starting swap exchange creation listener`);
            this.factoryContract.events.NewExchange()
                .on("data", ({ returnValues: { exchange_contract } }) => __awaiter(this, void 0, void 0, function* () {
                yield this.addExchange(exchange_contract);
                this.events.emit("NewExchange", { exchangeAddress: exchange_contract });
            }))
                .on("changed", ({ returnValues: { exchange_contract } }) => __awaiter(this, void 0, void 0, function* () {
                console.log(`   ⛏️  Chain reorg - Removing swap exchange`);
                yield collections_1.SWAP_COLLECTIONS.exchangesCollection.deleteOne({ exchangeAddress: exchange_contract });
                this.events.emit("RemovedExchange", { exchangeAddress: exchange_contract });
            }));
        });
    }
}
exports.FACTORY = new Factory();
//# sourceMappingURL=factory.js.map