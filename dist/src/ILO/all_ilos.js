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
exports.ALL_ILOS = void 0;
const collections_1 = require("./collections");
// import { DutchAuction } from "./DutchAuction";
const factory_1 = require("./factory");
const DutchAuction_1 = require("./listeners/DutchAuction");
const FixedPriceListener_1 = require("./listeners/FixedPriceListener");
class AllIlos {
    constructor() {
        this.ilos = [];
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\n🏁 Starting ILOs`);
            yield this.startAllIloListeners();
        });
    }
    startAllIloListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            const iloList = yield collections_1.ILO_COLLECTIONS.iloListCollection.find().toArray();
            factory_1.FACTORY.events.on("NewILO", (simpleIloDetails) => {
                console.log(`   🎧 Started listening to a new ILO at: ${simpleIloDetails.contractAddress}`);
                this.addIlo(simpleIloDetails);
            });
            factory_1.FACTORY.events.on("RemovedILO", ({ exchangeAddress }) => {
                console.log(`   🎧 Stopped listening to a removed ILO at: ${exchangeAddress}`);
                this.removeExchange(exchangeAddress);
            });
            const listeners = yield Promise.all(iloList.map((simpleIloDetails) => __awaiter(this, void 0, void 0, function* () { return this.addIlo(simpleIloDetails); })));
            console.log(`   🎧 Listening to ${listeners.length} ILOs`);
            // console.log(`   DEV: Deployed Exchanges:`, exchanges);
        });
    }
    addIlo(simpleIloDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (simpleIloDetails.type) {
                case factory_1.ILO_TYPES.FixedPrice:
                    yield this.addFixedPriceListener(simpleIloDetails);
                    break;
                case factory_1.ILO_TYPES.DutchAuction:
                    yield this.addDutchAuctionListener(simpleIloDetails);
                    break;
            }
        });
    }
    addDutchAuctionListener(simpleIloDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("adding dutch auction");
            const ilo = new DutchAuction_1.DutchAuctionListener(simpleIloDetails);
            yield ilo.start();
            this.ilos.push(ilo);
        });
    }
    addFixedPriceListener(simpleIloDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            const ilo = new FixedPriceListener_1.FixedPriceListener(simpleIloDetails);
            yield ilo.start();
            this.ilos.push(ilo);
        });
    }
    removeExchange(contractToRemove) {
        return __awaiter(this, void 0, void 0, function* () {
            const iloToRemove = this.ilos.find(ilo => ilo.simpleDetails.contractAddress === contractToRemove);
            if (iloToRemove) {
                iloToRemove.stop();
            }
        });
    }
}
exports.ALL_ILOS = new AllIlos();
//# sourceMappingURL=all_ilos.js.map