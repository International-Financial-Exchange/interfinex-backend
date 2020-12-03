import { BigNumber } from "ethers";
import { CONTRACTS } from "../ENV";
import { GLOBAL_API } from "./api";
import { humanizeTokenAmount } from "./utils";
import { newContract } from "./web3";

console.log(CONTRACTS["IfexToken"]);

class MetadataApi {
    static URL_PREFIX = "/meta/";
    public ifexContract = newContract("DividendERC20", CONTRACTS["IfexToken"].address);

    async start() {
        this.getTotalSupply();
        this.getCirculatingSupply();
    }

    async getTotalSupply() {
        GLOBAL_API.app.get(`${MetadataApi.URL_PREFIX}ifex/totalSupply`, async (req, res) => {
            const rawTotalSupply = await this.ifexContract.methods.totalSupply().call();            
            const humanizedTotalSupply = humanizeTokenAmount(rawTotalSupply, 18);

            res.json(humanizedTotalSupply);
        });
    }

    async getCirculatingSupply() {
        const lockedAddresses = [
            "0x15E6aE26EbFD684F2c547663A1E4eDd0e880724c",
            "0xb9Ab6A54322428A91fe1543Ae35080458780E970",
            CONTRACTS["YieldFarm"].address,
        ];

        GLOBAL_API.app.get(`${MetadataApi.URL_PREFIX}ifex/circulatingSupply`, async (req, res) => {
            const rawTotalSupply = BigNumber.from(await this.ifexContract.methods.totalSupply().call()); 
            
            const balances = await Promise.all(
                lockedAddresses.map(async address => 
                    await this.ifexContract.methods.balanceOf(address).call()
                )
            );

            const rawCirculatingSupply = rawTotalSupply.sub(
                balances.reduce(($acc, balance) => 
                    $acc.add(balance), 
                    BigNumber.from("0")
                )
            );

            const humanizedCirculatingSupply = humanizeTokenAmount(rawCirculatingSupply.toString(), 18);
            
            res.json(humanizedCirculatingSupply);
        });
    }
}

export const METADATA_API = new MetadataApi();