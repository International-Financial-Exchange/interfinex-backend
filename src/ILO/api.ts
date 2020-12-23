import { GLOBAL_API } from "../Global/api";
import { ILO_COLLECTIONS, } from "./collections";
import { isString } from "lodash";
import { removeEmptyFields } from "../Global/utils";

enum SortType {
    hot = 0,
    new = 1,
    top = 2, 
    timeLeft = 3,
}

class IloApi {
    static URL_PREFIX = "/ilo/";

    async start() {
        this.getIloList();
        this.getIloItem();
        this.getIloDepositHistory();
        this.getUserIlos();
    }

    async getIloItem() {
        type IloQuery = {
            contractAddress?: string,
            id?: number,
        }

        GLOBAL_API.app.get(`${IloApi.URL_PREFIX}item`, async (req, res) => {
            const query: IloQuery = {
                contractAddress: isString(req.query.contractAddress) ? req.query.contractAddress : undefined,
                id: isString(req.query.id) ? parseFloat(req.query.id) : undefined,
            };

            if (!query.id && !query.contractAddress) {
                query.id = 1;
            }

            console.log(query)

            const iloListCollection = ILO_COLLECTIONS.iloListCollection;
            const iloItem = await iloListCollection.findOne(removeEmptyFields(query));

            res.json(iloItem);
        });
    }

    async getIloDepositHistory() {
        type IloDepositHistoryQuery = {
            contractAddress: string,
            user?: string,
            limit: number,
            offset: number,
        }

        GLOBAL_API.app.get(`${IloApi.URL_PREFIX}depositHistory`, async (req, res) => {
            const query: IloDepositHistoryQuery = {
                contractAddress: isString(req.query.contractAddress) ? req.query.contractAddress : "",
                limit: isString(req.query.limit) ? parseInt(req.query.limit) : 500,
                offset: isString(req.query.offset) ? parseInt(req.query.offset) : 0,
            };

            console.log("deposit query", query)

            const iloHistoryCollection = ILO_COLLECTIONS.depositHistoryCollections[query.contractAddress];
            
            const depositHistory = await iloHistoryCollection
                .find({})
                .sort({ timestamp: -1 })
                .skip(query.offset)
                .limit(Math.min(query.limit, 500)) // Max of 500
                .toArray();
                
            res.json(depositHistory);
        });
    }

    async getUserIlos() {
        type IloListQuery = {
            limit: number,
            offset: number,
            user: string,
        }

        GLOBAL_API.app.get(`${IloApi.URL_PREFIX}userIlos`, async (req, res) => {
            const query: IloListQuery = {
                limit: isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                offset: isString(req.query.offset) ? parseFloat(req.query.offset) : 0,
                user: isString(req.query.user) ? req.query.user : "",
            };

            const userIlosCollection = ILO_COLLECTIONS.userIlosCollection;
            const userIlos = await userIlosCollection.findOne({ user: query.user })
            const { iloContractAddresses } = userIlos;
            const contractsToFetch = iloContractAddresses.slice(query.offset, query.limit);

            const iloListCollection = ILO_COLLECTIONS.iloListCollection;
            const iloList = await iloListCollection
                .find({ contractAddress: { $in: contractsToFetch }})
                .toArray();

            res.json(iloList);
        });
    }

    async getIloList() {
        type IloListQuery = {
            limit: number,
            offset: number,
            sortType: SortType
        }

        GLOBAL_API.app.get(`${IloApi.URL_PREFIX}list`, async (req, res) => {
            const query: IloListQuery = {
                limit: isString(req.query.limit) ? parseFloat(req.query.limit) : 150,
                offset: isString(req.query.offset) ? parseFloat(req.query.offset) : 0,
                sortType: isString(req.query.sortType) ? parseInt(req.query.sortType) : SortType.hot,
            };

            const currentDateSeconds = Math.floor(Date.now() / 1000);
            const findQuery = (() => {
                switch (query.sortType) {
                    case SortType.hot:
                        return {
                            startDate: { $lt: currentDateSeconds},
                            endDate: { $gt: currentDateSeconds },
                        };
                    case SortType.new:
                    case SortType.top:
                        return {};
                    case SortType.timeLeft:

                        return { 
                            hasEnded: false,
                            startDate: { $lt: currentDateSeconds },
                            endDate: { $gt: currentDateSeconds },
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
                    case SortType.timeLeft:
                        return { endDate: 1, };
                }
            })();

            console.log(findQuery, sortQuery, query);

            const iloListCollection = ILO_COLLECTIONS.iloListCollection;
            const iloList = await iloListCollection
                .find(findQuery)
                .sort(sortQuery)
                .skip(query.offset)
                .limit(Math.min(query.limit, 500)) // Max of 500
                .toArray();

            res.json(iloList);
        });
    }
}

export const ILO_API = new IloApi();