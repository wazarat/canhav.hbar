// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @dev Minimal strategy matching Bonzo STRATEGY_ABI for smoke tests.
contract MockStrategy {
    using SafeERC20 for IERC20;

    IERC20 public immutable want;
    bool public paused;

    constructor(address _want) {
        want = IERC20(_want);
    }

    function balanceOf() external view returns (uint256) {
        return want.balanceOf(address(this));
    }

    function balanceOfWant() external view returns (uint256) {
        return want.balanceOf(address(this));
    }

    function balanceOfPool() external pure returns (uint256) {
        return 0;
    }

    function rewardsAvailable() external pure returns (uint256) {
        return 0;
    }

    function callReward() external pure returns (uint256) {
        return 0;
    }

    function harvest() external {
        _harvest(msg.sender);
    }

    function harvest(address callFeeRecipient) external {
        _harvest(callFeeRecipient);
    }

    function _harvest(address) internal {
        require(!paused, "paused");
    }

    function panic() external {
        paused = true;
    }

    function pause() external {
        paused = true;
    }

    function unpause() external {
        paused = false;
    }

    function retireStrat() external {
        paused = true;
    }
}
