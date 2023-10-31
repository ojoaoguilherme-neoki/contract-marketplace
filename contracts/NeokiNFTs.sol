// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NeokiNFTs is ERC1155, ERC2981, Ownable {
    using Counters for Counters.Counter;
    mapping(uint256 => string) private _uris;
    Counters.Counter public _tokenIdCounter;

    struct NeokiApps {
        address contract_address;
        uint256 index;
    }
    mapping(uint256 => address) public allowedNeokiApps;
    Counters.Counter public _neokiApps;

    constructor() ERC1155("") {}

    /**
     * @dev mints a new `tokenId` with royalty information
     * @param account is the address that will be recieving `tokenId`
     * @param amount supply generated of `tokenId`
     * @param tokenURI is the URL that points to `tokenId` token metadata
     * @param data is an hex value that can be sent "0x" if there ir no value to send
     * @param royalty is the `%` fee royalty se `_setTokenRoyalty` from { ERC2981 }
     */

    function mint(
        address account,
        uint256 amount,
        string memory tokenURI,
        uint96 royalty,
        bytes memory data
    ) public returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _mint(account, tokenId, amount, data);
        setTokenUri(tokenId, tokenURI);
        _setTokenRoyalty(tokenId, account, royalty);
        return _tokenIdCounter.current();
    }

    /**
     * @dev returns the URI of a given token
     * @param tokenId the token id of the desired URI search
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return (_uris[tokenId]);
    }

    /**
     * @dev sets the token URI to the metadata file
     * @param tokenId the token id, cannot be set more than once
     * @param tokenURI the string URL
     */
    function setTokenUri(uint256 tokenId, string memory tokenURI) internal {
        require(
            bytes(_uris[tokenId]).length == 0,
            "Can not set the URI twice."
        );
        _uris[tokenId] = tokenURI;
    }

    function addNeokiApp(address _address) external onlyOwner {
        allowedNeokiApps[_neokiApps.current()] = _address;
        _neokiApps.increment();
    }

    function getAllowedApps() external view returns (NeokiApps[] memory) {
        NeokiApps[] memory allowedApps = new NeokiApps[](_neokiApps.current());

        for (uint256 i = 0; i < _neokiApps.current(); i++) {
            address app = allowedNeokiApps[i];
            NeokiApps memory current = NeokiApps({
                contract_address: app,
                index: i
            });
            allowedApps[i] = current;
        }
        return allowedApps;
    }

    function getAuthorizedApp(address _operator) internal view returns (bool) {
        bool approved = false;
        for (uint256 i = 0; i < _neokiApps.current(); i++) {
            if (_operator == allowedNeokiApps[i]) {
                approved = true;
            }
        }
        return approved;
    }

    /**
     * Override isApprovedForAll to auto-approve OS's proxy contract
     */
    function isApprovedForAll(
        address _owner,
        address _operator
    ) public view override returns (bool isOperator) {
        // returns true for all allowed Neoki Application to reduce one allowance transaction
        bool approved = getAuthorizedApp(_operator);
        if (approved) {
            return approved;
        }
        // otherwise, use the default ERC1155.isApprovedForAll()
        return ERC1155.isApprovedForAll(_owner, _operator);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, ERC2981) returns (bool) {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
