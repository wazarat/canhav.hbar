// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MockStrategy.sol";

/// @dev Minimal Beefy-style vault for Hedera testnet smoke tests.
contract MockVault is ERC20 {
    using SafeERC20 for IERC20;

    uint256 private constant PPS = 1e18;

    address public strategy;
    IERC20 public want;
    bool public initialized;

    constructor() ERC20("Bonzo Smoke Vault", "BSV") {}

    function initialize(
        address _strategy,
        string memory,
        string memory,
        uint256,
        bool
    ) external {
        require(!initialized, "initialized");
        initialized = true;
        strategy = _strategy;
        want = IERC20(MockStrategy(_strategy).want());
    }

    function balance() external view returns (uint256) {
        return want.balanceOf(address(this));
    }

    function available() external view returns (uint256) {
        return want.balanceOf(address(this));
    }

    function getPricePerFullShare() external pure returns (uint256) {
        return PPS;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "zero");
        want.safeTransferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);
    }

    function withdraw(uint256 shares) external {
        require(shares > 0, "zero");
        _burn(msg.sender, shares);
        want.safeTransfer(msg.sender, shares);
    }

    function earn() external {}
}
