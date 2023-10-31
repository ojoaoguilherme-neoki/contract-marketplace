import hre from "hardhat";
async function main() {
  const NeokiNFTs = await hre.ethers.getContractFactory("NeokiNFTs");
  const neokiNfts = await NeokiNFTs.deploy();

  console.log("Deploying Neoki NFTs, wait for contract address...");
  await neokiNfts.deployed();
  console.log(`Neoki NFTs deployed at ${neokiNfts.address}`);

  const addMarketplace = await neokiNfts.addNeokiApp(
    "0x4377a42992f26f0e5eED5583F86d809355e1315c"
  );
  await addMarketplace.wait();
  console.log("Neoki marketplace added to nft contract");

  await sleep(20000);

  await hre.run("verify:verify", {
    address: neokiNfts.address,
    constructorArguments: [],
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
