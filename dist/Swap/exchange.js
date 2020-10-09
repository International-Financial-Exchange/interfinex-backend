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
exports.ALL_EXCHANGES = void 0;
const collections_1 = require("./collections");
const factory_1 = require("./factory");
const Exchange_json_1 = __importDefault(require("./contracts/Exchange.json"));
const web3_1 = require("../Global/web3");
class Exchange {
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\n🏁 Starting Swap Exchange`);
            yield this.startAllSwapListeners();
        });
    }
    startAllSwapListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            const exchanges = yield collections_1.SWAP_COLLECTIONS.exchangesCollection.find().toArray();
            factory_1.FACTORY.factoryContract.events.NewExchange()
                .on("data", ({ returnValues: { contract } }) => __awaiter(this, void 0, void 0, function* () {
                console.log(`   🎧 Started listening to a new swap exchange at: ${contract}`);
                this.startSwapListener(contract);
            }));
            const listeners = yield Promise.all(exchanges.map(({ exchangeAddress }) => this.startSwapListener(exchangeAddress)));
            console.log(`   🎧 Listening to ${listeners.length} swap exchanges`);
        });
    }
    startSwapListener(exchangeAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const exchangeContract = web3_1.newContract(Exchange_json_1.default.abi, exchangeAddress);
            exchangeContract.events.Swap()
                .on("data", (event) => __awaiter(this, void 0, void 0, function* () {
                console.log("swap", event);
            }));
        });
    }
}
exports.ALL_EXCHANGES = new Exchange();
//# sourceMappingURL=exchange.js.map