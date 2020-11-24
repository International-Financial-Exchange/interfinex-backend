import { FACTORY } from "./factory";
import { MARGIN_MARKET_COLLECTIONS } from "./collections";
import { ALL_MARGIN_MARKETS } from "./all_margin_markets";

class MarginSwap {
    constructor() {

    }

    async start() {
        await MARGIN_MARKET_COLLECTIONS.init();
        await FACTORY.start();
        await ALL_MARGIN_MARKETS.start();
    }
}

export const MARGIN_SWAP = new MarginSwap();