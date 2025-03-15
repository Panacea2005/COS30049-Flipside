// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => string) private _tokenURIs;

    event NFTMinted(uint256 indexed tokenId, address indexed to, string uri);
    event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemBought(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);

    constructor() ERC721("NFTMarketplace", "NFTM") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }

    function mintNFT(address to, string memory uri) external returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(uri).length > 0, "URI cannot be empty");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);

        emit NFTMinted(newTokenId, to, uri);
        return newTokenId;
    }

    function listItem(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than zero");
        require(ownerOf(tokenId) == msg.sender, "Only owner can list");

        address approved = getApproved(tokenId);
        if (approved != address(this)) {
            approve(address(this), tokenId); // Approve marketplace only if not already approved
        }

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        emit ItemListed(tokenId, msg.sender, price);
    }

    function buyItem(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Item not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(getApproved(tokenId) == address(this), "Marketplace not approved");

        listings[tokenId].active = false;

        (bool sent, ) = listing.seller.call{value: listing.price}("");
        require(sent, "Failed to send ETH to seller");

        _transfer(listing.seller, msg.sender, tokenId);

        if (msg.value > listing.price) {
            (bool refunded, ) = msg.sender.call{value: msg.value - listing.price}("");
            require(refunded, "Failed to refund excess ETH");
        }

        emit ItemBought(tokenId, msg.sender, listing.price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Item not listed");
        require(listing.seller == msg.sender, "Only seller can cancel");

        listings[tokenId].active = false;
        _approve(address(0), tokenId, address(0)); // Revoke approval

        emit ListingCancelled(tokenId, msg.sender);
    }

    function getListing(uint256 tokenId) external view returns (address seller, uint256 price, bool active) {
        Listing memory listing = listings[tokenId];
        return (listing.seller, listing.price, listing.active);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721: invalid token ID");
        return _tokenURIs[tokenId];
    }

    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        _tokenURIs[tokenId] = uri;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "Failed to withdraw ETH");
    }
}