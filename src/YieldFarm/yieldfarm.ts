import { YIELD_FARM_COLLECTIONS } from "./collections";
import { YIELD_FARM_CONTRACT } from "./YieldFarmContract";

class YieldFarm {
    constructor() {

    }

    async start() {
        await YIELD_FARM_COLLECTIONS.init();
        await YIELD_FARM_CONTRACT.start();
        // await ALL_EXCHANGES.start();
    }
}

export const YIELD_FARM = new YieldFarm();