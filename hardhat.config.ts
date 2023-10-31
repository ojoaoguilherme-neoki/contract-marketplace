import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },

  etherscan: {
    apiKey: process.env.POLYGON_API_KEY,
  },

  networks: {
    mumbai: {
      url: `${process.env.ALCHEMY_RPC_URL}`,
      accounts: [`${process.env.DEPLOYER_ACCOUNT}`],
    },

    polygonMainnet: {
      url: `${process.env.POLYGON_MAINNET_RPC_URL}`,
      accounts: [`${process.env.DEPLOYER_ACCOUNT}`],
    },

    hardhat: {
      gas: "auto",
    },
  },
};

export default config;
