import hre from "hardhat";
import { parseUnits } from "ethers/lib/utils";

const from = "0xDA9d0A4b4e5748764551772e44895e6dFf37840F";

const recipents = [
  { to: "0xB3786C662aA1b6cdB74C0f869364BF64B0f9e31f", tokenId: "4" },
];

const tokenIds = [];

async function send() {
  const nftContract = await hre.ethers.getContractAt(
    "NeokiNFTs",
    "0xD4F37C27256926453a4eb72D0560C01f32c83BDf"
  );

  console.log("Sending batch");

  for (let index = 0; index < recipents.length; index++) {
    console.log(`sending - ${recipents[index].to} NFT`);
    const tx = await nftContract.safeTransferFrom(
      from,
      recipents[index].to,
      recipents[index].tokenId,
      "1",
      "0x",
      {
        gasPrice: parseUnits("152", "gwei"),
      }
    );
    await tx.wait();
    console.log("Sent");
    console.log("-----------------------");
  }
  console.log("Batch sent");
}

send().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
