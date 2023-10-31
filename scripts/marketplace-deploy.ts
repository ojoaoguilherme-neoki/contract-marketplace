import hre from "hardhat";
import {
  STAKING_POOL_ADDRESS,
  FOUNDATION_WALLET,
  NIKO_TOKEN_ADDRESS,
  ADMIN_WALLET,
} from "./constant/Contracts";

async function main() {
  const Marketplace = await hre.ethers.getContractFactory("NeokiMarketplace");

  const marketplace = await Marketplace.deploy(
    FOUNDATION_WALLET,
    STAKING_POOL_ADDRESS,
    "0xD416889755FCceF5bEFFb5BDE6bcf57C11813F8E", // NIKO_TOKEN_ADDRESS,
    ADMIN_WALLET
  );

  console.log("Deploying Marketplace, wait for contract address...");
  await marketplace.deployed();
  console.log(`Marketplace deployed at ${marketplace.address}`);
  console.log("Wait 20seg to verify the contract");
  await sleep(20000);
  await hre.run("verify:verify", {
    address: marketplace.address,

    constructorArguments: [
      FOUNDATION_WALLET,
      STAKING_POOL_ADDRESS,
      '"0xD416889755FCceF5bEFFb5BDE6bcf57C11813F8E"', //NIKO_TOKEN_ADDRESS,
      ADMIN_WALLET,
    ],
  });

  console.log("Done.");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
