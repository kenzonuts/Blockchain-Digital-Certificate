// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CertificateRegistry
/// @notice Stores SHA-256 certificate hashes on-chain for authenticity checks.
/// @dev Does not store PDF files — only certificateId + hash + issuer + timestamp.
/// @custom:security Contact Primordial Studio for commercial licensing.
/// Copyright (c) 2026 Primordial Studio. All Rights Reserved.
contract CertificateRegistry is Ownable {
    struct Certificate {
        string certificateId;
        bytes32 certificateHash;
        address issuer;
        uint256 issuedAt;
    }

    mapping(string => Certificate) private _certificates;
    mapping(string => bool) public exists;

    event CertificateIssued(
        string certificateId,
        bytes32 certificateHash,
        address indexed issuer,
        uint256 issuedAt
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    function issueCertificate(
        string calldata certificateId,
        bytes32 certificateHash
    ) external onlyOwner {
        require(bytes(certificateId).length > 0, "Empty certificate id");
        require(certificateHash != bytes32(0), "Empty certificate hash");
        require(!exists[certificateId], "Certificate already issued");

        uint256 issuedAt = block.timestamp;

        _certificates[certificateId] = Certificate({
            certificateId: certificateId,
            certificateHash: certificateHash,
            issuer: msg.sender,
            issuedAt: issuedAt
        });
        exists[certificateId] = true;

        emit CertificateIssued(
            certificateId,
            certificateHash,
            msg.sender,
            issuedAt
        );
    }

    function getCertificate(
        string calldata certificateId
    )
        external
        view
        returns (
            string memory id,
            bytes32 certificateHash,
            address issuer,
            uint256 issuedAt
        )
    {
        require(exists[certificateId], "Certificate not found");
        Certificate memory cert = _certificates[certificateId];
        return (
            cert.certificateId,
            cert.certificateHash,
            cert.issuer,
            cert.issuedAt
        );
    }
}
