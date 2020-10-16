"use strict";
// import { SWAP } from "./Swap/swap"
// import { DATABASE } from "./Global/database";
// import "./Global/utils";
// import { GLOBAL_API } from "./Global/api";
// import { SWAP_API } from "./Swap/api";
// import "./ENV";
// import { ETH_NODE_URL } from "./ENV";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
console.log("hello");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("eth url", ETH_NODE_URL);
    // await DATABASE.init();
    // await SWAP.start();
    // await GLOBAL_API.start();
    // await SWAP_API.start();
});
main();
//# sourceMappingURL=index.js.map