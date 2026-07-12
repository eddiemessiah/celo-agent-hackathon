// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ScholarBoard — onchain campus leaderboard for Padi
/// @notice The Padi server (owner) batches question counts per wallet per
/// campus after x402 settlement. Purpose: a verifiable public usage trail
/// plus inter-campus competition. Events are the source of truth for
/// indexers; storage keeps only running totals for cheap onchain reads.
contract ScholarBoard is Ownable {
    /// campusId = keccak256 of a lowercase campus slug, e.g. "unilag".
    mapping(bytes32 => uint256) public campusAsks;
    mapping(bytes32 => mapping(address => uint256)) public scholarAsks;
    uint256 public totalAsks;

    event AsksRecorded(
        bytes32 indexed campusId,
        address indexed scholar,
        uint256 count,
        uint256 campusTotal
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Record settled, paid questions. Batched by the server so one
    /// sub-cent write can cover a study session.
    function recordAsks(
        bytes32 campusId,
        address scholar,
        uint256 count
    ) external onlyOwner {
        require(count > 0, "count=0");
        campusAsks[campusId] += count;
        scholarAsks[campusId][scholar] += count;
        totalAsks += count;
        emit AsksRecorded(campusId, scholar, count, campusAsks[campusId]);
    }
}
