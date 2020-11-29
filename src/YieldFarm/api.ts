import { GLOBAL_API } from "../Global/api";
import { YIELD_FARM_COLLECTIONS, } from "./collections";
import { isString } from "lodash";

class YieldFarmApi {
    static URL_PREFIX = "/yieldFarm/";

    async start() {
        this.getFarms();
    }

    async getFarms() {
        type FarmsQuery = {
            limit: number
        }

        GLOBAL_API.app.get(`${YieldFarmApi.URL_PREFIX}farms`, async (req, res) => {
            const query: FarmsQuery = {
                limit: isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
            };

            const farmsCollection = YIELD_FARM_COLLECTIONS.farmsCollection;
            const farms = await farmsCollection
                .find()
                .limit(Math.min(query.limit, 500)) // Max of 500
                .toArray();

            res.json(farms);
        });
    }
}

export const YIELD_FARM_API = new YieldFarmApi();