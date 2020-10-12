import factoryArtifact from "./contracts/Factory.json";
import { ethers } from "ethers";
import { provider } from "../Global/ethers";
import exchangeArtifact from "./contracts/Exchange.json";
import { SWAP_COLLECTIONS, EXCHANGES_COLL_NAME } from "./collections";
import { newContract } from "../Global/web3";

class Factory {
    public factoryContract = newContract(factoryArtifact.abi, factoryArtifact.address);

    async start() {
        console.log(`\n🏁 Starting Swap Factory`);

        await this.initExchangesCollection();
        await this.startExchangeCreationListener();
    }

    async initExchangesCollection() {
        console.log(`   ⛏️  Initialising ${EXCHANGES_COLL_NAME} collection`);
        const exchange_count = parseFloat(await this.factoryContract.methods.exchange_count().call());
        
        const pairs = await Promise.all(
            Array.from(Array(exchange_count).keys())
                .map(async exchange_id => {
                    const exchangeAddress = await this.factoryContract.methods.id_to_exchange(exchange_id).call();
                    const exchange = new ethers.Contract(exchangeAddress, exchangeArtifact.abi as any, provider);
                    const [baseTokenAddress, assetTokenAddress] = [
                        await exchange.base_token({ gasLimit: 100000 }), 
                        await exchange.asset_token({ gasLimit: 100000 })
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
                })
        );

        // Update 'swap.exchanges' so that it contains all of the exchanges
        await Promise.all(
            pairs.map(({ baseTokenAddress, assetTokenAddress, exchangeAddress }) =>
                SWAP_COLLECTIONS.exchangesCollection.updateOne(
                    { baseTokenAddress, assetTokenAddress },
                    { "$set": { exchangeAddress }},
                    { upsert: true },
                )
            )
        );
    }
    
    async startExchangeCreationListener() {
        console.log(`   🎧 Starting swap exchange creation listener`);
        this.factoryContract.events.NewExchange()
            .on("data", async ({ returnValues: { base_token, asset_token, contract }}: any) => {
                console.log(`   ⛏️  Inserting new swap exchange for: ${contract}`);
                SWAP_COLLECTIONS.exchangesCollection.updateOne(
                    { baseTokenAddress: base_token, assetTokenAddress: asset_token },
                    { "$set": { exchangeAddress: contract }},
                    { upsert: true },
                );
            })
            .on("changed", async ({ returnValues: { contract }}: any) => {
                console.log(`   ⛏️  Chain reorg - Removing swap exchange`);
                SWAP_COLLECTIONS.exchangesCollection.deleteOne({ exchangeAddress: contract });
            });
    }
}

export const FACTORY = new Factory();