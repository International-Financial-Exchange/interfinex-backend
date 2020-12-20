import { ILO_LIST_COLL_NAME } from "./collections";
import { newContract } from "../Global/web3";
// import { getTokenDecimals } from "../Global/utils";
import { EventEmitter } from "events";
import { CONTRACTS } from "../ENV";

class Factory {
    public factoryContract = newContract("ILOFactory", CONTRACTS["ILOFactory"].address);
    public events = new EventEmitter();

    async start() {
        console.log(`\n🏁 Starting ILO Factory at: ${this.factoryContract.options.address}`);

        await this.initIloCreationListener();
        // await this.startExchangeCreationListener();
    }

    async initIloCreationListener() {
        console.log(`   ⛏️  Initialising ${ILO_LIST_COLL_NAME} collection`);

        const iloCount = parseFloat(await this.factoryContract.methods.id_count().call());
        const createdIlos = (await Promise.all(
            Array.from(Array(iloCount).keys())
                .map((_, i) => i + 1)
                .map(async id => {
                    const ilo = await this.factoryContract.methods.id_to_ilo(id).call();
                    console.log("ilo", ilo);
                    // if (!(await ILO_COLLECTIONS.iloListCollection.findOne({ contractAddress }))) {
                    //     await this.addIlo(contractAddress);
                    //     return true;
                    // }

                    // return false;
                })
        )).filter(v => v);

        console.log(`   ⛏️  Inserted ${createdIlos.length} new ILOs`);
    }

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

export const FACTORY = new Factory();