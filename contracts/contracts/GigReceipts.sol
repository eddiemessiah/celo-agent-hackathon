// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title GigReceipts — tamper-proof public work history for the Oga agent
/// @notice After a gig is paid (x402) and delivered (public reply), the agent
/// (owner) attests the pairing of task, deliverable and payer. This is the
/// agent's onchain CV: anyone can verify what Oga did, for whom, and when —
/// the ERC-8004 agent-identity story made concrete.
contract GigReceipts is Ownable {
    struct Gig {
        bytes32 taskHash; // keccak256 of the request text
        bytes32 deliverableHash; // keccak256 of the delivered content
        address payer;
        uint64 timestamp;
    }

    Gig[] public gigs;

    event GigAttested(
        uint256 indexed gigId,
        bytes32 indexed taskHash,
        bytes32 deliverableHash,
        address indexed payer
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    function attest(
        bytes32 taskHash,
        bytes32 deliverableHash,
        address payer
    ) external onlyOwner returns (uint256 gigId) {
        gigId = gigs.length;
        gigs.push(
            Gig({
                taskHash: taskHash,
                deliverableHash: deliverableHash,
                payer: payer,
                timestamp: uint64(block.timestamp)
            })
        );
        emit GigAttested(gigId, taskHash, deliverableHash, payer);
    }

    function gigCount() external view returns (uint256) {
        return gigs.length;
    }
}
