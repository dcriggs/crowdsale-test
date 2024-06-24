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

  const buyHandler = async (e) => {
    e.preventDefault();
    setIsWaiting(true);

    try {
      const signer = await provider.getSigner();

      const value = ethers.utils.parseUnits(
        (amount * price).toString(),
        "ether"
      );
      const formattedAmount = ethers.utils.parseUnits(
        amount.toString(),
        "ether"
      );

      const transaction = await crowdsale
        .connect(signer)
        .buyTokens(formattedAmount, { value: value });
      await transaction.wait();
    } catch {
      window.alert("User rejected or transaction reverted");
    }

    setIsLoading(true);
  };

  return (
    <Container>
      {startTime <= Date.now() ? (
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
          <p>Start date: {Date(startTime)}</p>
        </div>
      )}
    </Container>
  );
};

export default Buy;
