const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("Crowdsale", () => {
  let crowdsale, token, accounts, deployer, user1;

  beforeEach(async () => {
    // Load contracts
    const Crowdsale = await ethers.getContractFactory("Crowdsale");
    const Token = await ethers.getContractFactory("Token");

    // Deploy token
    token = await Token.deploy("Dawson Is Cool Token", "DAW", "1000000");

    // Configure accounts
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    user1 = accounts[1];

    // Deploy crowdsale
    crowdsale = await Crowdsale.deploy(token.address, ether(1), "1000000");

    // Send tokens to crowdsale
    let transaction = await token
      .connect(deployer)
      .transfer(crowdsale.address, tokens(1000000));
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("sends tokens to the Crowdsale contracts", async () => {
      expect(await token.balanceOf(crowdsale.address)).to.equal(
        tokens(1000000)
      );
    });

    it("returns the price", async () => {
      expect(await crowdsale.price()).to.equal(ether(1));
    });

    it("returns token address", async () => {
      expect(await crowdsale.token()).to.equal(token.address);
    });
  });

  describe("Buying tokens", () => {
    let transaction, result;
    let amount = tokens(100);

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await crowdsale
          .connect(user1)
          .buyTokens(amount, { value: ether(100) });
        result = await transaction.wait();
      });

      it("transfers tokens", async () => {
        expect(await token.balanceOf(crowdsale.address)).to.equal(
          tokens(999900)
        );
        expect(await token.balanceOf(user1.address)).to.equal(amount);
      });

      it("updates contract ether balance", async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(
          amount
        );
      });

      it("updates tokens sold", async () => {
        expect(await crowdsale.tokensSold()).to.equal(amount);
      });

      it("emits a Buy event", async () => {
        //console.log(result);
        await expect(transaction)
          .to.emit(crowdsale, "Buy")
          .withArgs(amount, user1.address);
      });
    });

    describe("Failure", () => {
      it("rejects insufficient ETH", async () => {
        await expect(
          crowdsale.connect(user1).buyTokens(tokens(100), { value: 0 })
        ).to.be.reverted;
      });
    });
  });
});
