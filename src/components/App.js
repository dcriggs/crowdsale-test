import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { ethers } from "ethers";

import Navigation from "./Navigation";
import Buy from "./Buy";
import Info from "./Info";
import Loading from "./Loading";
import Progress from "./Progress";
import Whitelist from "./Whitelist";

import TOKEN_ABI from "../abis/Token.json";
import CROWDSALE_ABI from "../abis/Crowdsale.json";

import config from "../config.json";

function App() {
  const [provider, setProvider] = useState(null);
  const [crowdsale, setCrowdsale] = useState(null);

  const [account, setAccount] = useState(null);
  const [accountBalance, setAccountBalance] = useState(0);

  const [owner, setOwner] = useState(0);
  const [price, setPrice] = useState(0);
  const [maxTokens, setMaxTokens] = useState(0);
  const [tokensSold, setTokensSold] = useState(0);
  const [startTime, setStartTime] = useState(9999999999);
  const [minContribution, setMinContribution] = useState(0);
  const [maxContribution, setMaxContribution] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
    const { chainId } = await provider.getNetwork();

    const token = new ethers.Contract(
      config[chainId].token.address,
      TOKEN_ABI,
      provider
    );
    const crowdsale = new ethers.Contract(
      config[chainId].crowdsale.address,
      CROWDSALE_ABI,
      provider
    );
    setCrowdsale(crowdsale);

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);

    const accountBalance = ethers.utils.formatUnits(
      await token.balanceOf(account),
      18
    );
    setAccountBalance(accountBalance);

    const owner = await crowdsale.owner();
    setOwner(owner);

    const price = ethers.utils.formatUnits(await crowdsale.price(), 18);
    setPrice(price);

    const minContribution = ethers.utils.formatUnits(
      await crowdsale.minContribution(),
      18
    );
    setMinContribution(minContribution);

    const maxContribution = ethers.utils.formatUnits(
      await crowdsale.maxContribution(),
      18
    );
    setMaxContribution(maxContribution);

    const maxTokens = ethers.utils.formatUnits(await crowdsale.maxTokens(), 18);
    setMaxTokens(maxTokens);

    const tokensSold = ethers.utils.formatUnits(
      await crowdsale.tokensSold(),
      18
    );
    setTokensSold(tokensSold);

    const startTime = ethers.utils.formatUnits(await crowdsale.startTime(), 0);
    setStartTime(startTime);

    setIsLoading(false);
  };

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData();
    }
  }, [isLoading]);

  return (
    <Container>
      <Navigation />

      <h1 className="text-center my-4">Introducing DAW Token!</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <p className="text-center">
            <strong>Current Price:</strong> {price} ETH
            <br />
            <strong>Minimum Contribution:</strong> {minContribution} Tokens
            <br />
            <strong>Maximum Contribution:</strong> {maxContribution} Tokens
          </p>
          <Buy
            provider={provider}
            price={price}
            crowdsale={crowdsale}
            setIsLoading={setIsLoading}
            startTime={startTime}
          />
          <Progress maxTokens={maxTokens} tokensSold={tokensSold} />
        </>
      )}

      <hr />

      {account && <Info account={account} accountBalance={accountBalance} />}

      {owner === account && (
        <Container>
          <h3 className="text-center">Contract Admin Functions (Owner Only)</h3>
          <Whitelist
            provider={provider}
            crowdsale={crowdsale}
            setIsLoading={setIsLoading}
          />
        </Container>
      )}
    </Container>
  );
}

export default App;
