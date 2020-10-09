import { ALL_EXCHANGES } from "./all_exchanges";
import { FACTORY } from "./factory";
import { SWAP_COLLECTIONS } from "./collections";

class Swap {
    constructor() {

    }

    async start() {
        await SWAP_COLLECTIONS.init();
        await FACTORY.start();
        await ALL_EXCHANGES.start();
    }
}

export const SWAP = new Swap();