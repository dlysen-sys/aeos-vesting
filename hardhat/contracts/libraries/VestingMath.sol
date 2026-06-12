// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library VestingMath {
    uint256 private constant BPS = 10000; // Basis points denominator (10000 bps = 100%)
    // Period lengths now passed as parameters to calculation functions, not hardcoded constants
    /**
     * @dev Calculate unlocked amount for cliff + periodic release vesting
     * @param totalAmount Total AEOS vesting amount
     * @param cliffEnd Timestamp when cliff ends
     * @param vestingEnd Timestamp when vesting fully completes
     * @param releasePercentPeriod Release percentage per period (e.g., 250 = 2.5% per period)
     * @param periodLength Period length in seconds (e.g., 2,592,000 = 30 days for monthly)
     * @return unlocked Amount unlocked so far
     */
    function calculateCliffMonthlyRelease(
        uint256 totalAmount,
        uint256 cliffEnd,
        uint256 vestingEnd,
        uint256 releasePercentPeriod,
        uint256 periodLength
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

        // Calculate periods elapsed since cliff
        uint256 secondsSinceCliff = now_ - cliffEnd;
        uint256 totalSeconds = vestingEnd - cliffEnd;
        uint256 periodsElapsed = secondsSinceCliff / periodLength;

        // Cap periods to maximum vesting period
        uint256 maxPeriods = totalSeconds / periodLength;
        if (periodsElapsed > maxPeriods) {
            periodsElapsed = maxPeriods;
        }

        // Calculate total unlock percentage
        uint256 unlockedPercent = periodsElapsed * releasePercentPeriod;
        if (unlockedPercent > BPS) {
            unlockedPercent = BPS; // Cap at 100%
        }

        // Return unlocked amount
        unlocked = (totalAmount * unlockedPercent) / BPS;
    }

    /**
     * @dev Calculate unlocked amount for cliff + periodic release vesting (generalized)
     * @param totalAmount Total AEOS vesting amount
     * @param cliffEnd Timestamp when cliff ends
     * @param vestingEnd Timestamp when vesting fully completes
     * @param releasePercentPeriod Release percentage per period (e.g., 500 = 5% per period)
     * @param periodLength Period length in seconds (e.g., 7,776,000 = 90 days for quarterly)
     * @return unlocked Amount unlocked so far
     */
    function calculateCliffQuarterlyRelease(
        uint256 totalAmount,
        uint256 cliffEnd,
        uint256 vestingEnd,
        uint256 releasePercentPeriod,
        uint256 periodLength
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

        // Calculate periods elapsed since cliff
        uint256 secondsSinceCliff = now_ - cliffEnd;
        uint256 totalSeconds = vestingEnd - cliffEnd;
        uint256 periodsElapsed = secondsSinceCliff / periodLength; // Whole number only

        // Cap periods to maximum vesting period
        uint256 maxPeriods = totalSeconds / periodLength;
        if (periodsElapsed > maxPeriods) {
            periodsElapsed = maxPeriods;
        }

        // Calculate total unlock percentage
        uint256 unlockedPercent = periodsElapsed * releasePercentPeriod;
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
     * @dev Calculate unlocked amount for initial + periodic release (yearly or custom period)
     * @param totalAmount Total vesting amount
     * @param initialPercent Initial release percentage (e.g., 1000 = 10%)
     * @param startTime Timestamp when vesting begins
     * @param periodPercent Percentage released per period (e.g., 1000 = 10% per year)
     * @param periodLength Period length in seconds (e.g., 31,536,000 = 365 days for yearly)
     * @return unlocked Amount unlocked so far
     */
    function calculateInitialPlusYearlyRelease(
        uint256 totalAmount,
        uint256 initialPercent,
        uint256 startTime,
        uint256 periodPercent,
        uint256 periodLength
    ) internal view returns (uint256 unlocked) {
        uint256 now_ = block.timestamp;

        uint256 initialAmount = (totalAmount * initialPercent) / BPS;

        if (now_ < startTime) {
            return 0;
        }

        uint256 secondsElapsed = now_ - startTime;
        uint256 periodsElapsed = secondsElapsed / periodLength; // Integer division → whole number only

        uint256 periodicAmount = totalAmount - initialAmount;
        uint256 periodicUnlocked = (periodicAmount * periodsElapsed * periodPercent) / BPS;

        unlocked = initialAmount + periodicUnlocked;
        if (unlocked > totalAmount) {
            unlocked = totalAmount;
        }
    }
}
