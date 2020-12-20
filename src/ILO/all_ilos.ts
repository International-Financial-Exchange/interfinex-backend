import { ILO_COLLECTIONS } from "./collections";
// import { DutchAuction } from "./DutchAuction";
import { FACTORY, SimpleILODetails, ILO_TYPES } from "./factory";
import { FixedPrice } from "./FixedPrice";

class AllIlos {
    public ilos: FixedPrice[] = [];

    async start() {
        console.log(`\n🏁 Starting ILOs`);

        await this.startAllIloListeners();
    }

    async startAllIloListeners() {
        const iloList: { [key: string]: string }[] = await ILO_COLLECTIONS.iloListCollection.find().toArray();

        FACTORY.events.on("NewILO", (simpleIloDetails: SimpleILODetails) => {
            console.log(`   🎧 Started listening to a new ILO at: ${simpleIloDetails.contractAddress}`);
            this.addIlo(simpleIloDetails);
        });

        FACTORY.events.on("RemovedILO", ({ exchangeAddress }) => {
            console.log(`   🎧 Stopped listening to a removed ILO at: ${exchangeAddress}`);
            this.removeExchange(exchangeAddress);
        });

        const listeners = await Promise.all(
            iloList.map(async (simpleIloDetails: any) => 
                this.addIlo(simpleIloDetails)
            )
        );

        console.log(`   🎧 Listening to ${listeners.length} swap exchanges`);
        // console.log(`   DEV: Deployed Exchanges:`, exchanges);
    }

    async addIlo(simpleIloDetails: SimpleILODetails) {
        switch (simpleIloDetails.type) {
            case ILO_TYPES.FixedPrice:
                await this.addFixedPriceIlo(simpleIloDetails);
                break;
        }
    }

    async addFixedPriceIlo(simpleIloDetails: SimpleILODetails) {
        const ilo = new FixedPrice(simpleIloDetails);
        await ilo.start();
        this.ilos.push(ilo);
    }

    async removeExchange(contractToRemove: string) {
        const iloToRemove = this.ilos.find(ilo => ilo.simpleDetails.contractAddress === contractToRemove);
        if (iloToRemove) {
            iloToRemove.stop();
        }
    }
}

export const ALL_ILOS = new AllIlos();