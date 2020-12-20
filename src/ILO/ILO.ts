import { ILO_COLLECTIONS } from "./collections";
import { FACTORY } from "./factory";
// import { YIELD_FARM_CONTRACT } from "./YieldFarmContract";

class Ilo {
    constructor() {

    }

    async start() {
        await ILO_COLLECTIONS.init();
        await FACTORY.start();
        // await ALL_EXCHANGES.start();
    }
}

export const ILO = new Ilo();