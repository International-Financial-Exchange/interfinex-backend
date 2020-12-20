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
// import { getTokenDecimals } from "../Global/utils";
const events_1 = require("events");
const ENV_1 = require("../ENV");
class Factory {
    constructor() {
        this.factoryContract = web3_1.newContract("ILOFactory", ENV_1.CONTRACTS["ILOFactory"].address);
        this.events = new events_1.EventEmitter();
        // async startExchangeCreationListener() {
        //     console.log(`   🎧 Starting swap exchange creation listener`);
        //     this.factoryContract.events.NewExchange()
        //         .on("data", async ({ returnValues: { exchange_contract }}: any) => {
        //             await this.addIlo(exchange_contract);
        //             this.events.emit("NewExchange", { exchangeAddress: exchange_contract });
        //         })
        //         .on("changed", async ({ returnValues: { exchange_contract }}: any) => {
        //             console.log(`   ⛏️  Chain reorg - Removing swap exchange`);
        //             await SWAP_COLLECTIONS.exchangesCollection.deleteOne({ exchangeAddress: exchange_contract });
        //             this.events.emit("RemovedExchange", { exchangeAddress: exchange_contract });
        //         });
        // }
        // async addIlo(contractAddress: string) {
        //     console.log(`   ⛏️  Inserting new ILO for: ${contractAddress}`);
        //     const ilo = newContract("SwapExchange", contractAddress);
        //     const [baseTokenAddress, assetTokenAddress] = [
        //         await exchange.methods.base_token().call(), 
        //         await exchange.methods.asset_token().call()
        //     ];
        //     const [baseToken, assetToken] = [
        //         newContract("ERC20", baseTokenAddress), 
        //         newContract("ERC20", assetTokenAddress), 
        //     ];
        //     const [assetTokenDecimals, baseTokenDecimals] = [
        //         await getTokenDecimals(assetToken),
        //         await getTokenDecimals(baseToken),                    
        //     ];
        //     return SWAP_COLLECTIONS.exchangesCollection.updateOne(
        //         { baseTokenAddress, assetTokenAddress, assetTokenDecimals, baseTokenDecimals },
        //         { "$set": { contractAddress }},
        //         { upsert: true },
        //     );
        // }
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\n🏁 Starting ILO Factory at: ${this.factoryContract.options.address}`);
            yield this.initIloCreationListener();
            // await this.startExchangeCreationListener();
        });
    }
    initIloCreationListener() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   ⛏️  Initialising ${collections_1.ILO_LIST_COLL_NAME} collection`);
            const iloCount = parseFloat(yield this.factoryContract.methods.id_count().call());
            const createdIlos = (yield Promise.all(Array.from(Array(iloCount).keys())
                .map((_, i) => i + 1)
                .map((id) => __awaiter(this, void 0, void 0, function* () {
                const ilo = yield this.factoryContract.methods.id_to_ilo(id).call();
                console.log("ilo", ilo);
                // if (!(await ILO_COLLECTIONS.iloListCollection.findOne({ contractAddress }))) {
                //     await this.addIlo(contractAddress);
                //     return true;
                // }
                // return false;
            })))).filter(v => v);
            console.log(`   ⛏️  Inserted ${createdIlos.length} new ILOs`);
        });
    }
}
exports.FACTORY = new Factory();
//# sourceMappingURL=factory.js.map