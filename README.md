# BlockchainExpert - NFT Auction

This project provides a ERC721 smart contract that allows you to mint unique NFTs. It also provides an auction contract that allows users to auction of their NFTs.

## Getting Started

To deploy the smart contract follow the steps below.

1. Install [Node.js](https://nodejs.org/en/download/)
2. Clone the repository: `git clone https://github.com/algoexpert-io/NFT-Auction.git`
3. `cd NFT-Auction/minty`
4. `npm link`
5. `npm install`
6. Install [IPFS Command Line](https://docs.ipfs.tech/install/command-line/#official-distributions)
7. `ipfs daemon`
8. In a new terimal window `npx hardhat node`
9. Run `minty deploy`

## Minting Tokens

Once the smart contract is deployed and IPFS is running you can mint new NFTs by running the following command.

- `minty mint ./asset-path --name "Name" --description "description"`

## Using the Frontend

1. Install the [Liveserver Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VSCode.
2. Open [base.html](frontend/base.html)
3. Click the button that says "Go Live" in the bottom right hand corner of your VSCode.
4. Import any accounts you need into MetaMask and change your MetaMask network to "Hardhat".
5. Interact with the contract!
