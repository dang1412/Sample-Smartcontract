// contracts/LandToken721.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LandToken721 is Ownable, ERC721Enumerable {
  uint256 public mintPrice = 1000000000000000000;  // 1AVAX
  string private _baseUri;

  constructor() ERC721("LandToken721", "LTK") {}

  function _baseURI() internal view override returns (string memory) {
    return _baseUri;
  }

  function setBaseURI(string calldata baseURI) external onlyOwner {
    _baseUri = baseURI;
  }

  function setPrice(uint256 price) external onlyOwner {
    mintPrice = price;
  }

  function mint() external payable {
    uint256 id = ERC721Enumerable.totalSupply() + 1;
    require(id <= 1000, "Max supply reached");
    require(msg.value >= mintPrice, "Not pay enough money");

    _mint(msg.sender, id);
  }

  function withdraw() external onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
  }
}
