// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Testnet want token for Bonzo vault smoke tests (ERC20, not HTS).
contract MockWantToken is ERC20 {
    constructor() ERC20("Bonzo Smoke Want", "BSW") {
        _mint(msg.sender, 1_000_000_000 * 1e18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
