import { Router } from "express";
import fs from "fs";
import { prisma } from "../lib/prisma";
import { absoluteFromPublicPath } from "../lib/uploads";
import { getCertificateOnChain } from "../services/blockchain";
import { sha256File } from "../services/hash";

export const verifyRouter = Router();

export type VerifyStatus =
  | "VALID"
  | "INVALID"
  | "NOT_FOUND"
  | "NOT_PUBLISHED"
  | "PDF_MISSING"
  | "CHAIN_ERROR";

verifyRouter.get("/:certificateId", async (req, res) => {
  const certificateId = decodeURIComponent(req.params.certificateId).trim();

  if (!certificateId) {
    res.status(400).json({
      status: "NOT_FOUND" satisfies VerifyStatus,
      message: "Certificate ID is required",
    });
    return;
  }

  const certificate = await prisma.certificate.findUnique({
    where: { certificateId },
    include: {
      template: {
        select: { templateName: true },
      },
    },
  });

  if (!certificate) {
    res.status(404).json({
      status: "NOT_FOUND" satisfies VerifyStatus,
      message: "Certificate not found in the system",
      certificateId,
    });
    return;
  }

  const publicMeta = {
    certificateId: certificate.certificateId,
    recipientName: certificate.recipientName,
    title: certificate.title,
    issuer: certificate.issuer,
    issueDate: certificate.issueDate,
    templateName: certificate.template.templateName,
    transactionHash: certificate.transactionHash,
    blockNumber: certificate.blockNumber,
    blockchainTimestamp: certificate.blockchainTimestamp,
  };

  if (!certificate.pdfPath) {
    res.json({
      status: "PDF_MISSING" satisfies VerifyStatus,
      message: "Certificate PDF is missing; cannot compute hash",
      certificate: publicMeta,
    });
    return;
  }

  const abs = absoluteFromPublicPath(certificate.pdfPath);
  if (!fs.existsSync(abs)) {
    res.json({
      status: "PDF_MISSING" satisfies VerifyStatus,
      message: "Certificate PDF file is missing on storage",
      certificate: publicMeta,
    });
    return;
  }

  const pdfHash = sha256File(abs);
  const storedHash = certificate.certificateHash?.toLowerCase() ?? null;
  const pdfMatchesStored = storedHash ? pdfHash === storedHash : null;

  if (!certificate.transactionHash) {
    res.json({
      status: "NOT_PUBLISHED" satisfies VerifyStatus,
      message:
        "Certificate exists but has not been published to the blockchain yet",
      certificate: publicMeta,
      hashes: {
        pdfHash,
        storedHash,
        onChainHash: null,
        pdfMatchesStored,
        pdfMatchesOnChain: null,
      },
    });
    return;
  }

  try {
    const onChain = await getCertificateOnChain(certificate.certificateId);

    if (!onChain) {
      res.json({
        status: "INVALID" satisfies VerifyStatus,
        message:
          "Certificate is marked published in database, but was not found on-chain",
        certificate: publicMeta,
        hashes: {
          pdfHash,
          storedHash,
          onChainHash: null,
          pdfMatchesStored,
          pdfMatchesOnChain: false,
        },
      });
      return;
    }

    const onChainHash = onChain.certificateHash.toLowerCase();
    const pdfMatchesOnChain = pdfHash === onChainHash;
    const valid = pdfMatchesOnChain;

    res.json({
      status: (valid ? "VALID" : "INVALID") satisfies VerifyStatus,
      message: valid
        ? "Certificate is authentic. PDF hash matches the on-chain record."
        : "Certificate hash mismatch. The PDF may have been altered, or on-chain data does not match.",
      certificate: {
        ...publicMeta,
        onChainIssuer: onChain.issuer,
        onChainIssuedAt: new Date(onChain.issuedAt * 1000),
      },
      hashes: {
        pdfHash,
        storedHash,
        onChainHash,
        pdfMatchesStored,
        pdfMatchesOnChain,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(503).json({
      status: "CHAIN_ERROR" satisfies VerifyStatus,
      message:
        error instanceof Error
          ? error.message
          : "Failed to read certificate from blockchain",
      certificate: publicMeta,
      hashes: {
        pdfHash,
        storedHash,
        onChainHash: null,
        pdfMatchesStored,
        pdfMatchesOnChain: null,
      },
    });
  }
});
