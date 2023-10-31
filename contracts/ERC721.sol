// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTS is ERC721 {
    constructor() ERC721("Collection", "Nft") {}

    uint256 public tokenIdCounter;

    function mint(address caller) external {
        tokenIdCounter += 1;
        _safeMint(caller, tokenIdCounter);
    }
}
