import { ILO_COLLECTIONS, ILO_LIST_COLL_NAME } from "./collections";
import { newContract } from "../Global/web3";
// import { getTokenDecimals } from "../Global/utils";
import { EventEmitter } from "events";
import { CONTRACTS } from "../ENV";
import { getTokenInfo, TokenInfo } from "../Global/utils";

export enum ILO_TYPES {
    FixedPrice = 1,
    DutchAuction = 2,
};

export const ILO_TO_ABI_NAME = {
    [ILO_TYPES.FixedPrice]: "FixedPricedILO",
    [ILO_TYPES.DutchAuction]: "DutchAuctionILO",
};

export type SimpleILODetails = {
    contractAddress: string, 
    name: string,
    description: string,
    id: number,
    type: ILO_TYPES,
};

export type ILODetails = SimpleILODetails & {
    assetToken: TokenInfo,
    assetTokenAmount: number,
    startDate: number, 
    endDate: number, 
    percentageToLock: number,
    liquidityUnlockDate: number,
    score: number,
    ethInvested: number,
    creationDate: number,
    creator: string,
    hasEnded: boolean,
    hasCreatorWithdrawn: boolean,
    additionalDetails?: object, 
};

class Factory {
    public factoryContract = newContract("ILOFactory", CONTRACTS["ILOFactory"].address);
    public events = new EventEmitter();

    async start() {
        console.log(`\n🏁 Starting ILO Factory at: ${this.factoryContract.options.address}`);

        await this.initIloCreationListener();
        await this.startIloCreationListener();
    }

    async initIloCreationListener() {
        console.log(`   ⛏️  Initialising ${ILO_LIST_COLL_NAME} collection`);

        const iloCount = parseFloat(await this.factoryContract.methods.id_count().call());
        const createdIlos = (await Promise.all(
            Array.from(Array(iloCount).keys())
                .map((_, i) => i + 1)
                .map(async iloId => {
                    const { contractAddress } = await this.getIloSimpleDetails(iloId);

                    if (!(await ILO_COLLECTIONS.iloListCollection.findOne({ contractAddress }))) {
                        await this.addIlo(iloId);
                        return true;
                    }

                    return false;
                })
        )).filter(v => v);

        console.log(`   ⛏️  Inserted ${createdIlos.length} new ILOs`);
    }

    async getIloSimpleDetails(iloId: number): Promise<SimpleILODetails> {
        const { 
            name, 
            description, 
            contractAddress, 
            id, 
            type 
        } = await this.factoryContract.methods.id_to_ILO(iloId).call();

        return {
            contractAddress,
            name,
            description,
            id: parseInt("" + id),
            type: parseInt("" + type),
        };
    }

    async getIloDetails(simpleIloDetails: SimpleILODetails): Promise<ILODetails> {
        const iloContract = newContract(ILO_TO_ABI_NAME[simpleIloDetails.type], simpleIloDetails.contractAddress);
        
        const assetTokenContract = newContract("ERC20", await iloContract.methods.assetToken().call());
        const assetToken: TokenInfo = await getTokenInfo(assetTokenContract);

        return {
            ...simpleIloDetails,
            assetTokenAmount: await iloContract.methods.assetTokenAmount().call(),
            assetToken,
            startDate: parseInt(await iloContract.methods.startDate().call()),
            endDate: parseInt(await iloContract.methods.endDate().call()),
            percentageToLock: await iloContract.methods.percentageToLock().call(),
            liquidityUnlockDate: parseInt(await iloContract.methods.liquidityUnlockDate().call()),
            creationDate: parseInt(await iloContract.methods.creationDate().call()),
            creator: await iloContract.methods.creator().call(),
            hasEnded: await iloContract.methods.hasEnded().call(),

            // These should be init within each ILO listener
            ethInvested: 0,
            score: 0,
            hasCreatorWithdrawn: false,
            additionalDetails: {},
        }
    }

    async addIlo(iloId: number): Promise<SimpleILODetails> {
        const simpleIloDetails: SimpleILODetails = await this.getIloSimpleDetails(iloId);
        const iloDetails: ILODetails = await this.getIloDetails(simpleIloDetails);
        
        console.log(`   ⛏️  Inserting new Fixed Price ILO for: ${simpleIloDetails.contractAddress}`);
        await ILO_COLLECTIONS.iloListCollection.updateOne(
            { contractAddress: simpleIloDetails.contractAddress },
            { "$set": iloDetails },
            { upsert: true },
        );

        return simpleIloDetails;
    }

    async startIloCreationListener() {
        console.log(`   🎧 Starting ILO creation listener`);
        this.factoryContract.events.NewILO()
            .on("data", async ({ returnValues: { id }}: any) => {
                const simpleIloDetails = await this.addIlo(id);
                this.events.emit("NewILO", simpleIloDetails);
            })
            .on("changed", async ({ returnValues: { contractAddress }}: any) => {
                console.log(`   ⛏️  Chain reorg - Removing ILO`);
                await ILO_COLLECTIONS.iloListCollection.deleteOne({ contractAddress });
                this.events.emit("RemovedILO", { contractAddress });
            });
    }
}

export const FACTORY = new Factory();