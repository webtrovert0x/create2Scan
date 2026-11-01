// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Create2Scan
 * @notice Calculate and inspect CREATE2 smart contract addresses before deployment.
 * @dev All interactions require gas fees only; there are zero protocol/treasury fees.
 */
contract Create2Scan {
    struct PredictionRequest {
        uint256 id;
        address requester;
        address deployer;
        bytes32 salt;
        bytes32 initCodeHash;
        address predictedAddress;
        bool isDeployed;
        bool completed;
        uint256 timestamp;
    }

    /// @notice Global counter for inspection requests
    uint256 public requestNonce;

    /// @notice Mapping from requestId to PredictionRequest
    mapping(uint256 => PredictionRequest) public requests;

    /// @notice Mapping from user address to their request IDs
    mapping(address => uint256[]) private _userRequestIds;

    /// @notice Event emitted when a prediction inspection is requested
    event PredictionRequested(
        uint256 indexed requestId,
        address indexed requester,
        address indexed deployer,
        bytes32 salt,
        bytes32 initCodeHash,
        uint256 timestamp
    );

    /// @notice Event emitted when a prediction result is published/completed
    event PredictionPublished(
        uint256 indexed requestId,
        address indexed requester,
        address predictedAddress,
        bool isDeployed,
        uint256 timestamp
    );

    /**
     * @notice Create a new address prediction inspection request.
     * @param deployer The factory or deployer contract address.
     * @param salt The 32-byte salt value for CREATE2.
     * @param initCodeHash The keccak256 hash of the initialization bytecode.
     * @return requestId The assigned unique request ID.
     */
    function requestPrediction(
        address deployer,
        bytes32 salt,
        bytes32 initCodeHash
    ) external returns (uint256 requestId) {
        require(deployer != address(0), "Invalid deployer address");
        require(initCodeHash != bytes32(0), "Invalid initCodeHash");

        unchecked {
            requestId = ++requestNonce;
        }

        PredictionRequest storage req = requests[requestId];
        req.id = requestId;
        req.requester = msg.sender;
        req.deployer = deployer;
        req.salt = salt;
        req.initCodeHash = initCodeHash;
        req.timestamp = block.timestamp;
        req.completed = false;

        _userRequestIds[msg.sender].push(requestId);

        emit PredictionRequested(
            requestId,
            msg.sender,
            deployer,
            salt,
            initCodeHash,
            block.timestamp
        );
    }

    /**
     * @notice Publishes the inspection result for a previously requested prediction.
     * @param requestId The ID of the request to complete.
     * @param predictedAddress The computed CREATE2 address.
     * @param isDeployed True if the address already contains bytecode on the EVM.
     */
    function publishResult(
        uint256 requestId,
        address predictedAddress,
        bool isDeployed
    ) external {
        require(requestId > 0 && requestId <= requestNonce, "Request does not exist");
        PredictionRequest storage req = requests[requestId];
        require(!req.completed, "Request already completed");

        req.predictedAddress = predictedAddress;
        req.isDeployed = isDeployed;
        req.completed = true;

        emit PredictionPublished(
            requestId,
            req.requester,
            predictedAddress,
            isDeployed,
            block.timestamp
        );
    }

    /**
     * @notice Query a request by its ID.
     * @param requestId The ID of the prediction request.
     * @return The PredictionRequest struct data.
     */
    function getRequest(uint256 requestId)
        external
        view
        returns (PredictionRequest memory)
    {
        require(requestId > 0 && requestId <= requestNonce, "Request does not exist");
        return requests[requestId];
    }

    /**
     * @notice Compute a CREATE2 address directly on-chain using EVM rules.
     * @param deployer Address deploying the contract.
     * @param salt 32-byte salt.
     * @param initCodeHash Hash of the contract initialization code.
     * @return The computed deterministic contract address.
     */
    function computeAddress(
        address deployer,
        bytes32 salt,
        bytes32 initCodeHash
    ) public pure returns (address) {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            deployer,
                            salt,
                            initCodeHash
                        )
                    )
                )
            )
        );
    }

    /**
     * @notice Helper to fetch request IDs submitted by a specific user.
     * @param user The address of the requester.
     */
    function getUserRequestIds(address user)
        external
        view
        returns (uint256[] memory)
    {
        return _userRequestIds[user];
    }

    /**
     * @notice Helper to fetch the most recent requests.
     * @param limit Max number of requests to return.
     */
    function getRecentRequests(uint256 limit)
        external
        view
        returns (PredictionRequest[] memory)
    {
        uint256 total = requestNonce;
        if (total == 0) {
            return new PredictionRequest[](0);
        }

        uint256 count = limit > total ? total : limit;
        PredictionRequest[] memory items = new PredictionRequest[](count);

        for (uint256 i = 0; i < count; i++) {
            items[i] = requests[total - i];
        }

        return items;
    }
}

