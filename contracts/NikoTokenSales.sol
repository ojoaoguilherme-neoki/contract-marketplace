// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NikoTokenSales is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    AggregatorV3Interface internal immutable maticPriceFeed;
    AggregatorV3Interface internal immutable bnbPriceFeed;

    IERC20 public NKO;
    uint256 public nkoPrice = 1e17;

    constructor(
        address _maticPriceFeed,
        address _bnbPriceFeed,
        address _nkoAddress
    ) {
        require(
            _maticPriceFeed != address(0),
            "Matic Price Feed cannot be zero address"
        );
        require(
            _bnbPriceFeed != address(0),
            "BNB Price Feed cannot be zero address"
        );
        require(
            _nkoAddress != address(0),
            "NKO Token address cannot be zero address"
        );
        maticPriceFeed = AggregatorV3Interface(_maticPriceFeed);
        bnbPriceFeed = AggregatorV3Interface(_bnbPriceFeed);
        NKO = IERC20(_nkoAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlySell(uint256 amount) {
        require(amount > 0, "Cannot buy amount of 0 NKOs");
        require(
            NKO.balanceOf(address(this)) >= amount,
            "Private Sell: Not enough NKO to sell"
        );
        _;
    }

    // Update NKO Price
    function updateNikoPrice(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount > 0, "Private Sell: Cannot set NKO price equal to zero");
        nkoPrice = amount;
    }

    // Withdraw MATIC balance of contract
    function withdrawBalance(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(
            address(this).balance >= amount,
            "Private Sell: Insuffient MATIC balance for amount requested"
        );

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Private Sell: Failed to send MATIC");
    }

    // Withdraw Token amount of tokenAddress from the contract
    function withdrawTokens(
        uint256 amount,
        address tokenAddress
    ) external onlyRole(ADMIN_ROLE) {
        IERC20 token = IERC20(tokenAddress);
        require(
            token.balanceOf(address(this)) >= amount,
            "Private Sell: Insuffient contract balance of token requested"
        );
        token.safeTransfer(msg.sender, amount);
    }

    function getValueNeededToBuyWithMatic(
        uint256 interestedAmount
    ) external view returns (uint256) {
        uint256 maticPrice = getMaticLatestPrice();
        uint256 cost = (interestedAmount * nkoPrice) / maticPrice;
        return cost;
    }

    function buyNikoWithMatic(
        uint256 buyAmount
    ) external payable onlySell(buyAmount) nonReentrant returns (bool) {
        uint256 sentMatic = msg.value;
        uint256 maticPrice = getMaticLatestPrice();
        uint256 cost = (buyAmount * nkoPrice) / maticPrice;
        require(cost > 0, "Private Sell: Cost cannot be zero");

        require(
            sentMatic >= cost,
            "Private Sell: Sent insufficient MATIC to buy amount of NKO token"
        );
        (bool bought, ) = address(this).call{value: cost}("");
        require(bought, "Private Sell: Failed to send MATIC");

        NKO.safeTransfer(msg.sender, buyAmount);

        uint256 sendBack = sentMatic - cost;
        if (sendBack > 0) {
            (bool sentBack, ) = msg.sender.call{value: sendBack}("");
            require(
                sentBack,
                "Private Sell: Failed to send back excessive sent MATIC to buy token"
            );
        }
        return bought;
    }

    function buyNikoWithBNB(
        uint256 buyAmount
    ) external payable onlySell(buyAmount) nonReentrant {
        uint256 bnbPrice = getBNBLatestPrice();
        uint256 cost = (buyAmount * nkoPrice) / bnbPrice;
        require(cost > 0, "Cost cannot be zero");
        IERC20(0x3BA4c387f786bFEE076A58914F5Bd38d668B42c3).safeTransferFrom(
            msg.sender,
            address(this),
            cost
        );
        NKO.safeTransfer(msg.sender, buyAmount);
    }

    function getValueNeededToBuyWithBNB(
        uint256 interestedAmount
    ) external view returns (uint256) {
        uint256 bnbPrice = getBNBLatestPrice();
        uint256 cost = (interestedAmount * nkoPrice) / bnbPrice;
        return cost;
    }

    function buyNikoWithDAI(
        uint256 buyAmount
    ) external payable onlySell(buyAmount) nonReentrant {
        uint256 cost = (buyAmount * nkoPrice) / 1e18;
        require(cost > 0, "Private Sell: Cost cannot be zero");

        IERC20(0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063).safeTransferFrom(
            msg.sender,
            address(this),
            cost
        );
        NKO.safeTransfer(msg.sender, buyAmount);
    }

    function buyNikoWithBUSD(
        uint256 buyAmount
    ) external payable onlySell(buyAmount) nonReentrant {
        uint256 cost = (buyAmount * nkoPrice) / 1e18;
        require(cost > 0, "Private Sell: Cost cannot be zero");
        IERC20(0x9C9e5fD8bbc25984B178FdCE6117Defa39d2db39).safeTransferFrom(
            msg.sender,
            address(this),
            cost
        );
        NKO.safeTransfer(msg.sender, buyAmount);
    }

    function getMaticLatestPrice() public view returns (uint256) {
        (, int256 price, , , ) = maticPriceFeed.latestRoundData();
        uint256 maticBased = uint256(price) * 1e10;
        return maticBased;
    }

    function getBNBLatestPrice() public view returns (uint256) {
        (, int256 price, , , ) = bnbPriceFeed.latestRoundData();
        uint256 bnbBased = uint256(price) * 1e10;
        return bnbBased;
    }

    receive() external payable {}

    fallback() external payable {}
}
