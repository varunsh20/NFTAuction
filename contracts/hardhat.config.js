require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()

const SEPOLIA_RPC_URL = process.env.ALCHEMY_SEPOLIA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const E_API = process.env.Etherscan_API;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  
  solidity: "0.8.24",
};
