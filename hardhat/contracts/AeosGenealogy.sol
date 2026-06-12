// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  AeosGenealogy
 * @notice Genealogy tracking contract: dual-tree (referral + binary) network only
 * @dev    Tracks who referred whom and binary placement positions
 *         No earnings, no volume tracking, no ranks — pure genealogy
 */

import "@openzeppelin/contracts/access/Ownable.sol";

contract AeosGenealogy is Ownable {

    /* ------------------------------------------------------------------ */
    /*                              STRUCTS                               */
    /* ------------------------------------------------------------------ */

    struct AffiliateData {
        address parent;      // Referral sponsor
        address[] children;  // Direct referrals
    }

    struct BinaryData {
        address parent;
        address leftAddress;
        address rightAddress;
    }

    /* ------------------------------------------------------------------ */
    /*                             STORAGE                                */
    /* ------------------------------------------------------------------ */

    mapping(address => bool) public isUser;
    mapping(address => AffiliateData) public affiliate;
    mapping(address => BinaryData) public binary;
    mapping(address => uint256) public lastCallBlock;
    mapping(address => uint256) public lastCallTime;

    address public root;
    uint256 public totalUsers;
    uint256 public transactionCooldown = 9 seconds;
    uint256 public constant maxIteration = 100;

    /* ------------------------------------------------------------------ */
    /*                               EVENTS                               */
    /* ------------------------------------------------------------------ */

    event Registered(
        address indexed user,
        address indexed sponsor,
        address binaryParent,
        uint8 leg
    );
    event AffiliateDataUpdated(address indexed user, address newParent);
    event BinaryDataUpdated(
        address indexed user,
        address newParent,
        address newLeft,
        address newRight
    );

    /* ------------------------------------------------------------------ */
    /*                              MODIFIERS                             */
    /* ------------------------------------------------------------------ */

    modifier antiSpam() {
        require(msg.sender == tx.origin, "CALLER_NOT_EOA");
        require(block.number > lastCallBlock[msg.sender], "ONE_CALL_PER_BLOCK");
        require(
            block.timestamp >= lastCallTime[msg.sender] + transactionCooldown,
            "TRANSACTION_COOLDOWN"
        );
        lastCallBlock[msg.sender] = block.number;
        lastCallTime[msg.sender] = block.timestamp;
        _;
    }

    modifier isRegistered() {
        require(isUser[msg.sender], "USER_NOT_FOUND");
        _;
    }

    /* ------------------------------------------------------------------ */
    /*                            CONSTRUCTOR                             */
    /* ------------------------------------------------------------------ */

    constructor(address _root) Ownable() {
        require(_root != address(0), "ZERO_ROOT");
        root = _root;
        isUser[_root] = true;
        totalUsers = 1;
    }

    /* ------------------------------------------------------------------ */
    /*                          USER FUNCTIONS                            */
    /* ------------------------------------------------------------------ */

    /**
     * @notice Register as a new user with a referral sponsor and binary placement.
     * @param sponsor       Referral upline (must be registered)
     * @param binaryParent  Binary placement target (must be registered, must have empty leg)
     * @param leg           0 = LEFT, 1 = RIGHT
     */
    function register(
        address sponsor,
        address binaryParent,
        uint8 leg
    ) external antiSpam {
        require(!isUser[msg.sender], "ALREADY_REGISTERED");
        require(isUser[sponsor], "SPONSOR_NOT_FOUND");
        require(isUser[binaryParent], "BINARY_PARENT_NOT_FOUND");
        require(leg == 0 || leg == 1, "INVALID_LEG");
        require(sponsor != msg.sender, "SELF_SPONSOR");
        require(binaryParent != msg.sender, "SELF_BINARY_PARENT");

        BinaryData storage bp = binary[binaryParent];
        if (leg == 0) {
            require(bp.leftAddress == address(0), "LEFT_TAKEN");
            bp.leftAddress = msg.sender;
        } else {
            require(bp.rightAddress == address(0), "RIGHT_TAKEN");
            bp.rightAddress = msg.sender;
        }

        isUser[msg.sender] = true;
        affiliate[msg.sender].parent = sponsor;
        affiliate[sponsor].children.push(msg.sender);
        binary[msg.sender].parent = binaryParent;

        totalUsers += 1;
        emit Registered(msg.sender, sponsor, binaryParent, leg);
    }

    /* ================================================================ */
    /*                   INTERNAL — TREE TRAVERSAL                      */
    /* ================================================================ */

    /**
     * @dev Find the next open binary slot by traversing down a preferred leg.
     *      BFS toward `_group` (0=LEFT, 1=RIGHT) to find an empty slot.
     */
    function _binaryOpenNode(
        address _placement,
        bool _group
    ) internal view returns (address, bool) {
        address origin = _placement;
        uint256 iterations = 0;
        while (_placement != address(0) && iterations < maxIteration) {
            BinaryData memory node = binary[_placement];
            if (_group) {
                if (node.rightAddress != address(0)) {
                    _placement = node.rightAddress;
                } else {
                    return (_placement, true);
                }
            } else {
                if (node.leftAddress != address(0)) {
                    _placement = node.leftAddress;
                } else {
                    return (_placement, false);
                }
            }
            iterations++;
        }
        return _binaryWeakLegNode(origin, _group);
    }

    /**
     * @dev Find the weakest leg (fewest direct children) for balanced tree growth.
     */
    function _binaryWeakLegNode(
        address _user,
        bool _group
    ) internal view returns (address _address, bool _position) {
        address current = _user;
        uint256 iterations = 0;
        while (current != address(0) && iterations < maxIteration) {
            iterations++;
            BinaryData memory node = binary[current];
            bool hasLeft = node.leftAddress != address(0);
            bool hasRight = node.rightAddress != address(0);

            // No children — prefer caller's side
            if (!hasLeft && !hasRight) return (current, _group);
            // One slot open — take it
            if (!hasLeft) return (current, false);
            if (!hasRight) return (current, true);

            // Both children — descend toward leg with fewer children
            uint256 leftCount = affiliate[node.leftAddress].children.length;
            uint256 rightCount = affiliate[node.rightAddress].children.length;
            current = (leftCount <= rightCount)
                ? node.leftAddress
                : node.rightAddress;
        }
        revert("TREE_TOO_DEEP");
    }

    /* ------------------------------------------------------------------ */
    /*                            VIEW FUNCTIONS                          */
    /* ------------------------------------------------------------------ */

    /**
     * @notice Get affiliate info: parent and direct child count.
     */
    function getAffiliate(
        address user
    ) external view returns (address parent, uint256 directCount) {
        AffiliateData storage a = affiliate[user];
        return (a.parent, a.children.length);
    }

    /**
     * @notice Get all direct children (referrals) of a user.
     */
    function getAffiliateChildren(
        address user
    ) external view returns (address[] memory) {
        return affiliate[user].children;
    }

    /**
     * @notice Get binary tree structure: parent and left/right children.
     */
    function getBinary(
        address user
    ) external view returns (address parent, address leftAddr, address rightAddr) {
        BinaryData storage b = binary[user];
        return (b.parent, b.leftAddress, b.rightAddress);
    }

    /**
     * @notice Get placement recommendation for a new user in binary tree.
     * @param _user     The user to find placement under
     * @param _options  0 = find open LEFT slot, 1 = find open RIGHT slot
     * @return _address The placement address
     * @return _position true = RIGHT leg, false = LEFT leg
     */
    function getPlacement(
        address _user,
        uint8 _options
    ) external view returns (address _address, bool _position) {
        require(isUser[_user], "USER_NOT_FOUND");
        if (_options == 0) return _binaryOpenNode(_user, false);
        if (_options == 1) return _binaryOpenNode(_user, true);
        return (_user, false);
    }

    /* ================================================================ */
    /*                      OWNER-ONLY FUNCTIONS                         */
    /* ================================================================ */

    /**
     * @notice Update affiliate parent for a user (migration/correction).
     *         Removes user from old parent's children and adds to new parent.
     */
    function updateAffiliateData(
        address user,
        address newParent
    ) external onlyOwner {
        require(isUser[user], "USER_NOT_FOUND");
        require(newParent != user, "SELF_PARENT");
        require(isUser[newParent], "NEW_PARENT_NOT_FOUND");

        AffiliateData storage aff = affiliate[user];

        // Remove from old parent's children
        address oldParent = aff.parent;
        if (oldParent != address(0)) {
            address[] storage oldChildren = affiliate[oldParent].children;
            for (uint256 i = 0; i < oldChildren.length; i++) {
                if (oldChildren[i] == user) {
                    oldChildren[i] = oldChildren[oldChildren.length - 1];
                    oldChildren.pop();
                    break;
                }
            }
        }

        // Add to new parent's children
        aff.parent = newParent;
        affiliate[newParent].children.push(user);

        emit AffiliateDataUpdated(user, newParent);
    }

    /**
     * @notice Update binary tree placement for a user (migration/correction).
     */
    function updateBinaryData(
        address user,
        address newParent,
        address newLeftAddr,
        address newRightAddr
    ) external onlyOwner {
        require(isUser[user], "USER_NOT_FOUND");

        BinaryData storage bin = binary[user];

        // Update parent if different
        if (newParent != bin.parent) {
            require(
                newParent == address(0) || isUser[newParent],
                "PARENT_NOT_FOUND"
            );
            // Remove from old parent's slot
            address oldParent = bin.parent;
            if (oldParent != address(0)) {
                BinaryData storage oldBin = binary[oldParent];
                if (oldBin.leftAddress == user) {
                    oldBin.leftAddress = address(0);
                } else if (oldBin.rightAddress == user) {
                    oldBin.rightAddress = address(0);
                }
            }
            bin.parent = newParent;
        }

        // Update left child if different
        if (newLeftAddr != bin.leftAddress) {
            require(
                newLeftAddr == address(0) || isUser[newLeftAddr],
                "LEFT_NOT_FOUND"
            );
            bin.leftAddress = newLeftAddr;
        }

        // Update right child if different
        if (newRightAddr != bin.rightAddress) {
            require(
                newRightAddr == address(0) || isUser[newRightAddr],
                "RIGHT_NOT_FOUND"
            );
            bin.rightAddress = newRightAddr;
        }

        emit BinaryDataUpdated(user, bin.parent, bin.leftAddress, bin.rightAddress);
    }

    /**
     * @notice Update user registration status (migration helper).
     */
    function updateIsUser(
        address user,
        bool newIsUserValue
    ) external onlyOwner {
        require(user != address(0), "ZERO_ADDRESS");

        if (newIsUserValue != isUser[user]) {
            isUser[user] = newIsUserValue;
            if (newIsUserValue) {
                totalUsers += 1;
            } else {
                totalUsers -= 1;
            }
        }
    }

    /**
     * @notice Set transaction cooldown for anti-spam protection.
     */
    function setTransactionCooldown(uint256 secs) external onlyOwner {
        require(secs <= 5 minutes, "COOLDOWN_TOO_LONG");
        transactionCooldown = secs;
    }
}
