// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NeokiNFTs is ERC1155, ERC1155Burnable {
    using Counters for Counters.Counter;
    mapping(uint256 => string) private _uris;
    Counters.Counter public _tokenIdCounter;

    constructor() ERC1155("") {}

    /**
     * @dev mints a new token id, tokens that were already minted will fail
     * @param account is the address that will be recieving the new generated token ID
     * @param amount supply generated of `id` token
     * @param tokenURI is the URL that points to `id` token metadata
     * @param data it an hex value that can be sent "0x" if there ir no value to send
     */
    function mint(
        address account,
        uint256 amount,
        string memory tokenURI,
        bytes memory data
    ) public returns (uint256 tokenId) {
        _tokenIdCounter.increment();
        _mint(account, _tokenIdCounter.current(), amount, data);
        setTokenUri(_tokenIdCounter.current(), tokenURI);
        tokenId = _tokenIdCounter.current();
        return tokenId;
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
}
