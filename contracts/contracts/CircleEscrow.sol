// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title CircleEscrow — "the treasurer that never chops the money" (Ajoye)
/// @notice Group collections with transparent release/refund. The Ajoye agent
/// (owner) creates collections and forwards settled x402 contributions into
/// escrow, crediting each member. At target: release to organizer. At expired
/// deadline below target: everyone can pull their refund.
contract CircleEscrow is Ownable {
    using SafeERC20 for IERC20;

    struct Collection {
        IERC20 token;
        address organizer;
        uint256 amountPerMember;
        uint256 target; // total to raise
        uint256 raised;
        uint64 deadline;
        bool released;
    }

    Collection[] public collections;
    mapping(uint256 => mapping(address => uint256)) public contributed;

    event CollectionCreated(
        uint256 indexed id,
        address indexed organizer,
        address token,
        uint256 amountPerMember,
        uint256 target,
        uint64 deadline
    );
    event Contributed(uint256 indexed id, address indexed member, uint256 amount);
    event Released(uint256 indexed id, uint256 amount);
    event Refunded(uint256 indexed id, address indexed member, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createCollection(
        IERC20 token,
        address organizer,
        uint256 amountPerMember,
        uint256 target,
        uint64 deadline
    ) external onlyOwner returns (uint256 id) {
        require(deadline > block.timestamp, "deadline past");
        require(target > 0 && amountPerMember > 0, "zero amount");
        id = collections.length;
        collections.push(
            Collection({
                token: token,
                organizer: organizer,
                amountPerMember: amountPerMember,
                target: target,
                raised: 0,
                deadline: deadline,
                released: false
            })
        );
        emit CollectionCreated(
            id, organizer, address(token), amountPerMember, target, deadline
        );
    }

    /// @notice Credit a member's contribution. Caller (agent treasury) must
    /// have approved the token; funds move into escrow in the same tx.
    function contributeFor(uint256 id, address member) external onlyOwner {
        Collection storage c = collections[id];
        require(block.timestamp <= c.deadline, "closed");
        require(!c.released, "released");
        require(contributed[id][member] == 0, "already paid");
        contributed[id][member] = c.amountPerMember;
        c.raised += c.amountPerMember;
        c.token.safeTransferFrom(msg.sender, address(this), c.amountPerMember);
        emit Contributed(id, member, c.amountPerMember);
    }

    function release(uint256 id) external {
        Collection storage c = collections[id];
        require(c.raised >= c.target, "target not met");
        require(!c.released, "released");
        c.released = true;
        c.token.safeTransfer(c.organizer, c.raised);
        emit Released(id, c.raised);
    }

    /// @notice Refund path if the deadline passes below target. Members (or
    /// the agent on their behalf) pull refunds to the member address.
    function refund(uint256 id, address member) external {
        Collection storage c = collections[id];
        require(block.timestamp > c.deadline, "not expired");
        require(c.raised < c.target, "target met");
        uint256 amount = contributed[id][member];
        require(amount > 0, "nothing to refund");
        contributed[id][member] = 0;
        c.raised -= amount;
        c.token.safeTransfer(member, amount);
        emit Refunded(id, member, amount);
    }
}
