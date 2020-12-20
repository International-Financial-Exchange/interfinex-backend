import { ALL_ILOS } from "./all_ilos";
import { ILO_COLLECTIONS } from "./collections";
import { FACTORY } from "./factory";

class Ilo {
    constructor() {

    }

    async start() {
        await ILO_COLLECTIONS.init();
        await FACTORY.start();
        await ALL_ILOS.start();
    }
}

export const ILO = new Ilo();