const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AEOS Vesting System", function () {
  let aeosToken, usdtToken;
  let teamModule, strategicModule, advisorsModule;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock AEOS token
    const AeosToken = await ethers.getContractFactory("ERC20Mock");
    aeosToken = await AeosToken.deploy("AEOS", "AEOS", ethers.parseEther("2000000000"));

    // Deploy mock USDT token
    const UsdtToken = await ethers.getContractFactory("ERC20Mock");
    usdtToken = await UsdtToken.deploy("USDT", "USDT", ethers.parseEther("1000000"));

    // Deploy vesting modules directly (avoid factory size issue)
    const TeamModule = await ethers.getContractFactory("AeosVestingTeam");
    teamModule = await TeamModule.deploy();

    const StrategicModule = await ethers.getContractFactory("AeosVestingStrategic");
    strategicModule = await StrategicModule.deploy();

    const AdvisorsModule = await ethers.getContractFactory("AeosVestingAdvisors");
    advisorsModule = await AdvisorsModule.deploy();
  });

  describe("Team & Founders Module", function () {
    it("should assign team member and track vesting", async function () {
      // Deposit tokens to team module
      await aeosToken.approve(await teamModule.getAddress(), ethers.parseEther("100000000"));
      // Note: need to implement depositTeamTokens or similar function for testing

      // Assign team member
      const amount = ethers.parseEther("1000000");
      await teamModule.assignTeamMember(await user1.getAddress(), amount);

      const memberInfo = await teamModule.getMemberInfo(await user1.getAddress());
      expect(memberInfo.totalAllocated).to.equal(amount);
      expect(memberInfo.unlocked).to.equal(0); // Before cliff
    });

    it("should calculate unlocked amount after cliff", async function () {
      const amount = ethers.parseEther("1000000");
      await aeosToken.approve(await teamModule.getAddress(), ethers.parseEther("100000000"));
      await teamModule.depositTeamTokens(ethers.parseEther("100000000"));
      await teamModule.assignTeamMember(await user1.getAddress(), amount);

      // Move time past cliff (18 months)
      await time.increase(18 * 30 * 24 * 60 * 60);

      const memberInfo = await teamModule.getMemberInfo(await user1.getAddress());
      expect(memberInfo.unlocked).to.be.greaterThan(0);
    });

    it("should release tokens correctly", async function () {
      const amount = ethers.parseEther("1000000");
      await aeosToken.approve(await teamModule.getAddress(), ethers.parseEther("100000000"));
      await teamModule.depositTeamTokens(ethers.parseEther("100000000"));
      await teamModule.assignTeamMember(await user1.getAddress(), amount);

      // Move time past cliff
      await time.increase(18 * 30 * 24 * 60 * 60 + 30 * 24 * 60 * 60); // Cliff + 1 month

      const unlockable = await teamModule.getUnlockableAmount(await user1.getAddress());
      expect(unlockable).to.be.greaterThan(0);

      // Release tokens
      const initialBalance = await aeosToken.balanceOf(await user1.getAddress());
      await teamModule.connect(user1).releaseTeamTokens(await user1.getAddress());
      const finalBalance = await aeosToken.balanceOf(await user1.getAddress());

      expect(finalBalance).to.be.greaterThan(initialBalance);
    });
  });

  describe("Strategic Investors Module", function () {
    beforeEach(async function () {
      // Approve and deposit AEOS tokens
      await aeosToken.approve(
        await strategicModule.getAddress(),
        ethers.parseEther("100000000")
      );
      await strategicModule.connect(owner).call;
      // Mint USDT to user1
      await usdtToken.mint(await user1.getAddress(), ethers.parseEther("1000"));
    });

    it("should allow public to buy strategic vesting", async function () {
      const usdtAmount = ethers.parseEther("10"); // 10 USDT = 50 AEOS @ 0.2 each

      // Approve USDT
      await usdtToken
        .connect(user1)
        .approve(await strategicModule.getAddress(), ethers.parseEther("10"));

      // Buy vesting
      await strategicModule.connect(user1).buyStrategicVesting(ethers.parseEther("10"));

      const investmentInfo = await strategicModule.getInvestmentInfo(await user1.getAddress());
      expect(investmentInfo.totalPurchased).to.equal(ethers.parseEther("50"));
    });

    it("should calculate quarterly releases correctly", async function () {
      // Setup
      await usdtToken
        .connect(user1)
        .approve(await strategicModule.getAddress(), ethers.parseEther("100"));

      await strategicModule.connect(user1).buyStrategicVesting(ethers.parseEther("100"));

      // Move time past cliff (6 months)
      await time.increase(6 * 30 * 24 * 60 * 60 + 90 * 24 * 60 * 60); // Cliff + 1 quarter

      const unlockable = await strategicModule.getUnlockableAmount(await user1.getAddress());
      expect(unlockable).to.be.greaterThan(0);
    });
  });

  describe("Advisors Module", function () {
    beforeEach(async function () {
      await aeosToken.approve(await advisorsModule.getAddress(), ethers.parseEther("50000000"));
      await usdtToken.mint(await user1.getAddress(), ethers.parseEther("1000"));
    });

    it("should allow public to buy advisor vesting", async function () {
      await usdtToken
        .connect(user1)
        .approve(await advisorsModule.getAddress(), ethers.parseEther("10"));

      await advisorsModule.connect(user1).buyAdvisorVesting(ethers.parseEther("10"));

      const investmentInfo = await advisorsModule.getInvestmentInfo(await user1.getAddress());
      expect(investmentInfo.totalPurchased).to.equal(ethers.parseEther("50"));
    });
  });

  describe("Access Control", function () {
    it("should only allow owner to assign team members", async function () {
      await expect(
        teamModule.connect(user1).assignTeamMember(await user2.getAddress(), ethers.parseEther("1000000"))
      ).to.be.revertedWithCustomError(teamModule, "OwnableUnauthorizedAccount");
    });

    it("should only allow owner to deposit team tokens", async function () {
      await expect(
        teamModule.connect(user1).depositTeamTokens(ethers.parseEther("1000000"))
      ).to.be.revertedWithCustomError(teamModule, "OwnableUnauthorizedAccount");
    });
  });

  describe("Edge Cases", function () {
    it("should prevent duplicate team assignments", async function () {
      await aeosToken.approve(await teamModule.getAddress(), ethers.parseEther("100000000"));
      await teamModule.depositTeamTokens(ethers.parseEther("100000000"));

      await teamModule.assignTeamMember(await user1.getAddress(), ethers.parseEther("1000000"));

      await expect(
        teamModule.assignTeamMember(await user1.getAddress(), ethers.parseEther("500000"))
      ).to.be.revertedWith("Member already assigned");
    });

    it("should prevent investment below minimum", async function () {
      await usdtToken.mint(await user1.getAddress(), ethers.parseEther("5"));
      await usdtToken
        .connect(user1)
        .approve(await strategicModule.getAddress(), ethers.parseEther("5"));

      await expect(
        strategicModule.connect(user1).buyStrategicVesting(ethers.parseEther("5"))
      ).to.be.revertedWith("Below minimum investment");
    });
  });
});
