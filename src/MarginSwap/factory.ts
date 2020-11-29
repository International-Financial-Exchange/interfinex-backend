import { MARGIN_MARKET_COLLECTIONS, MARGIN_MARKETS_COLL_NAME } from "./collections";
import { newContract } from "../Global/web3";
import { getTokenDecimals } from "../Global/utils";
import { EventEmitter } from "events";
import { CONTRACTS } from "../ENV";

class Factory {
    public factoryContract = newContract("MarginFactory", CONTRACTS["MarginFactory"].address);
    public events = new EventEmitter();

    async start() {
        console.log(`\n🏁 Starting Margin Swap Factory at: ${this.factoryContract.options.address}`);

        await this.initMarginMarketsCollection();
        await this.startMarginMarketCreationListener();
    }

    async initMarginMarketsCollection() {
        console.log(`   ⛏️  Initialising ${MARGIN_MARKETS_COLL_NAME} collection`);

        const marginMarketCount = parseFloat(await this.factoryContract.methods.id_count().call());
        const createdMarginMarkets = (await Promise.all(
            Array.from(Array(marginMarketCount).keys())
                .map((_, i) => i + 1)
                .map(async market_id => {
                    const marginMarketAddress = await this.factoryContract.methods.id_to_margin_market(market_id).call();
                    if (!(await MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.findOne({ marginMarketAddress }))) {
                        await this.addMarginMarket(marginMarketAddress);
                        return true;
                    }

                    return false;
                })
        )).filter(v => v);

        console.log(`   ⛏️  Inserted ${createdMarginMarkets.length} new swap margin markets`);
    }

    async startMarginMarketCreationListener() {
        console.log(`   🎧 Starting swap margin market exchange creation listener`);
        this.factoryContract.events.NewMarginMarket()
            .on("data", async ({ returnValues: { margin_market_address }}: any) => {
                await this.addMarginMarket(margin_market_address);
                this.events.emit("NewMarginMarket", { marginMarketAddress: margin_market_address });
            })
            .on("changed", async ({ returnValues: { margin_market_address }}: any) => {
                console.log(`   ⛏️  Chain reorg - Removing swap exchange`);
                await MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.deleteOne({ marginMarketAddress: margin_market_address });
                this.events.emit("RemovedMarginMarket", { marginMarketAddress: margin_market_address });
            });
    }

    async addMarginMarket(marginMarketAddress: string) {
        console.log(`   ⛏️  Inserting new swap margin market exchange for: ${marginMarketAddress}`);
        const marginMarket = newContract("MarginMarket", marginMarketAddress);
        const [collateralTokenAddress, assetTokenAddress] = [
            await marginMarket.methods.collateralToken().call(), 
            await marginMarket.methods.assetToken().call()
        ];
        
        const [collateralToken, assetToken] = [
            newContract("ERC20", collateralTokenAddress), 
            newContract("ERC20", assetTokenAddress), 
        ];
        
        const [collateralTokenDecimals, assetTokenDecimals] = [
            await getTokenDecimals(collateralToken),
            await getTokenDecimals(assetToken),                    
        ];

        return MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.updateOne(
            { collateralTokenAddress, assetTokenAddress, assetTokenDecimals, collateralTokenDecimals },
            { "$set": { marginMarketAddress }},
            { upsert: true },
        );
    }
}

export const FACTORY = new Factory();