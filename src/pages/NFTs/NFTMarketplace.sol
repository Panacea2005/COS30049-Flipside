// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

/**
 * @title NFTMarketplace
 * @dev A marketplace for selling and buying NFTs
 */
contract NFTMarketplace is ReentrancyGuard, Ownable, ERC721Holder {
    // Listing structure
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    // Platform fee percentage (2%)
    uint256 public feePercentage = 200; // 2% in basis points (1/100 of a percent)
    uint256 public constant BASIS_POINTS = 10000; // 100% in basis points

    // Mapping from NFT contract address => token ID => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;
    
    // Events for frontend updates
    event ItemListed(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    
    event ItemSold(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );
    
    event ListingCanceled(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed seller
    );
    
    event FeeUpdated(uint256 newFeePercentage);

    /**
     * @dev Constructor for the marketplace
     * @param _initialOwner Initial owner of the contract
     */
    constructor(address _initialOwner) Ownable(_initialOwner) {}

    /**
     * @dev Lists an NFT for sale on the marketplace
     * @param nftAddress Address of the NFT contract
     * @param tokenId ID of the NFT to be listed
     * @param price Sale price in wei
     */
    function listItem(address nftAddress, uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than zero");
        require(IERC721(nftAddress).ownerOf(tokenId) == msg.sender, "Not the NFT owner");
        
        // Check if marketplace is approved to transfer the NFT
        require(
            IERC721(nftAddress).getApproved(tokenId) == address(this) || 
            IERC721(nftAddress).isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved to transfer NFT"
        );
        
        // Create listing
        listings[nftAddress][tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });
        
        // Transfer NFT to this contract for escrow
        IERC721(nftAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        
        // Emit event
        emit ItemListed(nftAddress, tokenId, msg.sender, price);
    }
    
    /**
     * @dev Allows a user to purchase a listed NFT
     * @param nftAddress Address of the NFT contract
     * @param tokenId ID of the NFT to be purchased
     */
    function buyItem(address nftAddress, uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[nftAddress][tokenId];
        
        require(listing.active, "Item not listed for sale");
        require(msg.value >= listing.price, "Insufficient funds");
        
        // Mark as sold before transferring to prevent reentrancy
        listings[nftAddress][tokenId].active = false;
        
        // Calculate and transfer fee to contract owner
        uint256 fee = (listing.price * feePercentage) / BASIS_POINTS;
        uint256 sellerAmount = listing.price - fee;
        
        // Pay the seller
        (bool success, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(success, "Failed to send funds to seller");
        
        // Pay the marketplace owner
        (success, ) = payable(owner()).call{value: fee}("");
        require(success, "Failed to send fee to owner");
        
        // Transfer NFT to buyer
        IERC721(nftAddress).safeTransferFrom(address(this), msg.sender, tokenId);
        
        // Refund excess payment if needed
        if (msg.value > listing.price) {
            (success, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(success, "Failed to refund excess payment");
        }
        
        // Emit event
        emit ItemSold(nftAddress, tokenId, listing.seller, msg.sender, listing.price);
    }
    
    /**
     * @dev Allows the seller to cancel their listing
     * @param nftAddress Address of the NFT contract
     * @param tokenId ID of the NFT listing to cancel
     */
    function cancelListing(address nftAddress, uint256 tokenId) external {
        Listing memory listing = listings[nftAddress][tokenId];
        
        require(listing.active, "Not an active listing");
        require(listing.seller == msg.sender, "Not the seller");
        
        // Mark as inactive
        listings[nftAddress][tokenId].active = false;
        
        // Return NFT to seller
        IERC721(nftAddress).safeTransferFrom(address(this), msg.sender, tokenId);
        
        // Emit event
        emit ListingCanceled(nftAddress, tokenId, msg.sender);
    }

    /**
     * @dev Updates the marketplace fee percentage
     * @param _feePercentage New fee percentage in basis points (e.g., 200 = 2%)
     */
    function updateFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee cannot exceed 10%");
        feePercentage = _feePercentage;
        emit FeeUpdated(_feePercentage);
    }

    /**
     * @dev Returns a listing for a given NFT
     * @param nftAddress Address of the NFT contract
     * @param tokenId ID of the NFT
     * @return seller Address of the seller
     * @return price Listing price
     * @return active Whether the listing is active
     */
    function getListing(address nftAddress, uint256 tokenId) 
        external 
        view 
        returns (address seller, uint256 price, bool active) 
    {
        Listing memory listing = listings[nftAddress][tokenId];
        return (listing.seller, listing.price, listing.active);
    }
}