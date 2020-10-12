import { SWAP } from "./Swap/swap"
import { DATABASE } from "./Global/database";
import "./Global/utils";
import { GLOBAL_API } from "./Global/api";
import { SWAP_API } from "./Swap/api";

const main = async () => {
    await DATABASE.init();
    await SWAP.start();
    
    await GLOBAL_API.start();
    await SWAP_API.start();
};

main();