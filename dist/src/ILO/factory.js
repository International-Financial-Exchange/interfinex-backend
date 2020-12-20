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
exports.FACTORY = exports.ILO_TYPES = void 0;
const collections_1 = require("./collections");
const web3_1 = require("../Global/web3");
// import { getTokenDecimals } from "../Global/utils";
const events_1 = require("events");
const ENV_1 = require("../ENV");
const utils_1 = require("../Global/utils");
var ILO_TYPES;
(function (ILO_TYPES) {
    ILO_TYPES[ILO_TYPES["FixedPrice"] = 1] = "FixedPrice";
    ILO_TYPES[ILO_TYPES["DutchAuction"] = 2] = "DutchAuction";
})(ILO_TYPES = exports.ILO_TYPES || (exports.ILO_TYPES = {}));
;
class Factory {
    constructor() {
        this.factoryContract = web3_1.newContract("ILOFactory", ENV_1.CONTRACTS["ILOFactory"].address);
        this.events = new events_1.EventEmitter();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\n🏁 Starting ILO Factory at: ${this.factoryContract.options.address}`);
            yield this.initIloCreationListener();
            yield this.startIloCreationListener();
        });
    }
    initIloCreationListener() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   ⛏️  Initialising ${collections_1.ILO_LIST_COLL_NAME} collection`);
            const iloCount = parseFloat(yield this.factoryContract.methods.id_count().call());
            const createdIlos = (yield Promise.all(Array.from(Array(iloCount).keys())
                .map((_, i) => i + 1)
                .map((iloId) => __awaiter(this, void 0, void 0, function* () {
                const { contractAddress } = yield this.getIloSimpleDetails(iloId);
                if (!(yield collections_1.ILO_COLLECTIONS.iloListCollection.findOne({ contractAddress }))) {
                    yield this.addIlo(iloId);
                    return true;
                }
                return false;
            })))).filter(v => v);
            console.log(`   ⛏️  Inserted ${createdIlos.length} new ILOs`);
        });
    }
    getIloSimpleDetails(iloId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, description, contractAddress, id, type } = yield this.factoryContract.methods.id_to_ILO(iloId).call();
            return {
                contractAddress,
                name,
                description,
                id: parseInt("" + id),
                type: parseInt("" + type),
            };
        });
    }
    getIloDetails(simpleIloDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            const iloContract = web3_1.newContract("FixedPricedILO", simpleIloDetails.contractAddress);
            const assetTokenContract = web3_1.newContract("ERC20", yield iloContract.methods.assetToken().call());
            const assetToken = yield utils_1.getTokenInfo(assetTokenContract);
            return Object.assign(Object.assign({}, simpleIloDetails), { assetTokenAmount: parseInt(yield iloContract.methods.assetTokenAmount().call()), assetToken, startDate: parseInt(yield iloContract.methods.startDate().call()), endDate: parseInt(yield iloContract.methods.endDate().call()), softCap: parseInt(yield iloContract.methods.softCap().call()), percentageToLock: parseInt(yield iloContract.methods.percentageToLock().call()), liquidityUnlockDate: parseInt(yield iloContract.methods.liquidityUnlockDate().call()), creationDate: parseInt(yield iloContract.methods.creationDate().call()), hasEnded: yield iloContract.methods.hasEnded().call(), 
                // These should be init within each ILO listener
                ethInvested: 0, score: 0, additionalDetails: {} });
        });
    }
    addIlo(iloId) {
        return __awaiter(this, void 0, void 0, function* () {
            const iloDetails = yield this.getIloSimpleDetails(iloId);
            switch (iloDetails.type) {
                case ILO_TYPES.FixedPrice:
                    yield this.addFixedPriceIlo(iloDetails);
                    break;
            }
            return iloDetails;
        });
    }
    startIloCreationListener() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   🎧 Starting ILO creation listener`);
            this.factoryContract.events.NewILO()
                .on("data", ({ returnValues: { id, contractAddress } }) => __awaiter(this, void 0, void 0, function* () {
                const simpleIloDetails = yield this.addIlo(id);
                this.events.emit("NewILO", simpleIloDetails);
            }))
                .on("changed", ({ returnValues: { contractAddress } }) => __awaiter(this, void 0, void 0, function* () {
                console.log(`   ⛏️  Chain reorg - Removing ILO`);
                yield collections_1.ILO_COLLECTIONS.iloListCollection.deleteOne({ contractAddress });
                this.events.emit("RemovedILO", { contractAddress });
            }));
        });
    }
    addFixedPriceIlo(simpleIloDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`   ⛏️  Inserting new Fixed Price ILO for: ${simpleIloDetails.contractAddress}`);
            const iloDetails = yield this.getIloDetails(simpleIloDetails);
            return collections_1.ILO_COLLECTIONS.iloListCollection.updateOne({ contractAddress: simpleIloDetails.contractAddress }, { "$set": iloDetails }, { upsert: true });
        });
    }
}
exports.FACTORY = new Factory();
//# sourceMappingURL=factory.js.map