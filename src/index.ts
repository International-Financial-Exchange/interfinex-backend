import { SWAP } from "./Swap/swap"
import { DATABASE } from "./Global/database";
import "./Global/utils";
import { GLOBAL_API } from "./Global/api";
import { SWAP_API } from "./Swap/api";
import "./ENV";
import { MARGIN_SWAP } from "./MarginSwap/MarginSwap";
import { MARGIN_MARKET_API } from "./MarginSwap/api";

const main = async () => {
    await DATABASE.init();
    await SWAP.start();
    await MARGIN_SWAP.start();
    
    await GLOBAL_API.start();
    await SWAP_API.start();
    await MARGIN_MARKET_API.start();
};

main();