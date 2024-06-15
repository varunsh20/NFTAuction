// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Importing all required libraries and contracts.
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract NFTAuction is ERC1155URIStorage, ERC1155Holder {
    // Defining the contract owner
    address payable owner;

    // The underlying asset for payment of nfts.
    ERC20 public immutable asset;
    // Using Counters library for keeping a count on TokenId.
    using Counters for Counters.Counter;
    Counters.Counter private tokenId;

    // Declaring an event which is emitted when a new token is created.
    event NftCreated(
        uint256 indexed tokenId,
        address owner,
        uint256 supply,
        uint256 supplyLeft,
        uint256 price
    );

    // Declaring an event which is emitted when an auction is created.
    event AuctionCreated(uint256 indexed tokenId, uint256 startingPrice, uint256 duration);

    // Declaring an event which is emitted when a bid is placed.
    event BidPlaced(uint256 indexed tokenId, address bidder, uint256 bid);

    // Declaring an event which is emitted when an auction ends.
    event AuctionEnded(uint256 indexed tokenId, address winner, uint256 winningBid);

    // Defining the structure of the token.
    struct nft {
        uint256 tokenId;
        address owner;
        uint256 totalSupply;
        uint256 supplyLeft;
        uint256 price;
    }

    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 startingPrice;
        address highestBidder;
        uint256 highestBid;
        uint256 endTime;
        bool active;
    }

    // Mapping having key as tokenId and value as the token details of that Id.
    mapping(uint256 => nft) public idToNft;

    // Mapping having key as tokenId and value as the auction details of that Id.
    mapping(uint256 => Auction) public auctions;

    constructor(ERC20 _asset) ERC1155("") {
        owner = payable(msg.sender);
        asset = _asset;
    }

    // Required function to override to specify which interfaces this contract supports.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155,ERC1155Holder)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Function to create a new token.
    function createToken(string memory _tokenUri,uint256 _supply,uint256 _price) public payable {
        require(_price > 0, "Invalid price.");
        tokenId.increment();
        uint256 currentId = tokenId.current();
        _mint(msg.sender, currentId, _supply, "");
        _setURI(currentId, _tokenUri);
        idToNft[currentId] = nft(
            currentId,
            payable(msg.sender),
            _supply,
            _supply,
            _price
        );

        // This function transfers the tokens from address "from" to address "to".
        //_safeTransferFrom(msg.sender, address(this), currentId, _supply, "");

        // Emits the event.
        emit NftCreated(currentId, msg.sender, _supply, _supply, _price);
    }

    function getNftById(uint256 _tokenId) external view returns(nft memory){
        return idToNft[_tokenId];
    }

    // Function to create an auction.
    function createAuction(uint256 _tokenId, uint256 _startingPrice, uint256 _duration) public {
        require(balanceOf(msg.sender, _tokenId) > 0, "Insufficient supply");
        require(!auctions[_tokenId].active, "Auction in progress");
        auctions[_tokenId] = Auction(msg.sender,_tokenId,_startingPrice,address(0),0,block.timestamp + _duration,true);

        emit AuctionCreated(_tokenId, _startingPrice, _duration);
    }

    // Function to place a bid on an auction.
    function placeBid(uint256 _tokenId, uint256 value) public payable {
        Auction memory auction = auctions[_tokenId];
        require(auction.active, "Not active");
        require(block.timestamp < auction.endTime, "Auction Ended");
        require(value > auction.startingPrice, "Invalid Bid");
        require(value > auction.highestBid, "Invalid Bid");

        auction.highestBidder = msg.sender;
        auction.highestBid = value;

        emit BidPlaced(_tokenId, msg.sender, value);
    }

    // Function to end an auction.
    function endAuction(uint256 _tokenId) public {
        Auction memory auction = auctions[_tokenId];
        require(auction.active, "Auction is not active");
        require(block.timestamp >= auction.endTime, "Auction active");
        require(msg.sender == auction.seller, "Only owner operation");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            idToNft[_tokenId].owner = auction.highestBidder;
            idToNft[_tokenId].supplyLeft--;
            asset.transferFrom(auction.highestBidder,auction.seller,auction.highestBid);
            _safeTransferFrom(auction.seller, auction.highestBidder, _tokenId, 1, "");
            payable(auction.seller).transfer(auction.highestBid);

        }

        emit AuctionEnded(_tokenId, auction.highestBidder, auction.highestBid);
    }

    function getAuctionDetails(uint256 _tokenId) external view returns(Auction memory){
        return auctions[_tokenId];
    }

    function getActiveAuctions() external view returns (Auction[] memory) {
        uint256 itemCount = tokenId.current();
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= itemCount; i++) {
            if (auctions[i].active) {
                activeCount += 1;
            }
        }
        Auction[] memory activeAuctions = new Auction[](activeCount);
        uint256 currentIndex = 0;
        for (uint256 i = 1; i <= itemCount; i++) {
            if (auctions[i].active) {
                activeAuctions[currentIndex] = auctions[i];
                currentIndex += 1;
            }
        }
        return activeAuctions;
    }

    // Function to return tokens owned by an address.
    function myNfts(address _address) external view returns (nft[] memory) {
        uint256 counter;
        uint256 length;

        for (uint256 i = 1; i <= tokenId.current(); i++) {
            if (idToNft[i].owner == _address) {
                length++;
            }
        }
        nft[] memory myDeals = new nft[](length);
        for (uint256 i = 1; i <= tokenId.current(); i++) {
            if (idToNft[i].owner == _address) {
                myDeals[counter] = idToNft[i];
                counter++;
            }
        }
        return myDeals;
    }
}
