const { expect } = require("chai");

const getTime = async () => {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  return blockBefore.timestamp;
};

describe("Auction", function () {
  let auction;
  let minty;
  let owner;
  let addr1;
  let addr2;

  before(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Minty = await ethers.getContractFactory("Minty");
    minty = await Minty.deploy("Name", "NAM");

    const Auction = await ethers.getContractFactory("Auction");
    auction = await Auction.deploy();

    await minty.deployed();
    await auction.deployed();

    await minty.mintToken(owner.address, "uri");
  });

  describe("Listing", () => {
    it("should revert if not approved to list", async () => {
      await expect(auction.list(minty.address, 1, 10, 1)).to.be.reverted;
    });

    it("should revert if not owner of nft", async () => {
      await expect(auction.connect(addr1).list(minty.address, 1, 10, 1)).to.be
        .reverted;
    });

    it("should allow listing nft", async () => {
      await minty.approve(auction.address, 1);
      await expect(auction.list(minty.address, 1, 10, 1)).to.emit(
        auction,
        "List"
      );
    });

    it("should allow listing 2nd nft", async () => {
      await minty.mintToken(owner.address, "uri2");
      await minty.approve(auction.address, 2);
      await expect(auction.list(minty.address, 2, 100, 2)).to.emit(
        auction,
        "List"
      );
    });
  });

  describe("Bid", () => {
    it("should not allow bid below min price", async () => {
      await expect(auction.connect(addr1).bid(0, { value: 9 })).to.be.reverted;
    });

    it("should not allow bid on auction that doesn't exist", async () => {
      await expect(auction.connect(addr1).bid(9, { value: 1000 })).to.be
        .reverted;
    });

    it("should allow valid bid", async () => {
      await expect(auction.connect(addr1).bid(0, { value: 15 })).to.emit(
        auction,
        "Bid"
      );
      const [
        nftContract,
        nftId,
        highestBid,
        minPrice,
      ] = await auction.getListing(0);
      expect(nftContract).to.equal(minty.address);
      expect(nftId).to.equal(1);
      expect(highestBid).to.equal(15);
      expect(minPrice).to.equal(10);
    });

    it("should not allow bid that is less than highest bid", async () => {
      await expect(auction.connect(addr2).bid(0, { value: 11 })).to.be.reverted;
    });

    it("should allow valid bid that is higher than highest bid", async () => {
      await expect(auction.connect(addr2).bid(0, { value: 50 })).to.emit(
        auction,
        "Bid"
      );
      const [
        nftContract,
        nftId,
        highestBid,
        minPrice,
      ] = await auction.getListing(0);
      expect(nftContract).to.equal(minty.address);
      expect(nftId).to.equal(1);
      expect(highestBid).to.equal(50);
      expect(minPrice).to.equal(10);
    });

    it("should not allow bid on auction that is completed", async () => {
      await ethers.provider.send("evm_mine", [(await getTime()) + 3600]);
      await expect(auction.connect(addr1).bid(0, { value: 1000000 })).to.be
        .reverted;
    });
  });

  describe("Withdraw Funds", () => {
    it("previous bidders can withdraw their funds", async () => {
      await expect(
        await auction.connect(addr1).withdrawFunds()
      ).to.changeEtherBalances([addr1, auction], [15, -15]);
    });

    it("current highest bidder cannot withdraw their funds", async () => {
      await expect(
        await auction.connect(addr2).withdrawFunds()
      ).to.changeEtherBalances([addr2, auction], [0, 0]);
    });

    it("owner cannot withdraw their funds until end() is called", async () => {
      await expect(
        await auction.connect(owner).withdrawFunds()
      ).to.changeEtherBalances([owner, auction], [0, 0]);
    });
  });

  describe("End", () => {
    it("Cannot call end if auction is not completed", async () => {
      await expect(auction.end(1)).to.be.reverted;
    });

    it("can call end on finished listing - should transfer nft", async () => {
      await auction.end(0);
      expect(await minty.ownerOf(1)).to.equal(addr2.address);
    });

    it("Cannot call end twice", async () => {
      await expect(auction.end(0)).to.be.reverted;
    });

    it("auction winner cannot withdraw funds once the auctions is done", async () => {
      await expect(
        await auction.connect(addr2).withdrawFunds()
      ).to.changeEtherBalances([addr2, auction], [0, 0]);
    });

    it("listing owner can withdraw funds once the auctions is done", async () => {
      await expect(
        await auction.connect(owner).withdrawFunds()
      ).to.changeEtherBalances([owner, auction], [50, -50]);
    });
  });
});
