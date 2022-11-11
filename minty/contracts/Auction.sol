pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Auction {
    struct Listing {
        IERC721 nft;
        uint256 nftId;
        uint256 minPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        address owner;
    }

    uint256 nextListingId;
    mapping(uint256 => Listing) listings;
    mapping(address => uint256) balances;

    event List(
        address indexed lister,
        address indexed nft,
        uint256 indexed nftId,
        uint256 listingId,
        uint256 minPrice,
        uint256 endTime,
        uint256 timestamp
    );
    event Bid(
        address indexed bidder,
        uint256 indexed listingId,
        uint256 amount,
        uint256 timestamp
    );

    modifier listingExists(uint256 listingId) {
        require(
            listings[listingId].owner != address(0),
            "listing does not exist"
        );
        _;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) public returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function list(
        address nft,
        uint256 nftId,
        uint256 minPrice,
        uint256 numHours
    ) external {
        IERC721 nftContract = IERC721(nft);
        require(
            nftContract.ownerOf(nftId) == msg.sender,
            "you do not own this nft"
        );
        require(
            nftContract.getApproved(nftId) == address(this),
            "this contract is not approved to access this nft"
        );

        nftContract.safeTransferFrom(msg.sender, address(this), nftId);

        Listing storage listing = listings[nextListingId];
        listing.nft = nftContract;
        listing.nftId = nftId;
        listing.minPrice = minPrice;
        listing.endTime = block.timestamp + (numHours * 1 hours);
        listing.owner = msg.sender;
        listing.highestBidder = msg.sender;

        emit List(
            msg.sender,
            nft,
            nftId,
            nextListingId,
            minPrice,
            listing.endTime,
            block.timestamp
        );

        nextListingId++;
    }

    function bid(uint256 listingId) external payable listingExists(listingId) {
        Listing storage listing = listings[listingId];
        require(
            msg.value >= listing.minPrice,
            "you must bid at least the min price"
        );
        require(
            msg.value > listing.highestBid,
            "you must bid higher than the current highest bid"
        );
        require(block.timestamp < listing.endTime, "auction is over");

        balances[listing.highestBidder] += listing.highestBid;
        listing.highestBid = msg.value;
        listing.highestBidder = msg.sender;

        emit Bid(msg.sender, listingId, msg.value, block.timestamp);
    }

    function end(uint256 listingId) external listingExists(listingId) {
        Listing storage listing = listings[listingId];
        require(block.timestamp > listing.endTime, "auction is not over");

        balances[listing.owner] += listing.highestBid;
        listing.nft.safeTransferFrom(
            address(this),
            listing.highestBidder,
            listing.nftId
        );
        delete listings[listingId];
    }

    function withdrawFunds() external {
        uint256 balance = balances[msg.sender];
        balances[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: balance}("");
        require(sent);
    }

    function getListing(uint256 listingId)
        public
        view
        listingExists(listingId)
        returns (
            address,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            address(listings[listingId].nft),
            listings[listingId].nftId,
            listings[listingId].highestBid,
            listings[listingId].minPrice,
            listings[listingId].endTime
        );
    }
}
