// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC2981.sol";

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NeokiMarketplaceWithRoyalty is
    ERC1155Holder,
    ReentrancyGuard,
    AccessControl
{
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
    bytes4 private constant _INTERFACE_ID_ERC1155Receiver = 0x4e2312e0;
    bytes32 public constant MARKETPLACE_ADMIN_ROLE =
        keccak256("MARKETPLACE_ADMIN_ROLE_ROLE");
    bytes32 public constant CHANGE_FEE_ROLE = keccak256("CHANGE_FEE_ROLE");

    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    Counters.Counter public nftSold; // show on the UI
    Counters.Counter public totalSoledItems;
    Counters.Counter private _totalItems;
    Counters.Counter private _unavailableItems;

    address public foundation;
    address public stakingPool;
    uint16 public listingFee = 400;
    IERC20 public nko;

    struct MarketItem {
        uint256 itemId;
        uint256 tokenId;
        uint256 amount;
        uint256 price;
        address owner;
        address nftContract;
    }

    mapping(uint256 => MarketItem) marketItem;

    constructor(
        address _foundation,
        address _stakingPool,
        address _nko,
        address _admin
    ) {
        foundation = _foundation;
        stakingPool = _stakingPool;
        nko = IERC20(_nko);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MARKETPLACE_ADMIN_ROLE, _admin);
    }

    event NewListing(
        uint256 itemId,
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        address owner,
        address nftContract
    );

    event NewBoughtItem(
        uint256 itemId,
        uint256 tokenId,
        uint256 price,
        uint256 amount,
        address seller,
        address nftContract,
        address buyer,
        uint256 buyingAmount,
        uint256 payed
    );
    event DeleteItem(uint256 tokenId);
    event UpdateItemPrice(uint256 itemId, uint256 newPrice);
    event UpdateItemAddAmount(uint256 itemId, uint256 addingAmount);
    event UpdateItemRemoveAmount(uint256 itemId, uint256 addingAmount);
    event UpdateMarketplaceFee(address indexed sender, uint16 amount);

    /**
     * @dev List ERC721/ERC1155 tokens to the marketplace
     * @param _nft `_tokenId` contract address
     * @param _tokenId the token ID that will be listed
     * @param _amount the amount of `_tokenId` tokens that will be listed
     * @param _price the of a unit of `_tokenId` token that will be soled
     * @param data an hex data to send if needed if not send a value of "0x"
     */
    function listItem(
        address _nft,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _price,
        bytes calldata data
    ) external nonReentrant {
        IERC1155(_nft).safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId,
            _amount,
            data
        );
        _totalItems.increment();
        uint256 i = _totalItems.current();
        marketItem[i] = MarketItem({
            itemId: i,
            tokenId: _tokenId,
            amount: _amount,
            price: _price,
            owner: msg.sender,
            nftContract: _nft
        });

        emit NewListing(i, _tokenId, _amount, _price, msg.sender, _nft);
    }

    /**
     * @dev Buy a listed item on the marketplace. It's possible to buy a `_amount`
     * of the collection of `_itemId`
     * @param _itemId the unique identifier of the item listed on the marketplace
     * @param _amount amount of the `_tokenId` listed on the marketplace
     */
    function buyItem(uint256 _itemId, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot buy amount of 0.");
        MarketItem storage item = marketItem[_itemId];

        // Fees
        uint256 paying = item.price * _amount;
        uint256 feeAmount = (paying * listingFee) / 10000;

        // Royalties
        address receiver;
        uint256 royaltyAmount;

        bool hasRoyalties = checkRoyalties(item.nftContract);
        if (hasRoyalties) {
            (receiver, royaltyAmount) = IERC2981(item.nftContract).royaltyInfo(
                item.tokenId,
                paying
            );
        }
        nko.safeTransferFrom(msg.sender, address(this), paying);
        nko.safeTransfer(foundation, feeAmount / 2);
        nko.safeTransfer(stakingPool, feeAmount / 2);

        if (receiver != address(0) && royaltyAmount > 0) {
            nko.safeTransfer(receiver, royaltyAmount);
        }
        nko.safeTransfer(item.owner, paying - (feeAmount + royaltyAmount));
        IERC1155 asset = IERC1155(item.nftContract);
        asset.safeTransferFrom(
            address(this),
            msg.sender,
            item.tokenId,
            _amount,
            ""
        );
        item.amount -= _amount;

        for (uint i = 0; i < _amount; i++) {
            nftSold.increment();
        }
        if (item.amount == 0) {
            totalSoledItems.increment();
            _unavailableItems.increment();
            delete marketItem[_itemId];
            emit DeleteItem(_itemId);
        }

        emit NewBoughtItem(
            item.itemId,
            item.tokenId,
            item.price,
            item.amount,
            item.owner,
            item.nftContract,
            msg.sender,
            _amount,
            paying
        );
    }

    /**
     * @dev Gets all the marketplace items listed
     */
    function getAllItems() public view returns (MarketItem[] memory) {
        uint256 totalItems = _totalItems.current();
        uint256 unavailableItems = _unavailableItems.current();
        uint256 unsoldItemCount = totalItems - unavailableItems;

        uint256 itemIndex;
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);

        for (uint256 i = 0; i < totalItems; i++) {
            MarketItem storage item = marketItem[i + 1];
            if (item.amount > 0) {
                items[itemIndex] = item;
                itemIndex++;
            }
        }
        return items;
    }

    /**
     * @dev gets all the user's listed items in the marketplace that has an
     * amount greater than zero
     */
    function getAllUserListings(
        address owner
    ) public view returns (MarketItem[] memory) {
        uint256 totalItems = _totalItems.current();
        uint256 unavailableItems = _unavailableItems.current();
        uint256 itemCount = totalItems - unavailableItems;
        MarketItem[] memory items = new MarketItem[](itemCount);
        uint256 itemIndex;
        for (uint256 i = 0; i < totalItems; i++) {
            MarketItem storage item = marketItem[i + 1];
            if (item.owner == owner && item.amount > 0) {
                items[itemIndex] = item;
                itemIndex++;
            }
        }
        return items;
    }

    /**
     * @dev Updates the price of a unit listed of the`_itemId`
     * @param _itemId the unique identifier of the item listed on the marketplace
     * @param _newPrice the new price of the unit amount of
     */
    function updateMyListingItemPrice(
        uint256 _itemId,
        uint256 _newPrice
    ) public {
        MarketItem storage item = marketItem[_itemId];
        require(item.owner == msg.sender, "Not the owner of the listed item");
        item.price = _newPrice;
        emit UpdateItemPrice(_itemId, _newPrice);
    }

    /**
     * @dev Updates the listed item by adding `_addingAmount` of `_tokenId` to `_itemId`
     * @param _itemId unique identifier of the item listed on the marketplace
     * @param _addingAmount amount of `tokenId` of the listed `_itemId`
     */
    function addMyListingItemAmount(
        uint256 _itemId,
        uint256 _addingAmount
    ) public nonReentrant {
        MarketItem storage item = marketItem[_itemId];
        require(item.owner == msg.sender, "Not the owner of the listed item");
        IERC1155 asset = IERC1155(item.nftContract);
        asset.safeTransferFrom(
            msg.sender,
            address(this),
            item.tokenId,
            _addingAmount,
            ""
        );
        item.amount += _addingAmount;
        emit UpdateItemAddAmount(_itemId, _addingAmount);
    }

    /**
     * @dev removes amount of `_itemId` tokenId
     * @param _itemId unique identifier of listed item
     * @param _removeAmount amount of `_tokenId`
     */
    function removeMyListingItemAmount(
        uint256 _itemId,
        uint256 _removeAmount
    ) public nonReentrant {
        MarketItem storage item = marketItem[_itemId];
        require(item.amount > 0, "There is no NFT to withdraw");
        require(item.owner == msg.sender, "Not the owner of the listed item");
        IERC1155 asset = IERC1155(item.nftContract);
        item.amount -= _removeAmount;

        asset.safeTransferFrom(
            address(this),
            msg.sender,
            item.tokenId,
            _removeAmount,
            ""
        );
        if (item.amount == 0) {
            _unavailableItems.increment();
            delete marketItem[_itemId];
        }
        emit UpdateItemRemoveAmount(_itemId, _removeAmount);
    }

    function checkRoyalties(address _contract) internal view returns (bool) {
        bool success = IERC165(_contract).supportsInterface(
            _INTERFACE_ID_ERC2981
        );
        return success;
    }

    /**
     * @dev Changes marketplace fee `listingFee`
     * @param amount value of desired fee
     * example: 400 / 10000 = 0.04 == 4%
     */
    function updateListingFee(uint16 amount) public {
        require(
            hasRole(CHANGE_FEE_ROLE, msg.sender),
            "Caller does not have CHANGE_FEE role"
        );
        listingFee = amount;
        emit UpdateMarketplaceFee(msg.sender, amount);
    }

    /**
     * @dev Changes the `stakinPool` address
     */

    function updateStakingPool(address newAddress) public {
        require(
            hasRole(MARKETPLACE_ADMIN_ROLE, msg.sender),
            "Caller does not have MARKETPLACE_ADMIN_ROLE role"
        );
        stakingPool = newAddress;
    }

    /**
     * @dev Changes `foundation` address
     */
    function updateFoundation(address newAddress) public {
        require(
            hasRole(MARKETPLACE_ADMIN_ROLE, msg.sender),
            "Caller does not have MARKETPLACE_ADMIN_ROLE role"
        );
        foundation = newAddress;
    }

    /**
     * @dev Changes `nko` address
     */
    function updateTokenAddress(address newAddress) public {
        require(
            hasRole(MARKETPLACE_ADMIN_ROLE, msg.sender),
            "Caller does not have MARKETPLACE_ADMIN_ROLE role"
        );
        nko = IERC20(newAddress);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(AccessControl, ERC1155Receiver)
        returns (bool)
    {
        return
            interfaceId == type(ERC1155Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
