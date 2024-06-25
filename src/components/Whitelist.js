import { useState } from "react";
import { Container } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";

const Whitelist = ({ provider, crowdsale, setIsLoading }) => {
  const [address, setAddress] = useState("0");
  const [isWaiting, setIsWaiting] = useState(false);

  function parseRevertReason(errorMessage) {
    const regex = /reverted with reason string '([^']+)'/;
    const match = errorMessage.match(regex);

    if (match && match[1]) {
      return match[1];
    } else {
      return errorMessage;
    }
  }

  const whitelistHandler = async (e) => {
    e.preventDefault();
    setIsWaiting(true);

    try {
      const signer = provider.getSigner();
      console.log("Signer:", signer);

      const crowdsaleWithSigner = crowdsale.connect(signer);
      console.log("Crowdsale with signer:", crowdsaleWithSigner);

      const transaction = await crowdsaleWithSigner.addToWhitelist(address);
      console.log("Transaction:", transaction);

      await transaction.wait();
      console.log(`Address ${address} has been whitelisted successfully`);

      window.alert(`Address ${address} has been whitelisted successfully`);
    } catch (error) {
      console.error("Error whitelisting address", error);
      window.alert(`User rejected or transaction reverted: \n${parseRevertReason(error.reason)}`);
    } finally {
      setIsWaiting(false);
      setIsLoading(false);
    }
  };

  const removeHandler = async (e) => {
    e.preventDefault();
    setIsWaiting(true);

    try {
      const signer = provider.getSigner();
      console.log("Signer:", signer);

      const crowdsaleWithSigner = crowdsale.connect(signer);
      console.log("Crowdsale with signer:", crowdsaleWithSigner);

      const transaction = await crowdsaleWithSigner.removeFromWhitelist(
        address
      );
      console.log("Transaction:", transaction);

      await transaction.wait();
      console.log(
        `Address ${address} has been successfully removed from the whitelist`
      );

      window.alert(
        `Address ${address} has been successfully removed from the whitelist`
      );
    } catch (error) {
      console.error("Error removing address from the whitelist", error);
      window.alert(`User rejected or transaction reverted: \n${parseRevertReason(error.reason)}`);
    } finally {
      setIsWaiting(false);
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Form
        onSubmit={whitelistHandler}
        style={{ maxWidth: "800px", margin: "50px auto" }}
      >
        <Form.Group as={Row}>
          <Col>
            <Form.Control
              type="text"
              placeholder="Enter address to add to whitelist"
              onChange={(e) => setAddress(e.target.value)}
            />
          </Col>
          <Col className="text-center">
            {isWaiting ? (
              <Spinner animation="border" />
            ) : (
              <Button variant="success" type="submit" style={{ width: "100%" }}>
                Whitelist Address
              </Button>
            )}
          </Col>
        </Form.Group>
      </Form>
      <Form
        onSubmit={removeHandler}
        style={{ maxWidth: "800px", margin: "50px auto" }}
      >
        <Form.Group as={Row}>
          <Col>
            <Form.Control
              type="text"
              placeholder="Enter address to remove from whitelist"
              onChange={(e) => setAddress(e.target.value)}
            />
          </Col>
          <Col className="text-center">
            {isWaiting ? (
              <Spinner animation="border" />
            ) : (
              <Button variant="danger" type="submit" style={{ width: "100%" }}>
                Remove Address
              </Button>
            )}
          </Col>
        </Form.Group>
      </Form>
    </Container>
  );
};

export default Whitelist;
