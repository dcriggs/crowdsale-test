import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";

const Whitelist = ({ provider, crowdsale, setIsLoading }) => {
  const [address, setAddress] = useState("0");
  const [isWaiting, setIsWaiting] = useState(false);

  const whitelistHandler = async (e) => {
    e.preventDefault();
    setIsWaiting(true);

    try {
      const signer = await provider.getSigner();

      const transaction = await crowdsale
        .connect(signer)
        .addToWhitelist(address);
      await transaction.wait();
    } catch {
      window.alert("User rejected or transaction reverted");
    }

    setIsLoading(true);
  };

  return (
    <Form
      onSubmit={whitelistHandler}
      style={{ maxWidth: "800px", margin: "50px auto" }}
    >
      <Form.Group as={Row}>
        <Col>
          <Form.Control
            type="string"
            placeholder="Enter address to whitelist"
            onChange={(e) => setAddress(e.target.value)}
          />
        </Col>
        <Col className="text-center">
          {isWaiting ? (
            <Spinner animation="border" />
          ) : (
            <Button variant="primary" type="submit" style={{ width: "100%" }}>
              Whitelist Address
            </Button>
          )}
        </Col>
      </Form.Group>
    </Form>
  );
};

export default Whitelist;
