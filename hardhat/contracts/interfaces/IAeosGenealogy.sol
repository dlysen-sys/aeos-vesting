// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAeosGenealogy
 * @notice Interface for AeosGenealogy contract
 * Provides minimal read-only functions for referral tracking
 */
interface IAeosGenealogy {
    /**
     * @notice Get affiliate info: parent and direct child count
     * @param user The user to get affiliate info for
     * @return parent The referral sponsor/parent address
     * @return directCount Number of direct children/referrals
     */
    function getAffiliate(address user) external view returns (address parent, uint256 directCount);

    /**
     * @notice Get all direct children (referrals) of a user
     * @param user The user to get children for
     * @return children Array of direct referral addresses
     */
    function getAffiliateChildren(address user) external view returns (address[] memory children);

    /**
     * @notice Check if a user is registered
     * @param user The address to check
     * @return registered True if user is registered, false otherwise
     */
    function isUser(address user) external view returns (bool registered);
}
