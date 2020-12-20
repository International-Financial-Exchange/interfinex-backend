import { GLOBAL_API } from "../Global/api";
import { ILO_COLLECTIONS, } from "./collections";
import { isString } from "lodash";

enum SortType {
    hot = 0,
    new = 1,
    top = 2, 
    endingSoonest = 3,
}

class IloApi {
    static URL_PREFIX = "/ilo/";

    async start() {
        this.getIloList();
    }

    async getIloList() {
        type IloListQuery = {
            limit: number,
            sortType: SortType
        }

        GLOBAL_API.app.get(`${IloApi.URL_PREFIX}list`, async (req, res) => {
            const query: IloListQuery = {
                limit: isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                sortType: isString(req.query.sortType) ? parseInt(req.query.sortType) : SortType.hot,
            };

            const currentDateSeconds = Math.floor(Date.now() / 1000);
            const findQuery = (() => {
                switch (query.sortType) {
                    case SortType.hot:
                        return {
                            startDate: { "lt": { currentDateSeconds }},
                            endDate: { "gt": { currentDateSeconds }},
                        };
                    case SortType.new:
                    case SortType.top:
                        return {};
                    case SortType.endingSoonest:
                        return { 
                            hasEnded: false,
                            startDate: { "lt": { currentDateSeconds }},
                            endDate: { "gt": { currentDateSeconds }},
                        };
                }
            })();

            const sortQuery = (() => {
                switch (query.sortType) {
                    case SortType.hot:
                        return { score: -1 };
                    case SortType.new:
                        return { creationDate: -1 };
                    case SortType.top:
                        return { ethInvested: -1 };
                    case SortType.endingSoonest:
                        return { endDate: 1, };
                }
            })();

            const iloListCollection = ILO_COLLECTIONS.iloListCollection;
            const iloList = await iloListCollection
                .find(findQuery)
                .sort(sortQuery)
                .limit(Math.min(query.limit, 500)) // Max of 500
                .toArray();

            res.json(iloList);
        });
    }
}

export const ILO_API = new IloApi();