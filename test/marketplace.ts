import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { formatEther, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

describe("TESTING MARKETPLACE", function () {
  async function deployContractsFixture() {
    const [deployer, buyer, seller, foundation, stakePool, wallet1, wallet2] =
      await ethers.getSigners();
    const NKO = await ethers.getContractFactory("NikoToken");
    const NFTS = await ethers.getContractFactory("NeokiNFTs");
    const Marketplace = await ethers.getContractFactory("NeokiMarketplace");
    const nko = await NKO.deploy(deployer.address);
    await nko.deployed();
    const nfts = await NFTS.deploy();
    await nfts.deployed();

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
    };
  }
  async function loadListingFixture() {
    const { deployer, seller, nko, marketplace, foundation, nfts, wallet1 } =
      await loadFixture(deployContractsFixture);
    const tx = await nko
      .connect(deployer)
      .transfer(seller.address, parseEther("2000"));
    await tx.wait();

    const approveNfts = await nfts
      .connect(seller)
      .setApprovalForAll(marketplace.address, true);
    await approveNfts.wait();
    return { seller, nko, marketplace, foundation, nfts, wallet1 };
  }

  async function loadListedItemsFixture() {
    const { seller, nfts, marketplace, nko, deployer, wallet1 } =
      await loadFixture(deployContractsFixture);

    const tx = await nko
      .connect(deployer)
      .transfer(seller.address, parseEther("2000"));
    await tx.wait();

    // Creating
    const create = await nfts
      .connect(seller)
      .mint(seller.address, "1", "TokenURI", "0x");
    await create.wait();

    const tokenId = await nfts._tokenIdCounter();

    const nftsApprove = await nfts
      .connect(seller)
      .setApprovalForAll(marketplace.address, true);
    await nftsApprove.wait();

    // listing
    const list = await marketplace
      .connect(seller)
      .listItem(nfts.address, tokenId.toString(), "1", parseEther("500"), "0x");
    await list.wait();

    const createCollection = await nfts
      .connect(seller)
      .mint(seller.address, "30", "tokenURI", "0x");
    await createCollection.wait();

    const tokenId2 = await nfts._tokenIdCounter();

    const listCollection = await marketplace
      .connect(seller)
      .listItem(
        nfts.address,
        tokenId2.toString(),
        "25",
        parseEther("75"),
        "0x"
      );
    await listCollection.wait();

    return {
      seller,
      nfts,
      marketplace,
      nko,
      deployer,
      wallet1,
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
    const tx = await nko
      .connect(deployer)
      .transfer(seller.address, parseEther("2000"));
    await tx.wait();
    const tx2 = await nko
      .connect(deployer)
      .transfer(buyer.address, parseEther("2000"));
    await tx2.wait();

    const nkoApprove2 = await nko
      .connect(buyer)
      .approve(marketplace.address, parseEther("2000"));
    await nkoApprove2.wait();

    const create = await nfts
      .connect(seller)
      .mint(seller.address, "1", "tokenURI", "0x");
    await create.wait();

    const tokenId = await nfts._tokenIdCounter();

    const nftApprove = await nfts
      .connect(seller)
      .setApprovalForAll(marketplace.address, true);
    await nftApprove.wait();

    const create2 = await nfts
      .connect(seller)
      .mint(seller.address, "45", "tokenURI", "0x");
    await create.wait();

    const list = await marketplace
      .connect(seller)
      .listItem(nfts.address, tokenId.toString(), "1", parseEther("500"), "0x");
    await list.wait();

    const tokenId2 = await nfts._tokenIdCounter();

    const list2 = await marketplace
      .connect(seller)
      .listItem(
        nfts.address,
        tokenId2.toString(),
        "45",
        parseEther("25"),
        "0x"
      );
    await list2.wait();

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

  describe("Marketplace Deployment", function () {
    it("Should deploy with correct NKO address", async function () {
      const { marketplace, nko } = await loadFixture(deployContractsFixture);
      expect(await marketplace.nko()).to.equal(nko.address);
    });
    it("Should deploy with correct ERC1155 address", async function () {
      const { marketplace, nfts } = await loadFixture(deployContractsFixture);
      expect(await marketplace.nkoNFT()).to.equal(nfts.address);
    });
    it("Should deploy with correct fee setup", async function () {
      const { marketplace } = await loadFixture(deployContractsFixture);
      expect(await marketplace.listingFee()).to.equal(4);
    });
    it("Should deploy with correct deployer wallet", async function () {
      const { marketplace, deployer } = await loadFixture(
        deployContractsFixture
      );
      expect(await marketplace.owner()).to.equal(deployer.address);
    });
  });
  describe("It should be able to Create and List NFT", function () {
    it("Should create a single NFT and list it to the marketplace", async function () {
      const { seller, marketplace, nfts } = await loadFixture(
        loadListingFixture
      );
      const create = await nfts
        .connect(seller)
        .mint(seller.address, "1", "tokenURI", "0x");
      await create.wait();

      const nftsSupply = await nfts._tokenIdCounter();

      const list = await marketplace
        .connect(seller)
        .listItem(
          nfts.address,
          nftsSupply.toString(),
          "1",
          parseEther("500"),
          "0x"
        );
      await list.wait();
      const items = await marketplace.getAllItems();
      expect(items.length).to.be.greaterThan(0);
    });
    it("Should create a collection of NFTs and list it to the marketplace", async function () {
      const { seller, marketplace, nfts } = await loadFixture(
        loadListingFixture
      );
      const createCollection = await nfts
        .connect(seller)
        .mint(seller.address, "10", "tokenURI", "0x");
      await createCollection.wait();
      const tokenId = await nfts._tokenIdCounter();
      const listCollection = await marketplace
        .connect(seller)
        .listItem(
          nfts.address,
          tokenId.toString(),
          "10",
          parseEther("250"),
          "0x"
        );
      await listCollection.wait();
      const items = await marketplace.getAllItems();
      expect(items[0].amount).to.be.equal(10);
    });

    describe("Should create item with correct indexed information", function () {
      it("Correct owner", async function () {
        const { seller, marketplace, nfts } = await loadFixture(
          loadListingFixture
        );
        const createItem = await nfts
          .connect(seller)
          .mint(seller.address, "1", "tokenURI", "0x");
        await createItem.wait();

        const tokenId = (await nfts._tokenIdCounter()).toString();

        const list = await marketplace
          .connect(seller)
          .listItem(nfts.address, tokenId, "1", parseEther("200"), "0x");
        await list.wait();

        const items = await marketplace.getAllItems();
        expect(items[0].owner).to.equal(seller.address);
      });

      it("Correct amount", async function () {
        const { seller, marketplace, nfts } = await loadFixture(
          loadListingFixture
        );
        const createItem = await nfts
          .connect(seller)
          .mint(seller.address, "30", "tokenURI", "0x");

        await createItem.wait();

        const tokenId = (await nfts._tokenIdCounter()).toString();

        const list = await marketplace
          .connect(seller)
          .listItem(nfts.address, tokenId, "30", parseEther("200"), "0x");

        await list.wait();

        const items = await marketplace.getAllItems();
        expect(items[0].amount).to.equal(30);
      });
      it("Correct price", async function () {
        const { seller, marketplace, nfts } = await loadFixture(
          loadListingFixture
        );
        const createItem = await nfts
          .connect(seller)
          .mint(seller.address, "30", "tokenURI", "0x");

        await createItem.wait();

        const tokenId = (await nfts._tokenIdCounter()).toString();

        const list = await marketplace
          .connect(seller)
          .listItem(nfts.address, tokenId, "30", parseEther("200"), "0x");

        await list.wait();
        const items = await marketplace.getAllItems();
        expect(items[0].price).to.equal(parseEther("200"));
      });
      it("Correct tokenId", async function () {
        const { seller, marketplace, nfts } = await loadFixture(
          loadListingFixture
        );
        const createItem = await nfts
          .connect(seller)
          .mint(seller.address, "30", "tokenURI", "0x");

        await createItem.wait();

        const tokenId = (await nfts._tokenIdCounter()).toString();

        const list = await marketplace
          .connect(seller)
          .listItem(nfts.address, tokenId, "30", parseEther("200"), "0x");
        await list.wait();

        const items = await marketplace.getAllItems();
        expect(items[0].tokenId).to.equal("1");
      });
      it("Correct NFT contract", async function () {
        const { seller, marketplace, nfts } = await loadFixture(
          loadListingFixture
        );
        const createItem = await nfts
          .connect(seller)
          .mint(seller.address, "30", "tokenURI", "0x");
        await createItem.wait();

        const tokenId = (await nfts._tokenIdCounter()).toString();

        const list = await marketplace
          .connect(seller)
          .listItem(nfts.address, tokenId, "30", parseEther("200"), "0x");
        await list.wait();

        const items = await marketplace.getAllItems();
        expect(items[0].nftContract).to.equal(nfts.address);
      });
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
      ).to.be.revertedWith("Not the owner of the listed item");
    });
    it("Should be able to add more NFT to a listed item", async function () {
      const { marketplace, seller } = await loadFixture(loadListedItemsFixture);
      const itemsBefore = await marketplace.getAllItems();
      const addTx = await marketplace
        .connect(seller)
        .addMyListingItemAmount("2", "5", "2");
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
      const { marketplace, seller } = await loadFixture(loadListedItemsFixture);
      await expect(
        marketplace.connect(seller).addMyListingItemAmount("2", "5", "1")
      ).to.be.rejectedWith("Not the same tokenId listed on the marketplace");
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
    it("Should transfer the item from the marketplace to the buyer wallet", async function () {
      const { marketplace, nfts, buyer } = await loadFixture(
        loadListedToBuyItemsFixture
      );
      const items = await marketplace.getAllItems();
      const buyItem = await marketplace.connect(buyer).buyItem("1", "1");
      await buyItem.wait();
      expect(await nfts.balanceOf(buyer.address, items[0].tokenId)).to.equal(1);
    });
    it("Should transfer the price amount to item's owner", async function () {
      const { marketplace, nko, buyer, seller } = await loadFixture(
        loadListedToBuyItemsFixture
      );
      const items = await marketplace.getAllItems();
      const percentValue =
        (parseFloat(formatEther(items[0].price.toString())) * 96) / 100;
      await expect(
        marketplace.connect(buyer).buyItem(items[0].itemId.toString(), "1")
      ).to.changeTokenBalances(
        nko,
        [buyer, seller],
        [`-${items[0].price.toString()}`, parseEther(percentValue.toString())]
      );
    });
    it("Should be able to buy an amount less than hole collection", async function () {
      const { buyer, marketplace, nko, seller } = await loadFixture(
        loadListedToBuyItemsFixture
      );
      const items = await marketplace.getAllItems();

      const percentValue =
        (parseFloat(formatEther(items[1].price.mul(10))) * 96) / 100;

      await expect(
        marketplace.connect(buyer).buyItem(items[1].itemId.toString(), "10")
      ).to.changeTokenBalances(
        nko,
        [buyer, seller],
        [`-${items[1].price.mul(10)}`, parseEther(percentValue.toString())]
      );
    });
    it("Should decrease an amount of collection after same amount is bought", async function () {
      const { buyer, marketplace } = await loadFixture(
        loadListedToBuyItemsFixture
      );
      const itemsBefore = await marketplace.getAllItems();
      const buyItems = await marketplace.connect(buyer).buyItem("2", "10");
      await buyItems.wait();
      const itemsAfter = await marketplace.getAllItems();
      expect(itemsBefore[1].amount).to.be.greaterThan(itemsAfter[1].amount);
    });
    it("Should be transferred the amount bought from the collection to buyer", async function () {
      const { buyer, marketplace, nfts } = await loadFixture(
        loadListedToBuyItemsFixture
      );
      expect(await nfts.balanceOf(buyer.address, "2")).to.equal(0);
      const buyItems = await marketplace.connect(buyer).buyItem("2", "10");
      await buyItems.wait();
      expect(await nfts.balanceOf(buyer.address, "2")).to.equal(10);
    });
    it("Should have a 4% fee of the price of item that must be sent to Staking Pool and Foundation", async function () {
      const { buyer, marketplace, foundation, stakePool, nko } =
        await loadFixture(loadListedToBuyItemsFixture);

      const items = await marketplace.getAllItems();
      const percentValue =
        (parseFloat(formatEther(items[1].price.mul(10))) * 4) / 100;

      await expect(
        marketplace.connect(buyer).buyItem("2", "10")
      ).to.changeTokenBalances(
        nko,
        [buyer, stakePool, foundation],
        [
          `-${items[1].price.mul(10).toString()}`,
          parseEther((percentValue / 2).toString()),
          parseEther((percentValue / 2).toString()),
        ]
      );
    });
  });
});
