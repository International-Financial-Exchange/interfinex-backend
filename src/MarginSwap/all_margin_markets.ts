import { MARGIN_MARKET_COLLECTIONS, } from "./collections";
import { FACTORY } from "./factory";
import { newContract } from "../Global/web3";
import { EventEmitter } from "events";
import Web3 from "web3";
import { humanizeTokenAmount } from "../Global/utils";
import { SWAP_COLLECTIONS } from "../Swap/collections";

//@ts-ignore
const BN = Web3.utils.BN;
class AllMarginMarkets {
    public marginMarketListeners: MarginMarket[] = [];

    async start() {
        console.log(`\n🏁 Starting Swap Margin Market listeners`);

        await this.startAllSwapListeners();
    }

    async startAllSwapListeners() {
        const marginMarkets: { [key: string]: string }[] = await MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.find().toArray();

        FACTORY.events.on("NewMarginMarket", ({ marginMarketAddress }) => {
            console.log(`   🎧 Started listening to a new swap margin market at: ${marginMarketAddress}`);
            this.addMarginMarket(marginMarketAddress);
        });

        FACTORY.events.on("RemovedMarginMarket", ({ marginMarketAddress }) => {
            console.log(`   🎧 Stopped listening to a removed swap margin market at: ${marginMarketAddress}`);
            this.removeMarginMarket(marginMarketAddress);
        });

        const listeners = await Promise.all(
            marginMarkets.map(async ({ marginMarketAddress, assetTokenAddress, baseTokenAddress }) => 
                this.addMarginMarket(marginMarketAddress)
            )
        );

        console.log(`   🎧 Listening to ${listeners.length} swap margin markets`);
        // console.log(`   DEV: Margin Markets:`, marginMarkets);
    }

    async addMarginMarket(contract: string) {
        const marginMarket = new MarginMarket(contract);
        await marginMarket.start();
        this.marginMarketListeners.push(marginMarket);
    }

    async removeMarginMarket(contractToRemove: string) {
        const marginMarketToRemove = this.marginMarketListeners.find(marginMarket => marginMarket.contract.options.address === contractToRemove);
        if (marginMarketToRemove) {
            await marginMarketToRemove.stop();
            this.marginMarketListeners = this.marginMarketListeners.filter(marginMarket => marginMarket.contract.options.address !== contractToRemove);
        }
    }
}

type DepositWithdraw = {
    user: string, 
    assetTokenAmount: string,
    txId: string,
    isDeposit: boolean,
    timestamp: number
}

type Position = {
    user: string,
    maintenanceMargin: number,
    originalBorrowedAmount: number,
    collateralAmount: number,
    lastInterestIndex: string,
    collateralisationRatio: number,
}

class MarginMarket {
    public contract: any;
    public collateralTokenAddress!: string;
    public assetTokenAddress!: string;
    public assetTokenDecimals!: number;
    public collateralTokenDecimals!: number;
    private eventEmitters: EventEmitter[] = [];
    private fundingHistoryCollection!: any;
    private positionsCollection!: any;
    private swapExchange!: any;

    constructor(contractAddress: string) {
        this.contract = newContract("MarginMarket", contractAddress);
    }
    
    async start() {
        const { 
            collateralTokenAddress, 
            assetTokenAddress, 
            assetTokenDecimals, 
            collateralTokenDecimals 
        } = await MARGIN_MARKET_COLLECTIONS.marginMarketsCollection.findOne({ marginMarketAddress: this.contract.options.address });

        this.collateralTokenAddress = collateralTokenAddress;
        this.assetTokenAddress = assetTokenAddress;
        this.collateralTokenDecimals = collateralTokenDecimals;
        this.assetTokenDecimals = assetTokenDecimals;

        const { exchangeAddress: swapExchangeAddress } = await SWAP_COLLECTIONS.exchangesCollection.findOne({ 
            $or: [
                { assetTokenAddress, baseTokenAddress: collateralTokenAddress },
                { assetTokenAddress: collateralTokenAddress, baseTokenAddress: assetTokenAddress },
            ] 
        });

        this.swapExchange = newContract("SwapExchange", swapExchangeAddress);

        await MARGIN_MARKET_COLLECTIONS.addFundingHistoryCollection(this.contract.options.address);
        this.fundingHistoryCollection = MARGIN_MARKET_COLLECTIONS.fundingHistoryCollections[this.contract.options.address];
        
        await MARGIN_MARKET_COLLECTIONS.addPositionsCollection(this.contract.options.address);
        this.positionsCollection = MARGIN_MARKET_COLLECTIONS.positionCollections[this.contract.options.address];

        await this.startFundingListener();
        await this.startPositionsListener();
    }

    async stop() {
        this.eventEmitters.map(emitter => {
            emitter.removeAllListeners("data");
            emitter.removeAllListeners("change");
        })
    }

    async startFundingListener() {
        const depositEmitter = this.contract.events.Deposit()
            .on("data", async (event: any) => {
                const deposit: DepositWithdraw = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: true,
                    timestamp: Date.now()
                };

                this.addEventToFundingHistory(deposit);
            })
            .on("change", async (event: any) => {
                const deposit: DepositWithdraw = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: true,
                    timestamp: Date.now()
                };

                this.removeEventFromFundingHistory(deposit);
            });

        const withdrawEmitter = this.contract.events.Withdraw()
            .on("data", async (event: any) => {
                const deposit: DepositWithdraw = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: false,
                    timestamp: Date.now()
                };
                
                this.addEventToFundingHistory(deposit);
            })
            .on("change", async (event: any) => {
                const deposit: DepositWithdraw = {
                    user: event.returnValues.user,
                    assetTokenAmount: event.returnValues.amount,
                    txId: event.transactionHash,
                    isDeposit: false,
                    timestamp: Date.now()
                };

                this.removeEventFromFundingHistory(deposit);
            });

        this.eventEmitters.push(depositEmitter);
        this.eventEmitters.push(withdrawEmitter);
    }

    async addEventToFundingHistory(event: DepositWithdraw) {
        await this.fundingHistoryCollection.insertOne(event);
    }

    async removeEventFromFundingHistory({ user, txId }: DepositWithdraw) {
        await this.fundingHistoryCollection.deleteOne({ user, txId });
    }

    async startPositionsListener() {
        const handlePositionChange = async (event: any) => {
            const { user, } = event.returnValues; 

            const {
                maintenanceMargin, 
                borrowedAmount: originalBorrowedAmount, 
                collateralAmount, 
                lastInterestIndex 
            } = await this.contract.methods.account_to_position(user).call();

            const collateralValue = humanizeTokenAmount(
                await this.swapExchange.methods.getInputToOutputAmount(this.collateralTokenAddress, collateralAmount).call(), 
                this.collateralTokenDecimals
            );
            
            const collateralisationRatio = humanizeTokenAmount(originalBorrowedAmount, this.assetTokenDecimals) / collateralValue;
            const position: Position = {
                user,  
                maintenanceMargin: humanizeTokenAmount(maintenanceMargin, this.assetTokenDecimals),
                originalBorrowedAmount: humanizeTokenAmount(originalBorrowedAmount, this.assetTokenDecimals),
                collateralAmount: humanizeTokenAmount(collateralAmount, this.collateralTokenDecimals),
                lastInterestIndex,
                collateralisationRatio: Number.isNaN(collateralisationRatio) ? 0 : collateralisationRatio,
            };

            console.log("new position", position);

            await this.updatePosition(position);
        }

        const increaseEmitter = this.contract.events.IncreasePosition()
            .on("data", handlePositionChange)
            .on("change", handlePositionChange);

        const decreaseEmitter = this.contract.events.DecreasePosition()
            .on("data", handlePositionChange)
            .on("change", handlePositionChange);

        const liquidatorEmitter = this.contract.events.LiquidatePosition()
            .on("data", handlePositionChange)
            .on("change", handlePositionChange);

        this.eventEmitters = this.eventEmitters.concat([increaseEmitter, decreaseEmitter, liquidatorEmitter]);
    }

    async updatePosition(position: Position) {
        await this.positionsCollection.updateOne(
            { user: position.user },
            { "$set": { ...position }},
            { upsert: true },
        );
    }
}

export const ALL_MARGIN_MARKETS = new AllMarginMarkets();