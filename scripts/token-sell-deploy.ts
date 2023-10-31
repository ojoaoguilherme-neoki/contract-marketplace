import { ethers } from "hardhat";
import hre from "hardhat";

const MATIC_FEED_ADDRESS_PROD = "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"; //CHECKED
const BNB_FEED_ADDRESS_PROD = "0x82a6c4AF830caa6c97bb504425f6A66165C2c26e"; //CHECKED
export const NIKO_TOKEN_ADDRESS_PROD =
  "0xca3C652e994D88740b8Ab3b33B4935592aB1DfbA"; //CHECKED

const MATIC_FEED_ADDRESS_TEST = "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada"; //CHECKED for test
const BNB_FEED_ADDRESS_TEST = "0x82a6c4AF830caa6c97bb504425f6A66165C2c26e"; //CHECK
const NIKO_TOKEN_ADDRESS_TEST = "0xD416889755FCceF5bEFFb5BDE6bcf57C11813F8E"; //CHECKED

async function main() {
  // const initialFundTest = ethers.utils.parseEther("10");
  console.log("Deploying niko token sell");
  const TokenSell = await ethers.getContractFactory("NikoTokenSales");
  const tokenSell = await TokenSell.deploy(
    MATIC_FEED_ADDRESS_PROD,
    BNB_FEED_ADDRESS_PROD, // this should be BNB Price feed when going to prod
    NIKO_TOKEN_ADDRESS_PROD
  );

  await tokenSell.deployed();

  console.log("Deployed at ", tokenSell.address);
  console.log("20seg wait for verification");

  await sleep(20000);

  await hre.run("verify:verify", {
    address: tokenSell.address,
    constructorArguments: [
      MATIC_FEED_ADDRESS_PROD,
      BNB_FEED_ADDRESS_PROD,
      NIKO_TOKEN_ADDRESS_PROD,
    ],
  });
  console.log("Done");
  // console.log(`Funding with 10 NKOs`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
