import hre from "hardhat";
import {
  STAKING_POOL_ADDRESS,
  FOUNDATION_WALLET,
  NEOKI_NFT_CONTRACT,
  NIKO_TOKEN_ADDRESS,
} from "./constant/Contracts";

async function main() {
  const Marketplace = await hre.ethers.getContractFactory("NeokiMarketplace");
  const marketplace = await Marketplace.deploy(
    FOUNDATION_WALLET,
    STAKING_POOL_ADDRESS,
    NIKO_TOKEN_ADDRESS,
    NEOKI_NFT_CONTRACT
  );

  console.log("Deploying Marketplace, wait for contract address...");
  await marketplace.deployed();
  console.log(`Marketplace deployed at ${marketplace.address}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
