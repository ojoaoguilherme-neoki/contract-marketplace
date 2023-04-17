import hre from "hardhat";
async function main() {
  const NeokiNFTs = await hre.ethers.getContractFactory("NikoToken");
  const neokiNfts = await NeokiNFTs.deploy(
    "0x85b4f58Ec2fDFc73b590422780F605be20ca6C02"
  );

  console.log("Deploying Niko tokens, wait for contract address...");
  await neokiNfts.deployed();
  console.log(`Niko token deployed at ${neokiNfts.address}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
