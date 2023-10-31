import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

const tokenURI = "tokenURI";

describe("TESTING MARKETPLACE WITH ROYALTIES", function () {
  async function deployContractsFixture() {
    const [deployer, buyer, seller, foundation, stakePool, wallet1, wallet2] =
      await ethers.getSigners();
    const NKO = await ethers.getContractFactory("NikoToken");

    const NFTS = await ethers.getContractFactory("NeokiNFTs");
    const Erc721nfts = await ethers.getContractFactory("NFTS");
    const Marketplace = await ethers.getContractFactory("NeokiMarketplace");
    const nko = await NKO.deploy(deployer.address);
    await nko.deployed();
    const nfts = await NFTS.deploy();
    await nfts.deployed();

    const erc721nfts = await Erc721nfts.deploy();
    await erc721nfts.deployed();

    const marketplace = await Marketplace.deploy(
      foundation.address,
      stakePool.address,
      nko.address,
      nfts.address
    );
    await marketplace.deployed();

    return {
      deployer,
      buyer,
      seller,
      foundation,
      stakePool,
      wallet1,
      wallet2,
      nko,
      nfts,
      marketplace,
      erc721nfts,
    };
  }
  async function loadListingFixture() {
    const { deployer, seller, nko, marketplace, foundation, nfts, wallet1 } =
      await loadFixture(deployContractsFixture);
    await nko.connect(deployer).transfer(seller.address, parseEther("2000"));

    await nfts.connect(seller).setApprovalForAll(marketplace.address, true);

    return { seller, nko, marketplace, foundation, nfts, wallet1 };
  }

  async function loadListingErc721Fixture() {
    const {
      deployer,
      seller,
      nko,
      marketplace,
      foundation,
      nfts,
      wallet1,
      erc721nfts,
    } = await loadFixture(deployContractsFixture);
    await nko.connect(deployer).transfer(seller.address, parseEther("2000"));

    await nfts.connect(seller).setApprovalForAll(marketplace.address, true);
    await erc721nfts
      .connect(seller)
      .setApprovalForAll(marketplace.address, true);

    return { seller, nko, marketplace, foundation, nfts, wallet1, erc721nfts };
  }

  async function loadListedItemsFixture() {
    const { seller, nfts, marketplace, nko, deployer, wallet1 } =
      await loadFixture(deployContractsFixture);

    await nko.connect(deployer).transfer(seller.address, parseEther("2000"));

    // Creating NFT
    await nfts.connect(seller).mint(seller.address, 1, tokenURI, 400, "0x");
    await nfts.connect(seller).mint(seller.address, 30, tokenURI, 400, "0x");

    // Approving NFTs
    await nfts.connect(seller).setApprovalForAll(marketplace.address, true);

    // Listing NFTs
    await marketplace
      .connect(seller)
      .listItem(nfts.address, 1, 1, parseEther("500"), "0x");

    await marketplace
      .connect(seller)
      .listItem(nfts.address, 2, "25", parseEther("75"), "0x");

    return {
      seller,
      nfts,
      marketplace,
      nko,
      deployer,
      wallet1,
    };
  }

  async function loadListedToBuyItemsWithRoyaltyFixture() {
    const {
      deployer,
      buyer,
      seller,
      foundation,
      stakePool,
      wallet1,
      wallet2,
      nko,
      nfts,
      marketplace,
    } = await loadFixture(deployContractsFixture);

    // transferring tokens to actors
    await nko.connect(deployer).transfer(buyer.address, parseEther("2000"));

    // approving ERC20 to marketplace
    await nko.connect(buyer).approve(marketplace.address, parseEther("2000"));

    // creating NFT with royalty
    await nfts.connect(seller).mint(seller.address, 1, tokenURI, 400, "0x");

    // transferring nft of seller to wallet 1
    await nfts
      .connect(seller)
      .safeTransferFrom(seller.address, wallet1.address, 1, 1, "0x");

    // // approving wallet 1 NFT to marketplace

    await nfts.connect(wallet1).setApprovalForAll(marketplace.address, true);

    await marketplace
      .connect(wallet1)
      .listItem(nfts.address, 1, 1, parseEther("100"), "0x");

    return {
      deployer,
      buyer,
      seller,
      foundation,
      stakePool,
      wallet1,
      wallet2,
      nko,
      nfts,
      marketplace,
    };
  }

  async function loadListedToBuyItemsFixture() {
    const {
      deployer,
      buyer,
      seller,
      foundation,
      stakePool,
      wallet1,
      wallet2,
      nko,
      nfts,
      marketplace,
    } = await loadFixture(deployContractsFixture);

    // transferring tokens to actors
    await nko.connect(deployer).transfer(buyer.address, parseEther("2000"));

    // approving ERC20 to marketplace
    await nko.connect(buyer).approve(marketplace.address, parseEther("2000"));

    // creating NFT with no royalty
    await nfts.connect(seller).mint(seller.address, 1, tokenURI, 0, "0x");

    // transferring nft of seller to wallet 1
    await nfts
      .connect(seller)
      .safeTransferFrom(seller.address, wallet1.address, 1, 1, "0x");

    // // approving wallet 1 NFT to marketplace

    await nfts.connect(wallet1).setApprovalForAll(marketplace.address, true);

    await marketplace
      .connect(wallet1)
      .listItem(nfts.address, 1, 1, parseEther("100"), "0x");

    return {
      deployer,
      buyer,
      seller,
      foundation,
      stakePool,
      wallet1,
      wallet2,
      nko,
      nfts,
      marketplace,
    };
  }

  describe("NFTs Deployment ", function () {
    it("Should return true for ERC1155 interface type", async function () {
      const { nfts } = await loadFixture(deployContractsFixture);
      expect(await nfts.supportsInterface("0xd9b67a26")).to.be.true;
    });
    it("Should return true for ERC2981 (Royalty Standard)interface type", async function () {
      const { nfts } = await loadFixture(deployContractsFixture);
      expect(await nfts.supportsInterface("0x2a55205a")).to.be.true;
    });
  });

  describe("Marketplace Deployment", function () {
    it("Should deploy with correct NKO address", async function () {
      const { marketplace, nko } = await loadFixture(deployContractsFixture);
      expect(await marketplace.nko()).to.equal(nko.address);
    });
    it("Should deploy with correct fee setup", async function () {
      const { marketplace } = await loadFixture(deployContractsFixture);
      expect(await marketplace.listingFee()).to.equal(400);
    });
    it("Should deploy with correct deployer wallet", async function () {
      const { marketplace, deployer } = await loadFixture(
        deployContractsFixture
      );
      const admin = await marketplace.DEFAULT_ADMIN_ROLE();
      expect(await marketplace.hasRole(admin, deployer.address)).to.equal(true);
    });
  });

  describe("Testing Creating NFTs and Listing to Marketplace", function () {
    it("User should create a single NFT with correct royalty information", async function () {
      const { nfts, seller, wallet1 } = await loadFixture(loadListingFixture);
      const create = await nfts
        .connect(seller)
        .mint(seller.address, 1, tokenURI, 300, "0x");
      await create.wait();

      const tx = await nfts
        .connect(seller)
        .safeTransferFrom(seller.address, wallet1.address, 1, 1, "0x");
      await tx.wait();

      const royalty = await nfts.royaltyInfo(1, parseEther("100"));

      expect(await nfts.balanceOf(wallet1.address, 1)).to.equal(1);
      expect(royalty[0]).to.equal(seller.address);
      expect(royalty[1]).to.equal(parseEther("3"));
    });
    it("User should create a collection of NFTs and list it to the marketplace", async function () {
      const { seller, marketplace, nfts } = await loadFixture(
        loadListingFixture
      );
      const createCollection = await nfts
        .connect(seller)
        .mint(seller.address, 10, tokenURI, 500, "0x");

      await createCollection.wait();

      const listCollection = await marketplace
        .connect(seller)
        .listItem(nfts.address, 1, 10, parseEther("250"), "0x");
      await listCollection.wait();

      const items = await marketplace.getAllItems();
      expect(items[0].amount).to.equal(10);
    });

    it.only("User should create a collection of ERC721 NFTs and list it to the marketplace", async function () {
      const { seller, marketplace, erc721nfts } = await loadFixture(
        loadListingErc721Fixture
      );
      await erc721nfts.connect(seller).mint(seller.address);
      await expect(
        erc721nfts
          .connect(seller)
          .transferFrom(seller.address, marketplace.address, 1)
      ).to.changeTokenBalance(erc721nfts, marketplace, 1);
      // await marketplace
      //   .connect(seller)
      //   .listItem(erc721nfts.address, 1, 1, parseEther("250"), "0x");

      // const items = await marketplace.getAllItems();
      // expect(items).to.be.lengthOf(1);
      // expect(items[0].amount).to.equal(1);
    });

    it("Marketplace contract should create item with correct listing information", async function () {
      const { seller, marketplace, nfts } = await loadFixture(
        loadListingFixture
      );
      const createItem = await nfts
        .connect(seller)
        .mint(seller.address, 1, tokenURI, 500, "0x");
      await createItem.wait();

      const list = await marketplace
        .connect(seller)
        .listItem(nfts.address, 1, 1, parseEther("200"), "0x");
      await list.wait();

      const items = await marketplace.getAllItems();
      expect(items[0].itemId).to.equal(1);
      expect(items[0].tokenId).to.equal(1);
      expect(items[0].amount).to.equal(1);
      expect(items[0].owner).to.equal(seller.address);
      expect(items[0].nftContract).to.equal(nfts.address);
    });
  });

  describe("It should be able to update listed item", function () {
    it("Should fail to update if wallet is not the owner", async function () {
      const { marketplace, wallet1 } = await loadFixture(
        loadListedItemsFixture
      );
      await expect(
        marketplace
          .connect(wallet1)
          .updateMyListingItemPrice("2", parseEther("150"))
      ).to.be.revertedWith("Marketplace: Not the owner of the listed item");
    });
    it("Should be able to add more NFT to a listed item", async function () {
      const { marketplace, seller } = await loadFixture(loadListedItemsFixture);
      const itemsBefore = await marketplace.getAllItems();
      const addTx = await marketplace
        .connect(seller)
        .addMyListingItemAmount(2, 5);
      await addTx.wait();
      const itemsAfter = await marketplace.getAllItems();
      expect(itemsBefore[1].amount).to.equal(25);
      expect(itemsAfter[1].amount).to.equal(30);
    });
    it("Should be able to update a listed item's price", async function () {
      const { marketplace, seller } = await loadFixture(loadListedItemsFixture);
      const itemsBefore = await marketplace.getAllItems();
      const updateTx = await marketplace
        .connect(seller)
        .updateMyListingItemPrice("2", parseEther("150"));
      await updateTx.wait();
      const itemsAfter = await marketplace.getAllItems();
      expect(itemsBefore[1].price).to.be.lessThan(itemsAfter[1].price);
    });
    it("Should fail to update a collection with different tokenID", async function () {
      const { marketplace, seller, nfts } = await loadFixture(
        loadListedItemsFixture
      );
      const tx = await nfts
        .connect(seller)
        .safeTransferFrom(seller.address, marketplace.address, 2, 5, "0x");
      await tx.wait();
      await expect(
        marketplace.connect(seller).addMyListingItemAmount(2, 5)
      ).to.be.revertedWith("ERC1155: insufficient balance for transfer");
    });
    describe("Should be able to remove NFT from a listed item", function () {
      it("Should transfer the item to owner", async function () {
        const { marketplace, seller, nfts } = await loadFixture(
          loadListedItemsFixture
        );
        const removeListedItem = await marketplace
          .connect(seller)
          .removeMyListingItemAmount("1", "1");
        await removeListedItem.wait();
        expect(await nfts.balanceOf(seller.address, "1")).to.equal(1);
      });
      it("Should decrease the number of listed items from marketplace", async function () {
        const { marketplace, seller } = await loadFixture(
          loadListedItemsFixture
        );
        const itemsBefore = await marketplace.getAllItems();
        const removeListedItem = await marketplace
          .connect(seller)
          .removeMyListingItemAmount("1", "1");
        await removeListedItem.wait();
        const itemsAfter = await marketplace.getAllItems();
        expect(itemsAfter.length).to.be.lessThan(itemsBefore.length);
      });
    });
  });

  describe("Buying NFTs", function () {
    it("Marketplace should sell nfts with royalties", async function () {
      const {
        marketplace,
        buyer,
        seller,
        wallet1,
        nko,
        foundation,
        stakePool,
      } = await loadFixture(loadListedToBuyItemsWithRoyaltyFixture);
      await expect(
        marketplace.connect(buyer).buyItem(1, 1)
      ).to.changeTokenBalances(
        nko,
        [buyer, seller, wallet1, foundation, stakePool],
        [
          parseEther("-100"),
          parseEther("4"),
          parseEther("92"),
          parseEther("2"),
          parseEther("2"),
        ]
      );
    });

    it("Marketplace should sell nfts with no royalties", async function () {
      const {
        marketplace,
        buyer,
        seller,
        wallet1,
        nko,
        foundation,
        stakePool,
      } = await loadFixture(loadListedToBuyItemsFixture);
      await expect(
        marketplace.connect(buyer).buyItem(1, 1)
      ).to.changeTokenBalances(
        nko,
        [buyer, seller, wallet1, foundation, stakePool],
        [
          parseEther("-100"),
          0,
          parseEther("96"),
          parseEther("2"),
          parseEther("2"),
        ]
      );
    });
    // it("Should transfer the price amount to item's owner", async function () {
    //   const { marketplace, nko, buyer, seller } = await loadFixture(
    //     loadListedToBuyItemsFixture
    //   );
    //   const items = await marketplace.getAllItems();

    //   await expect(
    //     marketplace.connect(buyer).buyItem(items[0].itemId.toString(), "1")
    //   ).to.changeTokenBalances(
    //     nko,
    //     [buyer, seller],
    //     [`-${items[0].price.toString()}`, parseEther("1")]
    //   );
    // });
    // it("Should be able to buy an amount less than hole collection", async function () {
    //   const { buyer, marketplace, nko, seller } = await loadFixture(
    //     loadListedToBuyItemsFixture
    //   );
    //   const items = await marketplace.getAllItems();

    //   await expect(
    //     marketplace.connect(buyer).buyItem(items[1].itemId.toString(), "10")
    //   ).to.changeTokenBalances(
    //     nko,
    //     [buyer, seller],
    //     [`-${items[1].price.mul(10)}`, parseEther("1")]
    //   );
    // });
    // it("Should decrease an amount of collection after same amount is bought", async function () {
    //   const { buyer, marketplace } = await loadFixture(
    //     loadListedToBuyItemsFixture
    //   );
    //   const itemsBefore = await marketplace.getAllItems();
    //   const buyItems = await marketplace.connect(buyer).buyItem("2", "10");
    //   await buyItems.wait();
    //   const itemsAfter = await marketplace.getAllItems();
    //   expect(itemsBefore[1].amount).to.be.greaterThan(itemsAfter[1].amount);
    // });
    // it("Should be transferred the amount bought from the collection to buyer", async function () {
    //   const { buyer, marketplace, nfts } = await loadFixture(
    //     loadListedToBuyItemsFixture
    //   );
    //   expect(await nfts.balanceOf(buyer.address, "2")).to.equal(0);
    //   const buyItems = await marketplace.connect(buyer).buyItem("2", "10");
    //   await buyItems.wait();
    //   expect(await nfts.balanceOf(buyer.address, "2")).to.equal(10);
    // });
    // it("Should have a 4% fee of the price of item that must be sent to Staking Pool and Foundation", async function () {
    //   const { buyer, marketplace, foundation, stakePool, nko } =
    //     await loadFixture(loadListedToBuyItemsFixture);

    //   const items = await marketplace.getAllItems();
    //   const percentValue =
    //     (parseFloat(formatEther(items[1].price.mul(10))) * 4) / 100;

    //   await expect(
    //     marketplace.connect(buyer).buyItem("2", "10")
    //   ).to.changeTokenBalances(
    //     nko,
    //     [buyer, stakePool, foundation],
    //     [
    //       `-${items[1].price.mul(10).toString()}`,
    //       parseEther((percentValue / 2).toString()),
    //       parseEther((percentValue / 2).toString()),
    //     ]
    //   );
    // });
  });
});
