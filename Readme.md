Contribu is a community NFT project that recognizes and incentivizes online community contributors. It proposes an alternative social dynamic focused on sustainability and friendliness for newcomers.

## Features

| Feature | Supported |
|----------|------------ |
| Dynamic NFTs | ✅ |
| On-chain points oracle | ✅ |
| Built for L2s (L1 DA compression) | ✅ |
| Ethereum Attestation Service (EAS) | ✅ |
| Governance module | WIP |

## How it works

### PFP Collection

Community organizers can create their own Contribu Collection. Each collection is an ERC 721 compatible NFT contract launched in the chain of their choice. Each NFT represents the specific contributions of an individual within the community.

![Screenshot from 2024-05-01 19-53-02](https://github.com/Turupawn/Contribu/assets/707484/2638fe8d-86f2-4e9c-b4b2-507033050b19)

### Dynamic points

Contributions are segmented into types, with community organizers having the freedom to choose categories that reflect the values of their community. Individuals can accumulate points by contributing to the community, with these points being visible across all NFT marketplaces and visualizers.

![image](https://github.com/Turupawn/Contribu/assets/707484/5fb448ff-dc74-4dc3-9cd0-3ad228cc2bc5)

### Point decay system (Anti OG mechanics)

Contribu finds a balance between rewarding both OGs and newcomers by implementing an automatic decay function. This function gradually reduces points over time, favoring continuous contributions over large ones made in the distant past.

The dynamic point formula is calculated on-chain, enabling other contracts to connect with Contribu to query points. This feature opens the door to governance modules, airdrops, and special accesses.

**On-Chain decay formula:**
$$currentContribution=max\left( \text{lastContributionAmount} - \frac{\text{contributionDecayTime}}{\text{block.timestamp} - \text{lastContributionTimestamp}}, 0 \right)$$

### Attester Frontend

Only community organizers are able to:
* Mint NFTs to community members
* Attest a contribution
* Whitelist another community organizer

This can be done through the Contribu frontend.

## Project Structure

* `contracts/`: ERC721 Contribu contract.
* `frontend/`: Frotend for community organizers/admins.
* `metadata_api/`: Dynamic API that is capable to change the NFT metadata based on on-chain attestations.
