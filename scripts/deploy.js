// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const NAME = "Dawson Is Awesome";
  const SYMBOL = "DAW";
  const MAX_SUPPLY = "1000000";
  const PRICE = ethers.utils.parseUnits("0.01", "ether");
  const START_TIME = Math.floor(Date.now() / 1000) + 60;
  const MIN_CONTRIBUTION = "10";
  const MAX_CONTRIBUTION = "10000";

  // Deploy Token
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY);
  await token.deployed();

  console.log(`Token deployed to: ${token.address}\n`);

  // Set start time to 1 minute in the future
  

  // Deploy Crowdsale
  const Crowdsale = await hre.ethers.getContractFactory("Crowdsale");
  const crowdsale = await Crowdsale.deploy(
    token.address,
    PRICE,
    ethers.utils.parseUnits(MAX_SUPPLY, "ether"),
    START_TIME,
    MIN_CONTRIBUTION,
    MAX_CONTRIBUTION
  );
  await crowdsale.deployed();

  console.log(`Crowdsale deployed to: ${crowdsale.address}\n`);

  const transaction = await token.transfer(
    crowdsale.address,
    ethers.utils.parseUnits(MAX_SUPPLY, "ether")
  );
  await transaction.wait();

  console.log(`Tokens transferred to Crowdsale\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
