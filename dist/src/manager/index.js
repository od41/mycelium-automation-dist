"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const dotenv_1 = __importDefault(require("dotenv"));
const ethers_1 = require("ethers");
const AutomationRegistry__factory_1 = require("../../typechain-types/factories/AutomationRegistry__factory");
const AutomationRegistry_json_1 = __importDefault(require("../../src/contracts/artifacts/src/contracts/contracts/AutomationRegistry.sol/AutomationRegistry.json"));
// Load environment variables
dotenv_1.default.config();
// Configure logger
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
        }),
    ],
});
// Load configuration
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
// Initialize provider and wallet
const provider = new ethers_1.ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers_1.ethers.Wallet(PRIVATE_KEY, provider);
const registry = AutomationRegistry__factory_1.AutomationRegistry__factory.connect(REGISTRY_ADDRESS, wallet);
async function scanUpkeeps() {
    const upkeepCount = await registry.upkeepCount();
    logger.info(`Scanning ${upkeepCount} upkeeps`);
    for (let i = 0; i < upkeepCount; i++) {
        const upkeepInfo = await registry.getUpkeepInfo(i);
        // Skip inactive upkeeps
        if (!upkeepInfo.active)
            continue;
        // Check if it's time to execute this upkeep
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime >= Number(upkeepInfo.lastExecuted) + Number(upkeepInfo.interval)) {
            logger.info(`Executing upkeep ${i}`);
            try {
                // Load the target contract and check if upkeep is needed
                const targetContract = new ethers_1.ethers.Contract(upkeepInfo.targetContract, AutomationRegistry_json_1.default.abi, provider);
                // Encode the upkeep ID for the check
                const checkData = ethers_1.ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [i]);
                const [needsExecution, performData] = await targetContract.checkUpkeep(checkData);
                if (needsExecution) {
                    // Execute the upkeep through the registry
                    const tx = await registry.performUpkeep(i, performData, {
                        gasLimit: 500000
                    });
                    const receipt = await tx.wait();
                    if (receipt) {
                        logger.info(`Successfully executed upkeep ${i}, tx hash: ${receipt.hash}`);
                    }
                    else {
                        logger.warn(`Upkeep ${i} transaction completed but no receipt available`);
                    }
                }
                else {
                    logger.info(`Upkeep ${i} does not need execution`);
                }
            }
            catch (error) {
                logger.error(`Error executing upkeep ${i}:`, error);
            }
        }
    }
}
// Main function
async function main() {
    logger.info('Starting Mycelium Automation');
    try {
        await scanUpkeeps();
        logger.info('Mycelium Automation completed successfully');
    }
    catch (error) {
        logger.error('Error in Mycelium Automation:', error);
        process.exit(1);
    }
}
// Run the main function
main().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
});
