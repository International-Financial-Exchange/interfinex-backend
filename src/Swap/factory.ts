import factoryArtifact from "./contracts/Factory.json";
import exchangeArtifact from "./contracts/Exchange.json";
import erc20Artifact from "./contracts/ERC20.json"
import { SWAP_COLLECTIONS, EXCHANGES_COLL_NAME } from "./collections";
import { newContract } from "../Global/web3";
import { getTokenDecimals } from "../Global/utils";
import { EventEmitter } from "events";

class Factory {
    public factoryContract = newContract(factoryArtifact.abi, factoryArtifact.address);
    public events = new EventEmitter();

    async start() {
        console.log(`\n🏁 Starting Swap Factory at: ${this.factoryContract.options.address}`);

        await this.initExchangesCollection();
        await this.startExchangeCreationListener();
    }

    async initExchangesCollection() {
        console.log(`   ⛏️  Initialising ${EXCHANGES_COLL_NAME} collection`);

        const exchange_count = parseFloat(await this.factoryContract.methods.exchange_count().call());
        const createdExchanges = (await Promise.all(
            Array.from(Array(exchange_count).keys())
                .map(async exchange_id => {
                    const exchangeAddress = await this.factoryContract.methods.id_to_exchange(exchange_id).call();
                    if (!(await SWAP_COLLECTIONS.exchangesCollection.findOne({ exchangeAddress }))) {
                        await this.addExchange(exchangeAddress);
                        return true;
                    }

                    return false;
                })
        )).filter(v => v);

        console.log(`   ⛏️  Inserted ${createdExchanges.length} new swap exchanges`);
    }

    async startExchangeCreationListener() {
        console.log(`   🎧 Starting swap exchange creation listener`);
        this.factoryContract.events.NewExchange()
            .on("data", async ({ returnValues: { exchange_contract }}: any) => {
                await this.addExchange(exchange_contract);
                this.events.emit("NewExchange", { exchangeAddress: exchange_contract });
            })
            .on("changed", async ({ returnValues: { exchange_contract }}: any) => {
                console.log(`   ⛏️  Chain reorg - Removing swap exchange`);
                await SWAP_COLLECTIONS.exchangesCollection.deleteOne({ exchangeAddress: exchange_contract });
                this.events.emit("RemovedExchange", { exchangeAddress: exchange_contract });
            });
    }

    async addExchange(exchangeAddress: string) {
        console.log(`   ⛏️  Inserting new swap exchange for: ${exchangeAddress}`);
        const exchange = newContract(exchangeArtifact.abi, exchangeAddress);
        const [baseTokenAddress, assetTokenAddress] = [
            await exchange.methods.base_token().call(), 
            await exchange.methods.asset_token().call()
        ];
        
        const [baseToken, assetToken] = [
            newContract(erc20Artifact.abi as any, baseTokenAddress), 
            newContract(erc20Artifact.abi as any, assetTokenAddress), 
        ];
        
        const [assetTokenDecimals, baseTokenDecimals] = [
            await getTokenDecimals(assetToken),
            await getTokenDecimals(baseToken),                    
        ];

        return SWAP_COLLECTIONS.exchangesCollection.updateOne(
            { baseTokenAddress, assetTokenAddress, assetTokenDecimals, baseTokenDecimals },
            { "$set": { exchangeAddress }},
            { upsert: true },
        );
    }
}

export const FACTORY = new Factory();