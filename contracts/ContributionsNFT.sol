// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { IEAS, AttestationRequest, AttestationRequestData, RevocationRequest, RevocationRequestData } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { ISchemaRegistry, SchemaRecord, ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/ISchemaRegistry.sol";
import { NO_EXPIRATION_TIME, EMPTY_UID } from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ContributorsNFTOperator {
    mapping(address account => bool isWhtelisted) public whitelistedAccounts;
    ContributionsNFT contributorsNFT;

    constructor(ContributionsNFT _contributorsNFT) {
        contributorsNFT = _contributorsNFT;
        whitelistedAccounts[msg.sender] = true;
    }

    modifier onlyWhitelisted() {
        require(isWhtelisted(msg.sender), "Caller is not whitelisted");
        _;
    }

    // View functions
    function isWhtelisted(address account) public view returns(bool) {
        return whitelistedAccounts[account];
    }

    // Operator

    function setOperator(address operator) public onlyWhitelisted {
        contributorsNFT.setOperator(operator);
    }

    function mint(address to) public onlyWhitelisted {
        contributorsNFT.mint(to);
    }

    function burn(uint nftId) public onlyWhitelisted {
        contributorsNFT.burn(nftId);
    }

    function setContribution(
        uint nftId,
        string memory contributionType,
        uint contributionAmount,
        uint timestamp,
        string memory description
        ) public onlyWhitelisted returns(bytes32)
    {
        return contributorsNFT.setContribution(msg.sender, nftId, contributionType, contributionAmount, timestamp, description);
    }

    function setEAS(address _eas) onlyWhitelisted public {
        contributorsNFT.setEAS(_eas);
    }

    function setSchemaRegistry(address _schemaRegistry) onlyWhitelisted public {
        contributorsNFT.setSchemaRegistry(_schemaRegistry);
    }

    function setSchemaID(bytes32 _schemaID) onlyWhitelisted public {
        contributorsNFT.setSchemaID(_schemaID);
    }

    function setContributionDecayTime(uint _contributionDecayTime) onlyWhitelisted public {
        contributorsNFT.setContributionDecayTime(_contributionDecayTime);
    }
}

contract ContributionsNFT is ERC721 {
    // Scroll
    //address public eas = 0x310359aBD92081b2a9F3ef347858708089B633d5;
    //address public schemaRegistry = 0xf3f4BDc8C7498208256a47bb1C5fB308CDe67c3E;
    // Sepolia
    address public eas = 0xC2679fBD37d54388Ce493F1DB75320D236e1815e;
    address public schemaRegistry = 0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0;
    bytes32 public schemaID;
    uint public contributionDecayTime = 1 minutes;
    uint public tokenCount;
    address public operator;

    string public baseTokenURI;

    mapping(uint nftId => mapping(string contributionType => uint timestamp)) public contributionTimestamps;
    mapping(uint nftId => mapping(string contributionType => uint amount)) public contributionAmounts;

    // Contructor
    constructor() ERC721("Contributions NFT", "CNFT") {
        operator = msg.sender;
        schemaID = ISchemaRegistry(schemaRegistry).register(
            "address from, uint nftID, uint timestamp, string contributionType, string description5",
            ISchemaResolver(address(0)),
            true);
    }

    // Modifiers
    modifier onlyOperator() {
        require(msg.sender == operator, "Caller is not operator");
        _;
    }

    // onlyWhitelisted functions
    function setOperator(address _operator) public onlyOperator {
        operator = _operator;
    }

    function setBaseURI(string memory baseURI) public onlyOperator {
        baseTokenURI = baseURI;
    }

    function mint(address to) public onlyOperator
    {
        tokenCount  += 1;
        _mint(to, tokenCount);
    }

    function burn(uint nftId) public onlyOperator
    {
        _burn(nftId);
    }

    function setContribution(
        address from,
        uint nftId,
        string memory contributionType,
        uint contributionAmount,
        uint timestamp,
        string memory description
        ) public onlyOperator returns(bytes32)
    {
        require(timestamp <= block.timestamp, "Can't timestamp in the future");
        contributionAmounts[nftId][contributionType] = getContribution(nftId, contributionType) + contributionAmount;
        contributionTimestamps[nftId][contributionType] = timestamp;

        bytes memory encodedData = abi.encode(from, nftId, timestamp, contributionType, description);
        return
            IEAS(eas).attest(
                AttestationRequest({
                    schema: schemaID,
                    data: AttestationRequestData({
                        recipient: ownerOf(nftId),
                        expirationTime: NO_EXPIRATION_TIME,
                        revocable: true,
                        refUID: EMPTY_UID,
                        data: encodedData,
                        value: 0
                    })
                })
            );
    }

    function revokeAttestation(bytes32 attestationID) external {
        IEAS(eas).revoke(RevocationRequest({ schema: schemaID, data: RevocationRequestData({ uid: attestationID, value: 0 }) }));
    }

    function setEAS(address _eas) onlyOperator public {
        eas = _eas;
    }

    function setSchemaRegistry(address _schemaRegistry) onlyOperator public {
        schemaRegistry = _schemaRegistry;
    }

    function setSchemaID(bytes32 _schemaID) onlyOperator public {
        schemaID = _schemaID;
    }

    function setContributionDecayTime(uint _contributionDecayTime) onlyOperator public {
        contributionDecayTime = _contributionDecayTime;
    }

    // View functions

    function getContribution(uint nftId, string memory contributionType) public view returns(uint)
    {
        uint lastContributionTimestamp = contributionTimestamps[nftId][contributionType];
        uint lastContributionAmount = contributionAmounts[nftId][contributionType];
        uint elapsedTimeSinceLastContribution = block.timestamp - lastContributionTimestamp;
        uint contributionDecay = elapsedTimeSinceLastContribution / contributionDecayTime;
        if(lastContributionAmount < contributionDecay)
        {
            return 0;
        }
        uint currentContribution = lastContributionAmount - contributionDecay;
        return currentContribution;
    }

    function getContributions(uint nftId, string[] memory contributionType) public view returns(uint[] memory)
    {
        uint[] memory resultArray = new uint[](contributionType.length); // TODO
        for(uint i=0; i<contributionType.length; i++)
        {
            resultArray[i] = getContribution(nftId, contributionType[i]);
        }
        return resultArray;
    }

    // Internal functions

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }
}