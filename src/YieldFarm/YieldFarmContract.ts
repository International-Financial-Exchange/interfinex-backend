import { YIELD_FARM_COLLECTIONS, FARMS_COLL_NAME } from "./collections";
import { newContract } from "../Global/web3";
import { EventEmitter } from "events";
import { CONTRACTS } from "../ENV";
import { ethers } from "ethers";

type FarmInfo = {
    yieldPerBlock: string,
    tokenContract: string,
    marketType: number,
}

type FarmEvent = {
    tokenContract: string, 
    marketType: string,
}

class YieldFarmContract {
    public yieldFarmContract = newContract("YieldFarm", CONTRACTS["YieldFarm"].address);
    public events = new EventEmitter();

    async start() {
        console.log(`\n🏁 Starting Yield Farm Contract at: ${this.yieldFarmContract.options.address}`);

        await this.initFarmsCollection();
        await this.startYieldFarmListener();
    }

    async initFarmsCollection() {
        console.log(`   ⛏️  Initialising ${FARMS_COLL_NAME} collection`);

        const farms_count = parseFloat(await this.yieldFarmContract.methods.farmId().call());
        const createdFarms = (await Promise.all(
            Array.from(Array(farms_count).keys())
                .map((_, i) => i + 1)
                .map(async farmId => {
                    const liquidityTokenContract = await this.yieldFarmContract.methods.idToFarmTokenAddress(farmId).call();
                    if (liquidityTokenContract !== ethers.constants.AddressZero) {
                        const farmInfo = await this.yieldFarmContract.methods.tokenToFarmInfo(liquidityTokenContract).call();
                        farmInfo.marketType = parseInt(farmInfo.marketType);
                        if (!(await YIELD_FARM_COLLECTIONS.farmsCollection.findOne({ liquidityTokenContract }))) {
                            await this.updateFarm(farmInfo);
                            return true;
                        }
                    }

                    return false;
                })
        )).filter(v => v);

        console.log(`   ⛏️  Inserted ${createdFarms.length} new yield farms`);
    }

    async startYieldFarmListener() {
        console.log(`   🎧 Starting yield farm creation listener`);

        const updateFarmInfo = async  (event: any) => {
            const { tokenContract }: FarmEvent = event.returnValues;
            const farmInfo = await this.yieldFarmContract.methods.tokenToFarmInfo(tokenContract).call();
            farmInfo.marketType = parseInt(farmInfo.marketType);
            await this.updateFarm(farmInfo);
        };

        this.yieldFarmContract.events.NewFarm()
            .on("data", updateFarmInfo)
        
        this.yieldFarmContract.events.UpdateFarm()
            .on("data", updateFarmInfo)

        this.yieldFarmContract.events.DeleteFarm()
            .on("data", updateFarmInfo)
    }

    async updateFarm({ tokenContract, marketType, yieldPerBlock }: FarmInfo) {
        console.log(`   ⛏️  Inserting new yield farm for: ${tokenContract}`);

        let token0Address, token1Address;
        let marketContract;
        if (marketType === 0) {
            const SwapFactory = newContract("SwapFactory", CONTRACTS["SwapFactory"].address);
            [token0Address, token1Address] = [
                await SwapFactory.methods.liquidity_token_to_pair(tokenContract, 0).call(),
                await SwapFactory.methods.liquidity_token_to_pair(tokenContract, 1).call(),
            ];

            marketContract = await SwapFactory.methods.pair_to_exchange(token0Address, token1Address).call();
        }

        return YIELD_FARM_COLLECTIONS.farmsCollection.updateOne(
            { token0Address, token1Address, liquidityTokenContract: tokenContract, marketContract },
            { "$set": { yieldPerBlock }},
            { upsert: true },
        );
    }
}

export const YIELD_FARM_CONTRACT = new YieldFarmContract();