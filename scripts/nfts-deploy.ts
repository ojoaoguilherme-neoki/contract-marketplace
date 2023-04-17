import hre from "hardhat";
async function main() {
  const NeokiNFTs = await hre.ethers.getContractFactory("NeokiNftRoyalty");
  const neokiNfts = await NeokiNFTs.deploy();

  console.log("Deploying Neoki NFTs, wait for contract address...");
  await neokiNfts.deployed();
  console.log(`Neoki NFTs deployed at ${neokiNfts.address}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
