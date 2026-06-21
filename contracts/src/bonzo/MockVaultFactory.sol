// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MockVault.sol";

/// @dev Factory matching BonzoVaultV7Factory cloneVault + ProxyCreated event.
contract MockVaultFactory {
    event ProxyCreated(address proxy);

    function cloneVault() external returns (address) {
        MockVault vault = new MockVault();
        emit ProxyCreated(address(vault));
        return address(vault);
    }

    function cloneVaultCLM() external returns (address) {
        MockVault vault = new MockVault();
        emit ProxyCreated(address(vault));
        return address(vault);
    }
}
