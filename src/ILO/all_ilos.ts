import { ILO_COLLECTIONS } from "./collections";
// import { DutchAuction } from "./DutchAuction";
import { FACTORY, SimpleILODetails, ILO_TYPES } from "./factory";
import { DutchAuctionListener } from "./listeners/DutchAuction";
import { FixedPriceListener } from "./listeners/FixedPriceListener";

class AllIlos {
    public ilos: FixedPriceListener[] = [];

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

        console.log(`   🎧 Listening to ${listeners.length} ILOs`);
        // console.log(`   DEV: Deployed Exchanges:`, exchanges);
    }

    async addIlo(simpleIloDetails: SimpleILODetails) {
        switch (simpleIloDetails.type) {
            case ILO_TYPES.FixedPrice:
                await this.addFixedPriceListener(simpleIloDetails);
                break;
            case ILO_TYPES.DutchAuction:
                await this.addDutchAuctionListener(simpleIloDetails);
                break;
        }
    }

    async addDutchAuctionListener(simpleIloDetails: SimpleILODetails) {
        console.log("adding dutch auction")
        const ilo = new DutchAuctionListener(simpleIloDetails);
        await ilo.start();
        this.ilos.push(ilo);
    }

    async addFixedPriceListener(simpleIloDetails: SimpleILODetails) {
        const ilo = new FixedPriceListener(simpleIloDetails);
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