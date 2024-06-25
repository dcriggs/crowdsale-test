const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("Crowdsale", () => {
  let crowdsale, token, accounts, deployer, user1, user2, startTime;
  let minContribution = tokens(10);
  let maxContribution = tokens(10000);

  beforeEach(async () => {
    // Load contracts
    const Crowdsale = await ethers.getContractFactory("Crowdsale");
    const Token = await ethers.getContractFactory("Token");

    // Deploy token
    token = await Token.deploy("Dawson Is Awesome", "DAW", "1000000");

    // Configure accounts
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];

    // Set start time to 1 minute in the future
    startTime = Math.floor(Date.now() / 1000) + 60;

    // Deploy crowdsale
    crowdsale = await Crowdsale.deploy(token.address, ether(0.01), "1000000", startTime, minContribution, maxContribution);

    // Send tokens to crowdsale
    let transaction = await token
      .connect(deployer)
      .transfer(crowdsale.address, tokens(1000000));
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("sends tokens to the Crowdsale contract", async () => {
      expect(await token.balanceOf(crowdsale.address)).to.equal(
        tokens(1000000)
      );
    });

    it("returns the price", async () => {
      expect(await crowdsale.price()).to.equal(ether(0.01));
    });

    it("returns token address", async () => {
      expect(await crowdsale.token()).to.equal(token.address);
    });

    it("returns the start time", async () => {
      expect(await crowdsale.startTime()).to.equal(startTime);
    });

    it("allows the owner to add to the whitelist", async () => {
      await expect(crowdsale.connect(deployer).addToWhitelist(user1.address)).to.emit(crowdsale, "WhitelistUpdated").withArgs(user1.address, true);
      expect(await crowdsale.whitelist(user1.address)).to.be.true;
    });

    it("allows the owner to remove from the whitelist", async () => {
      await expect(crowdsale.connect(deployer).removeFromWhitelist(user1.address)).to.emit(crowdsale, "WhitelistUpdated").withArgs(user1.address, false);
      expect(await crowdsale.whitelist(user1.address)).to.be.false;
    });

    it("rejects non-owner from adding to the whitelist", async () => {
      await expect(crowdsale.connect(user1).addToWhitelist(user2.address)).to.be.reverted;
    });

    it("rejects non-owner from removing from the whitelist", async () => {
      await expect(crowdsale.connect(user1).addToWhitelist(user2.address)).to.be.reverted;
    });
  });

  describe("Buying tokens", () => {
    let transaction, result;
    let amount = tokens(100);
    const pricePerToken = ethers.utils.parseUnits("0.01", "ether");

    describe("Failure", () => {
      it("rejects purchase that exceeds maximum contribution", async () => {
        await crowdsale.connect(deployer).addToWhitelist(user1.address);
        // Fast forward time to after the start time
        await ethers.provider.send("evm_increaseTime", [60]);
        await ethers.provider.send("evm_mine");
        await expect(
          crowdsale.connect(user1).buyTokens(tokens(10001), { value: tokens(10001).mul(pricePerToken).div(tokens(1)) })
        ).to.be.revertedWith("Amount exceeds maximum contribution");
      });
    });

    describe("Success", () => {
      beforeEach(async () => {
        await crowdsale.connect(deployer).addToWhitelist(user1.address);
        // Fast forward time to after the start time
        await ethers.provider.send("evm_increaseTime", [60]);
        await ethers.provider.send("evm_mine");
        transaction = await crowdsale
          .connect(user1)
          .buyTokens(amount, { value: amount.mul(pricePerToken).div(tokens(1)) });
        result = await transaction.wait();
      });

      it("transfers tokens", async () => {
        expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(999900));
        expect(await token.balanceOf(user1.address)).to.equal(amount);
      });

      it("updates contract ether balance", async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount.mul(pricePerToken).div(tokens(1)));
      });

      it("updates tokens sold", async () => {
        expect(await crowdsale.tokensSold()).to.equal(amount);
      });

      it("emits a Buy event", async () => {
        await expect(transaction)
          .to.emit(crowdsale, "Buy")
          .withArgs(amount, user1.address);
      });

      it("allows smaller purchases after initial minimum contribution", async () => {
        // User1 makes an initial purchase that meets the minimum contribution
        const minContributionAmount = tokens(10);  // Example value, set according to your contract
        await crowdsale.connect(user1).buyTokens(minContributionAmount, { value: minContributionAmount.mul(pricePerToken).div(tokens(1)) });

        // Now, user1 can make a smaller purchase
        const smallPurchase = tokens(5);  // Example value, set according to your contract
        await expect(
          crowdsale.connect(user1).buyTokens(smallPurchase, { value: smallPurchase.mul(pricePerToken).div(tokens(1)) })
        ).to.not.be.reverted;

        expect(await token.balanceOf(user1.address)).to.equal(amount.add(minContributionAmount).add(smallPurchase));
      });
    });
  });

  describe("Sending ETH", () => {
    let transaction, result;
    let amount = tokens(10);
    const pricePerToken = ethers.utils.parseUnits("0.01", "ether");

    describe("Success", () => {
      beforeEach(async () => {
        await crowdsale.connect(deployer).addToWhitelist(user1.address);
        // Fast forward time to after the start time
        await ethers.provider.send("evm_increaseTime", [60]);
        await ethers.provider.send("evm_mine");
        transaction = await user1.sendTransaction({
          to: crowdsale.address,
          value: amount.mul(pricePerToken).div(tokens(1)),
        });
        result = await transaction.wait();
      });

      it("updates contract ether balance", async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(
          amount.mul(pricePerToken).div(tokens(1))
        );
      });

      it("updates user's token balance", async () => {
        expect(await token.balanceOf(user1.address)).to.equal(amount);
      });
    });
  });

  describe("Updating Price", () => {
    let transaction, result;
    let newPrice = ether(0.02);

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await crowdsale.connect(deployer).setPrice(newPrice);
        result = await transaction.wait();
      });

      it("updates the price", async () => {
        expect(await crowdsale.price()).to.equal(newPrice);
      });
    });

    describe("Failure", () => {
      it("prevents non-owner from updating", async () => {
        await expect(crowdsale.connect(user1).setPrice(newPrice)).to.be.reverted;
      });
    });
  });

  describe("Finalizing Sale", () => {
    let transaction, result;
    let amount = tokens(10);
    const pricePerToken = ethers.utils.parseUnits("0.01", "ether");
    let value = amount.mul(pricePerToken).div(tokens(1));

    describe("Success", () => {
      beforeEach(async () => {
        await crowdsale.connect(deployer).addToWhitelist(user1.address);
        // Fast forward time to after the start time
        await ethers.provider.send("evm_increaseTime", [60]);
        await ethers.provider.send("evm_mine");
        transaction = await crowdsale
          .connect(user1)
          .buyTokens(amount, { value: value });
        result = await transaction.wait();

        transaction = await crowdsale.connect(deployer).finalize();
        result = await transaction.wait();
      });

      it("transfers remaining tokens to the owner", async () => {
        expect(await token.balanceOf(crowdsale.address)).to.equal(0);
        expect(await token.balanceOf(deployer.address)).to.equal(tokens(999990));
      });

      it("transfers contract balance to the owner", async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(0);
      });
    });

    describe("Failure", () => {
      it("prevents non-owner from finalizing", async () => {
        await expect(crowdsale.connect(user1).finalize()).to.be.reverted;
      });
    });
  });
});
