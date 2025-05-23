"use strict";
// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
Object.defineProperty(exports, "__esModule", { value: true });
const modules_1 = require("@nomicfoundation/hardhat-ignition/modules");
const JAN_1ST_2030 = 1893456000;
const ONE_GWEI = 1000000000n;
const AutomationRegistryModule = (0, modules_1.buildModule)("AutomationRegistryModule", (m) => {
    return {};
});
exports.default = AutomationRegistryModule;
