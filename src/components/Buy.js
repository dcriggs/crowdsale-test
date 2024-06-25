import { useState } from "react";
import { Container } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import { ethers } from "ethers";

const Buy = ({ provider, price, crowdsale, setIsLoading, startTime }) => {
  const [amount, setAmount] = useState("0");
  const [isWaiting, setIsWaiting] = useState(false);
  const startDate = new Date(startTime * 1000);
  const startDateOptions = {
    weekday: "long", // "long" for full name, "short" for short name, "narrow" for minimal name
    year: "numeric", // "numeric" for full year, "2-digit" for short year
    month: "long", // "long" for full month name, "short" for short name, "narrow" for minimal name, "numeric" for number
    day: "numeric", // "numeric" for full day, "2-digit" for short day
    hour: "2-digit", // "numeric" for full hour, "2-digit" for short hour
    minute: "2-digit", // "numeric" for full minute, "2-digit" for short minute
    second: "2-digit", // "numeric" for full second, "2-digit" for short second
    timeZoneName: "short", // "short" for short timezone, "long" for long timezone
    hour12: true, // true for 12-hour time, false for 24-hour time
  };

  const buyHandler = async (e) => {
    e.preventDefault();
    setIsWaiting(true);

    try {
      const signer = await provider.getSigner();
      console.log("Signer:", signer);

      // Convert price to wei
      const priceInWei = ethers.utils.parseUnits(price.toString(), "ether");

      // Convert the amount to tokens (assuming amount is in tokens, not ether)
      const formattedAmount = ethers.utils.parseUnits(
        amount.toString(),
        "ether"
      );

      // Calculate the total cost in wei
      const value = formattedAmount
        .mul(priceInWei)
        .div(ethers.utils.parseUnits("1", "ether"));

      // Connect to the crowdsale contract with the signer
      const crowdsaleWithSigner = crowdsale.connect(signer);
      console.log("Crowdsale with signer:", crowdsaleWithSigner);

      const transaction = await crowdsaleWithSigner.buyTokens(formattedAmount, {
        value: value,
      });
      console.log("Transaction:", transaction);

      await transaction.wait();
      console.log(`Successfully bought ${amount} tokens`);

      window.alert(`Successfully bought ${amount} tokens`);
    } catch (error) {
      await console.error("Error buying tokens", error);
      window.alert(`User rejected or transaction reverted: \n${error.reason}`);
    } finally {
      setIsWaiting(false);
      setIsLoading(false);
    }
  };

  return (
    <Container>
      {startTime <= Math.floor(Date.now() / 1000) ? (
        <Form
          onSubmit={buyHandler}
          style={{ maxWidth: "800px", margin: "50px auto" }}
        >
          <Form.Group as={Row}>
            <Col>
              <Form.Control
                type="number"
                placeholder="Enter amount"
                onChange={(e) => setAmount(e.target.value)}
              />
            </Col>
            <Col className="text-center">
              {isWaiting ? (
                <Spinner animation="border" />
              ) : (
                <Button
                  variant="primary"
                  type="submit"
                  style={{ width: "100%" }}
                >
                  Buy Tokens
                </Button>
              )}
            </Col>
          </Form.Group>
        </Form>
      ) : (
        <div className="text-center">
          <h4>Crowdsale has not started yet! Come back later.</h4>
          <p>
            Start date: {startDate.toLocaleString("en-US", startDateOptions)}
          </p>
        </div>
      )}
    </Container>
  );
};

export default Buy;
