// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NeokiNftRoyalty is ERC2981, ERC1155 {
    using Counters for Counters.Counter;
    mapping(uint256 => string) private _uris;
    Counters.Counter public _tokenIdCounter;

    constructor() ERC1155("") {}

    /**
     * @dev mints a new `tokenId` with royalty information
     * @param account is the address that will be recieving `tokenId`
     * @param amount supply generated of `tokenId`
     * @param tokenURI is the URL that points to `tokenId` token metadata
     * @param data is an hex value that can be sent "0x" if there ir no value to send
     */

    function mint(
        address account,
        uint256 amount,
        string memory tokenURI,
        bytes memory data
    ) public returns (uint256) {
        _tokenIdCounter.increment();
        uint tokenId = _tokenIdCounter.current();

        _mint(account, tokenId, amount, data);
        setTokenUri(tokenId, tokenURI);
        return tokenId;
    }

    /**
     * @dev mints a new `tokenId` with royalty information
     * @param account is the address that will be recieving `tokenId`
     * @param amount supply generated of `tokenId`
     * @param tokenURI is the URL that points to `tokenId` token metadata
     * @param data is an hex value that can be sent "0x" if there ir no value to send
     * @param royalty is the `%` fee royalty se `_setTokenRoyalty` from { ERC2981 }
     */

    function mintWithRoyalties(
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

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, ERC2981) returns (bool) {
        return
            interfaceId == type(IERC2981).interfaceId ||
            interfaceId == type(IERC1155).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
