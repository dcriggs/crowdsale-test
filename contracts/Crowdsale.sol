// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract Crowdsale {
    address public owner;
    Token public token;
    uint256 public price;
    uint256 public maxTokens;
    uint256 public tokensSold;
    uint256 public startTime;
    uint256 public minContribution;
    uint256 public maxContribution;
    mapping(address => uint256) public contributions;
    mapping(address => bool) public whitelist;

    event Buy(uint256 amount, address buyer);
    event Finalize(uint256 tokensSold, uint256 ethRaised);
    event WhitelistUpdated(address indexed account, bool isWhitelisted);

    constructor(
        Token _token,
        uint256 _price,
        uint256 _maxTokens,
        uint256 _startTime,
        uint256 _minContribution,
        uint256 _maxContribution
    ) {
        owner = msg.sender;
        token = _token;
        price = _price;
        maxTokens = _maxTokens;
        startTime = _startTime;
        minContribution = _minContribution;
        maxContribution = _maxContribution;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier onlyWhenOpen() {
        require(block.timestamp >= startTime, "Crowdsale has not started yet");
        _;
    }

    receive() external payable onlyWhenOpen {
        uint256 amount = msg.value * 1e18 / price;
        buyTokens(amount);
    }

    function buyTokens(uint256 _amount) public payable {
        require(block.timestamp >= startTime, "Crowdsale has not started yet");
        require(whitelist[msg.sender], "Address not whitelisted");
        if (contributions[msg.sender] == 0) {
            require(_amount >= minContribution, "Amount below minimum contribution");
        }
        require(contributions[msg.sender] + _amount <= maxContribution, "Amount exceeds maximum contribution");

        uint256 cost = (_amount * price) / 1e18;
        require(msg.value == cost, "Incorrect ETH value sent");

        require(token.balanceOf(address(this)) >= _amount, "Not enough tokens available");
        require(token.transfer(msg.sender, _amount), "Token transfer failed");

        contributions[msg.sender] += _amount;
        tokensSold += _amount;

        emit Buy(_amount, msg.sender);
    }

    function addToWhitelist(address _address) public onlyOwner {
        whitelist[_address] = true;
        emit WhitelistUpdated(_address, true);
    }

    function removeFromWhitelist(address _address) public onlyOwner {
        whitelist[_address] = false;
        emit WhitelistUpdated(_address, false);
    }

    function setPrice(uint256 _price) public onlyOwner {
        price = _price;
    }

    function finalize() public onlyOwner {
        require(token.transfer(owner, token.balanceOf(address(this))));

        uint256 value = address(this).balance;
        (bool sent, ) = owner.call{value: value}("");
        require(sent);

        emit Finalize(tokensSold, value);
    }
}
