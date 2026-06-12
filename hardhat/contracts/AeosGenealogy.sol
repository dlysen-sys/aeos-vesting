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
    mapping(address => bool) public isAdmin;
    mapping(address => AffiliateData) public affiliate;
    mapping(address => BinaryData) public binary;
    mapping(address => uint256) public lastCallBlock;
    mapping(address => uint256) public lastCallTime;

    address public root;
    uint256 public totalUsers;
    uint256 public transactionCooldown = 9 seconds;
    uint256 public maxIteration = 100;
    uint256 public constant GAS_BUFFER = 300_000;
    mapping(address => uint256) public userMaxPropagationDepth;

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
    event UserTraversalDepthReduced(address indexed user, uint256 newDepth);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

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

    modifier onlyAdmin() {
        require(msg.sender == owner() || isAdmin[msg.sender], "NOT_AUTHORIZED_ADMIN");
        _;
    }

    /* ------------------------------------------------------------------ */
    /*                            CONSTRUCTOR                             */
    /* ------------------------------------------------------------------ */

    constructor(address _root) Ownable() {
        require(_root != address(0), "ZERO_ROOT");
        root = _root;
        isUser[_root] = true;
        isAdmin[_root] = true;
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
     *      Dynamically adjusts per-user traversal depth if gas runs low.
     */
    function _binaryOpenNode(
        address _placement,
        bool _group
    ) internal returns (address, bool) {
        address origin = _placement;
        uint256 effectiveDepth = userMaxPropagationDepth[msg.sender] > 0
            ? userMaxPropagationDepth[msg.sender]
            : maxIteration;
        uint256 iterations = 0;

        while (_placement != address(0) && iterations < effectiveDepth) {
            if (gasleft() < GAS_BUFFER) {
                uint256 newDepth = iterations > 1 ? iterations - 1 : 1;
                userMaxPropagationDepth[msg.sender] = newDepth;
                emit UserTraversalDepthReduced(msg.sender, newDepth);
                break;
            }

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
     *      Dynamically adjusts per-user traversal depth if gas runs low.
     */
    function _binaryWeakLegNode(
        address _user,
        bool _group
    ) internal returns (address _address, bool _position) {
        address current = _user;
        uint256 effectiveDepth = userMaxPropagationDepth[msg.sender] > 0
            ? userMaxPropagationDepth[msg.sender]
            : maxIteration;
        uint256 iterations = 0;

        while (current != address(0) && iterations < effectiveDepth) {
            if (gasleft() < GAS_BUFFER) {
                uint256 newDepth = iterations > 1 ? iterations - 1 : 1;
                userMaxPropagationDepth[msg.sender] = newDepth;
                emit UserTraversalDepthReduced(msg.sender, newDepth);
                break;
            }

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
     * @dev    Avoid on large trees — unbounded copy. Use paginated overload instead.
     */
    function getAffiliateChildren(
        address user
    ) external view returns (address[] memory) {
        return affiliate[user].children;
    }

    /**
     * @notice Get a paginated slice of a user's direct referral children.
     * @param user   The user whose children to query
     * @param offset Start index (0-based)
     * @param limit  Max number of results to return
     */
    function getAffiliateChildrenPaginated(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory result, uint256 total) {
        address[] storage children = affiliate[user].children;
        total = children.length;
        if (offset >= total) return (new address[](0), total);
        uint256 end = offset + limit > total ? total : offset + limit;
        result = new address[](end - offset);
        for (uint256 i = 0; i < result.length; i++) {
            result[i] = children[offset + i];
        }
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
     * @dev    WARNING: Modifies state. May write userMaxPropagationDepth if gas
     *         runs low during traversal. Cannot be called from view contexts.
     * @param _user     The user to find placement under
     * @param _options  0 = find open LEFT slot, 1 = find open RIGHT slot
     * @return _address The placement address
     * @return _position true = RIGHT leg, false = LEFT leg
     */
    function getPlacement(
        address _user,
        uint8 _options
    ) external returns (address _address, bool _position) {
        require(isUser[_user], "USER_NOT_FOUND");
        if (_options == 0) return _binaryOpenNode(_user, false);
        if (_options == 1) return _binaryOpenNode(_user, true);
        return (_user, false);
    }

    /**
     * @notice Get the effective traversal depth for a user.
     *         Returns per-user depth if set, otherwise the global maxIteration.
     */
    function getUserTraversalDepth(address user) external view returns (uint256) {
        return userMaxPropagationDepth[user] > 0
            ? userMaxPropagationDepth[user]
            : maxIteration;
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
    ) external onlyAdmin {
        require(isUser[user], "USER_NOT_FOUND");
        require(newParent != user, "SELF_PARENT");
        require(isUser[newParent], "NEW_PARENT_NOT_FOUND");
        require(newParent != affiliate[user].parent, "ALREADY_SAME_PARENT");

        AffiliateData storage aff = affiliate[user];

        // Walk ancestor chain to detect circular reference
        address cursor = newParent;
        for (uint256 i = 0; i < maxIteration; i++) {
            if (cursor == address(0)) break;
            if (cursor == user) revert("CIRCULAR_PARENT");
            cursor = affiliate[cursor].parent;
        }

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
    ) external onlyAdmin {
        require(isUser[user], "USER_NOT_FOUND");
        if (newParent    != address(0)) require(newParent    != user, "SELF_PARENT");
        if (newLeftAddr  != address(0)) require(newLeftAddr  != user, "SELF_LEFT_CHILD");
        if (newRightAddr != address(0)) require(newRightAddr != user, "SELF_RIGHT_CHILD");
        if (newLeftAddr  != address(0) && newRightAddr != address(0))
            require(newLeftAddr != newRightAddr, "DUPLICATE_CHILD");

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

            // Register user into new parent's available slot
            if (newParent != address(0)) {
                BinaryData storage newParentBin = binary[newParent];
                if (newParentBin.leftAddress == address(0))
                    newParentBin.leftAddress = user;
                else if (newParentBin.rightAddress == address(0))
                    newParentBin.rightAddress = user;
                else revert("NEW_PARENT_FULL");
            }
        }

        // Update left child if different
        if (newLeftAddr != bin.leftAddress) {
            require(
                newLeftAddr == address(0) || isUser[newLeftAddr],
                "LEFT_NOT_FOUND"
            );

            // Orphan old left child's descendants if it exists
            address oldLeftAddr = bin.leftAddress;
            if (oldLeftAddr != address(0) && oldLeftAddr != newLeftAddr) {
                BinaryData storage oldLeftBin = binary[oldLeftAddr];
                if (oldLeftBin.leftAddress != address(0)) {
                    binary[oldLeftBin.leftAddress].parent = address(0);
                }
                if (oldLeftBin.rightAddress != address(0)) {
                    binary[oldLeftBin.rightAddress].parent = address(0);
                }
            }

            // Set new left child and update its parent pointer
            bin.leftAddress = newLeftAddr;
            if (newLeftAddr != address(0)) {
                // Remove new left child from its old parent's slot (if it has one)
                address newLeftParent = binary[newLeftAddr].parent;
                if (newLeftParent != address(0) && newLeftParent != user) {
                    BinaryData storage newLeftParentBin = binary[newLeftParent];
                    if (newLeftParentBin.leftAddress == newLeftAddr) {
                        newLeftParentBin.leftAddress = address(0);
                    } else if (newLeftParentBin.rightAddress == newLeftAddr) {
                        newLeftParentBin.rightAddress = address(0);
                    }
                }
                // Update new left child's parent to current user
                binary[newLeftAddr].parent = user;
            }
        }

        // Update right child if different
        if (newRightAddr != bin.rightAddress) {
            require(
                newRightAddr == address(0) || isUser[newRightAddr],
                "RIGHT_NOT_FOUND"
            );

            // Orphan old right child's descendants if it exists
            address oldRightAddr = bin.rightAddress;
            if (oldRightAddr != address(0) && oldRightAddr != newRightAddr) {
                BinaryData storage oldRightBin = binary[oldRightAddr];
                if (oldRightBin.leftAddress != address(0)) {
                    binary[oldRightBin.leftAddress].parent = address(0);
                }
                if (oldRightBin.rightAddress != address(0)) {
                    binary[oldRightBin.rightAddress].parent = address(0);
                }
            }

            // Set new right child and update its parent pointer
            bin.rightAddress = newRightAddr;
            if (newRightAddr != address(0)) {
                // Remove new right child from its old parent's slot (if it has one)
                address newRightParent = binary[newRightAddr].parent;
                if (newRightParent != address(0) && newRightParent != user) {
                    BinaryData storage newRightParentBin = binary[newRightParent];
                    if (newRightParentBin.leftAddress == newRightAddr) {
                        newRightParentBin.leftAddress = address(0);
                    } else if (newRightParentBin.rightAddress == newRightAddr) {
                        newRightParentBin.rightAddress = address(0);
                    }
                }
                // Update new right child's parent to current user
                binary[newRightAddr].parent = user;
            }
        }

        emit BinaryDataUpdated(user, bin.parent, bin.leftAddress, bin.rightAddress);
    }

    /**
     * @notice Update user registration status (migration helper).
     */
    function updateIsUser(
        address user,
        bool newIsUserValue
    ) external onlyAdmin {
        require(user != address(0), "ZERO_ADDRESS");
        require(user != root, "CANNOT_DISABLE_ROOT");

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
    function setTransactionCooldown(uint256 secs) external onlyAdmin {
        require(secs <= 5 minutes, "COOLDOWN_TOO_LONG");
        transactionCooldown = secs;
    }

    /**
     * @notice Set global maximum traversal depth for tree operations.
     *         Prevents excessively deep trees from causing OOG errors.
     */
    function setMaxIteration(uint256 depth) external onlyAdmin {
        require(depth >= 1 && depth <= 1000, "INVALID_DEPTH");
        maxIteration = depth;
    }

    /* ================================================================ */
    /*                     ADMIN MANAGEMENT (OWNER ONLY)               */
    /* ================================================================ */

    /**
     * @notice Add an admin address (owner only)
     * @param adminAddress The address to grant admin privileges
     */
    function addAdmin(address adminAddress) external onlyOwner {
        require(adminAddress != address(0), "ZERO_ADDRESS");
        require(!isAdmin[adminAddress], "ALREADY_ADMIN");
        isAdmin[adminAddress] = true;
        emit AdminAdded(adminAddress);
    }

    /**
     * @notice Remove an admin address (owner only)
     * @param adminAddress The address to revoke admin privileges
     */
    function removeAdmin(address adminAddress) external onlyOwner {
        require(adminAddress != address(0), "ZERO_ADDRESS");
        require(isAdmin[adminAddress], "NOT_ADMIN");
        isAdmin[adminAddress] = false;
        emit AdminRemoved(adminAddress);
    }

    /**
     * @notice Check if an address is admin (owner or in admin mapping)
     * @param addr The address to check
     * @return True if address is owner or designated admin
     */
    function checkIsAdmin(address addr) external view returns (bool) {
        return addr == owner() || isAdmin[addr];
    }
}
