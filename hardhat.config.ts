import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.19",

  etherscan: {
    apiKey: process.env.POLYGON_API_KEY,
  },

  networks: {
    polygonMumbai: {
      url: `${process.env.ALCHEMY_RPC_URL}`,
      accounts: [`${process.env.DEPLOYER_ACCOUNT}`],
    },

    hardhat: {
      gas: "auto",
    },
  },
};

export default config;
