import { SWAP } from "./Swap/swap"
import { DATABASE } from "./Global/database";
import "./Global/utils";

const main = async () => {
    await DATABASE.init();
    await SWAP.start();
};

main();