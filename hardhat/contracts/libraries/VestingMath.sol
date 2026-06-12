// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library VestingMath {
    uint256 private constant BPS = 10000; // Basis points denominator (10000 bps = 100%)

    // ⚠️ TESTING vs PRODUCTION period lengths
    // BEFORE MAINNET DEPLOYMENT: Refactor to accept these as owner-configurable parameters
    // See OWNER_CONFIGURABLE_PERIODS.md for the recommended architecture

    // QUARTERLY PERIOD: Default 90 days, Testing 1 minute (for instant unlocks after cliff)
    // To revert: Change to: uint256 internal constant QUARTERLY_PERIOD = 90 days;
    uint256 internal constant QUARTERLY_PERIOD = 1 minutes; // 60 seconds (testing) | 7,776,000 seconds (production: 90 days)

    // MONTHLY PERIOD: Default 30 days, Testing 9 minutes
    // To revert: Change to: uint256 internal constant MONTHLY_PERIOD = 30 days;
    uint256 internal constant MONTHLY_PERIOD = 9 minutes; // 540 seconds (testing) | 2,592,000 seconds (production: 30 days)

    // YEARLY PERIOD: Default 365 days, Testing 1 hour
    // To revert: Change to: uint256 internal constant YEARLY_PERIOD = 365 days;
    uint256 internal constant YEARLY_PERIOD = 1 hours; // 3,600 seconds (testing) | 31,536,000 seconds (production: 365 days)
    /**
     * @dev Calculate unlocked amount for cliff + monthly release vesting (Advisors)
     * @param totalAmount Total AEOS vesting amount
     * @param cliffEnd Timestamp when cliff ends
     * @param vestingEnd Timestamp when vesting fully completes
     * @param releasePercentMonthly Monthly release percentage (e.g., 250 = 2.5% per period)
     * @return unlocked Amount unlocked so far
     */
    function calculateCliffMonthlyRelease(
        uint256 totalAmount,
        uint256 cliffEnd,
        uint256 vestingEnd,
        uint256 releasePercentMonthly
    ) internal view returns (uint256 unlocked) {
        uint256 now_ = block.timestamp;

        // Before cliff: no unlock
        if (now_ < cliffEnd) {
            return 0;
        }

        // After vesting ends: full unlock
        if (now_ >= vestingEnd) {
            return totalAmount;
        }

        // Calculate months elapsed since cliff
        uint256 secondsSinceCliff = now_ - cliffEnd;
        uint256 totalSeconds = vestingEnd - cliffEnd;
        uint256 monthsElapsed = secondsSinceCliff / MONTHLY_PERIOD;

        // Cap months to maximum vesting period
        uint256 maxMonths = totalSeconds / MONTHLY_PERIOD;
        if (monthsElapsed > maxMonths) {
            monthsElapsed = maxMonths;
        }

        // Calculate total unlock percentage
        uint256 unlockedPercent = monthsElapsed * releasePercentMonthly;
        if (unlockedPercent > BPS) {
            unlockedPercent = BPS; // Cap at 100%
        }

        // Return unlocked amount
        unlocked = (totalAmount * unlockedPercent) / BPS;
    }

    /**
     * @dev Calculate unlocked amount for cliff + quarterly release vesting (Strategic Investors)
     * @param totalAmount Total AEOS vesting amount
     * @param cliffEnd Timestamp when cliff ends
     * @param vestingEnd Timestamp when vesting fully completes
     * @param releasePercentQuarterly Quarterly release percentage (e.g., 500 = 5% per period)
     * @return unlocked Amount unlocked so far
     */
    function calculateCliffQuarterlyRelease(
        uint256 totalAmount,
        uint256 cliffEnd,
        uint256 vestingEnd,
        uint256 releasePercentQuarterly
    ) internal view returns (uint256 unlocked) {
        uint256 now_ = block.timestamp;

        // Before cliff: no unlock
        if (now_ < cliffEnd) {
            return 0;
        }

        // After vesting ends: full unlock
        if (now_ >= vestingEnd) {
            return totalAmount;
        }

        // Calculate quarters elapsed since cliff
        uint256 secondsSinceCliff = now_ - cliffEnd;
        uint256 totalSeconds = vestingEnd - cliffEnd;
        uint256 quartersElapsed = secondsSinceCliff / QUARTERLY_PERIOD; // Whole number only

        // Cap quarters to maximum vesting period
        uint256 maxQuarters = totalSeconds / QUARTERLY_PERIOD;
        if (quartersElapsed > maxQuarters) {
            quartersElapsed = maxQuarters;
        }

        // Calculate total unlock percentage
        uint256 unlockedPercent = quartersElapsed * releasePercentQuarterly;
        if (unlockedPercent > BPS) {
            unlockedPercent = BPS; // Cap at 100%
        }

        // Return unlocked amount
        unlocked = (totalAmount * unlockedPercent) / BPS;
    }

    /**
     * @dev Calculate unlocked amount for initial release + periodic unlock
     * @param totalAmount Total vesting amount
     * @param initialPercent Initial release percentage (e.g., 1000 = 10%)
     * @param startTime Timestamp when periodic unlocks begin (after initial)
     * @param endTime Timestamp when fully vested
     * @param periodPercent Percentage released per period (e.g., 500 = 5%)
     * @param periodLength Period length in seconds (e.g., 90 days for quarterly)
     * @return unlocked Amount unlocked so far
     */
    function calculateInitialPlusPeriodicRelease(
        uint256 totalAmount,
        uint256 initialPercent,
        uint256 startTime,
        uint256 endTime,
        uint256 periodPercent,
        uint256 periodLength
    ) internal view returns (uint256 unlocked) {
        uint256 now_ = block.timestamp;

        uint256 initialAmount = (totalAmount * initialPercent) / BPS;
        unlocked = initialAmount;

        if (now_ < startTime) {
            return unlocked;
        }

        if (now_ >= endTime) {
            return totalAmount;
        }

        uint256 secondsSinceStart = now_ - startTime;
        uint256 periodsElapsed = secondsSinceStart / periodLength; // Integer division → whole number only

        uint256 remainingAmount = totalAmount - initialAmount;
        uint256 periodicUnlocked = (remainingAmount * periodsElapsed * periodPercent) / BPS;

        if (unlocked + periodicUnlocked > totalAmount) {
            unlocked = totalAmount;
        } else {
            unlocked += periodicUnlocked;
        }
    }

    /**
     * @dev Calculate unlocked amount for yearly release
     * @param totalAmount Total vesting amount
     * @param initialPercent Initial release percentage (e.g., 1000 = 10%)
     * @param startTime Timestamp when vesting begins
     * @param yearlyPercent Percentage released per year (e.g., 1000 = 10%)
     * @return unlocked Amount unlocked so far
     */
    function calculateInitialPlusYearlyRelease(
        uint256 totalAmount,
        uint256 initialPercent,
        uint256 startTime,
        uint256 yearlyPercent
    ) internal view returns (uint256 unlocked) {
        uint256 now_ = block.timestamp;

        uint256 initialAmount = (totalAmount * initialPercent) / BPS;

        if (now_ < startTime) {
            return 0;
        }

        uint256 secondsElapsed = now_ - startTime;
        uint256 yearsElapsed = secondsElapsed / YEARLY_PERIOD; // Integer division → whole number only

        uint256 periodicAmount = totalAmount - initialAmount;
        uint256 yearlyUnlocked = (periodicAmount * yearsElapsed * yearlyPercent) / BPS;

        unlocked = initialAmount + yearlyUnlocked;
        if (unlocked > totalAmount) {
            unlocked = totalAmount;
        }
    }
}
