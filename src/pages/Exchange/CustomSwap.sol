// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CustomSwap {
    // Event to track deposits
    event Deposit(address indexed token, address indexed depositor, uint256 amount);
    // Event to track swaps
    event Swap(address indexed fromToken, address indexed toToken, address indexed user, uint256 amountIn, uint256 amountOut);

    // Allow users to deposit tokens into the contract
    function deposit(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Deposit failed");
        emit Deposit(token, msg.sender, amount);
    }

    // Check contract's balance of a token
    function getContractBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // Swap tokens with detailed error handling
    function swapCustomTokens(
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut
    ) external {
        require(amountIn > 0, "Amount must be greater than 0");
        require(fromToken != toToken, "Cannot swap same token");
        
        // Check contract's balance of toToken before proceeding
        uint256 contractBalance = IERC20(toToken).balanceOf(address(this));
        require(contractBalance >= minAmountOut, "Insufficient contract balance for swap");

        // Check user's balance and allowance
        require(IERC20(fromToken).balanceOf(msg.sender) >= amountIn, "Insufficient user balance");
        
        // Perform the swap
        require(IERC20(fromToken).transferFrom(msg.sender, address(this), amountIn), "Failed to receive tokens from user");
        require(IERC20(toToken).transfer(msg.sender, minAmountOut), "Failed to send tokens to user");

        emit Swap(fromToken, toToken, msg.sender, amountIn, minAmountOut);
    }
}