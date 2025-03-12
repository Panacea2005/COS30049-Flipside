// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    // Structure to store listing details
    struct Listing {
        address seller;   // Address of the seller
        uint256 price;    // Price in wei
        bool active;      // Whether the listing is active
    }

    // Mapping to track listings: NFT contract address -> token ID -> listing details
    mapping(address => mapping(uint256 => Listing)) public listings;

    // Events to log actions for frontend tracking
    event ItemListed(address indexed nftAddress, uint256 indexed tokenId, address seller, uint256 price);
    event ItemSold(address indexed nftAddress, uint256 indexed tokenId, address buyer, uint256 price);
    event ListingCancelled(address indexed nftAddress, uint256 indexed tokenId);

    // List an NFT for sale
    function listItem(address nftAddress, uint256 tokenId, uint256 price) external {
        IERC721 nft = IERC721(nftAddress);
        
        // Ensure the caller owns the NFT
        require(nft.ownerOf(tokenId) == msg.sender, "You are not the owner of this NFT");
        
        // Ensure the marketplace is approved to transfer the NFT
        require(
            nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace is not approved to transfer this NFT"
        );
        
        // Ensure the price is valid
        require(price > 0, "Price must be greater than zero");

        // Create the listing
        listings[nftAddress][tokenId] = Listing(msg.sender, price, true);
        
        // Emit event for frontend
        emit ItemListed(nftAddress, tokenId, msg.sender, price);
    }

    // Buy a listed NFT
    function buyItem(address nftAddress, uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[nftAddress][tokenId];
        
        // Ensure the NFT is listed
        require(listing.active, "This NFT is not listed for sale");
        
        // Ensure enough Ether is sent
        require(msg.value >= listing.price, "Insufficient payment");

        // Transfer the NFT to the buyer
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Transfer payment to the seller
        (bool success, ) = listing.seller.call{value: listing.price}("");
        require(success, "Failed to send payment to seller");

        // Refund any excess payment to the buyer
        if (msg.value > listing.price) {
            (success, ) = msg.sender.call{value: msg.value - listing.price}("");
            require(success, "Failed to refund excess payment");
        }

        // Remove the listing
        delete listings[nftAddress][tokenId];
        
        // Emit event for frontend
        emit ItemSold(nftAddress, tokenId, msg.sender, listing.price);
    }

    // Cancel an existing listing
    function cancelListing(address nftAddress, uint256 tokenId) external {
        Listing memory listing = listings[nftAddress][tokenId];
        
        // Ensure the NFT is listed
        require(listing.active, "This NFT is not listed for sale");
        
        // Ensure only the seller can cancel
        require(listing.seller == msg.sender, "Only the seller can cancel this listing");

        // Remove the listing
        delete listings[nftAddress][tokenId];
        
        // Emit event for frontend
        emit ListingCancelled(nftAddress, tokenId);
    }

    // Retrieve listing details
    function getListing(address nftAddress, uint256 tokenId) 
        external 
        view 
        returns (address seller, uint256 price, bool active) 
    {
        Listing memory listing = listings[nftAddress][tokenId];
        return (listing.seller, listing.price, listing.active);
    }
}