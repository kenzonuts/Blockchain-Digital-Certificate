import { Router } from "express";
import fs from "fs";
import type { Response } from "express";
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

async function respondVerify(
  res: Response,
  statusCode: number,
  payload: {
    status: VerifyStatus;
    message: string;
    certificateId?: string | null;
    [key: string]: unknown;
  }
) {
  await prisma.verificationLog
    .create({
      data: {
        certificateId: payload.certificateId ?? null,
        status: payload.status,
      },
    })
    .catch((err) => console.error("Failed to log verification", err));

  res.status(statusCode).json(payload);
}

verifyRouter.get("/:certificateId", async (req, res) => {
  const certificateId = decodeURIComponent(req.params.certificateId).trim();

  if (!certificateId) {
    await respondVerify(res, 400, {
      status: "NOT_FOUND",
      message: "Certificate ID is required",
      certificateId: null,
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
    await respondVerify(res, 404, {
      status: "NOT_FOUND",
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
    await respondVerify(res, 200, {
      status: "PDF_MISSING",
      message: "Certificate PDF is missing; cannot compute hash",
      certificateId: certificate.certificateId,
      certificate: publicMeta,
    });
    return;
  }

  const abs = absoluteFromPublicPath(certificate.pdfPath);
  if (!fs.existsSync(abs)) {
    await respondVerify(res, 200, {
      status: "PDF_MISSING",
      message: "Certificate PDF file is missing on storage",
      certificateId: certificate.certificateId,
      certificate: publicMeta,
    });
    return;
  }

  const pdfHash = sha256File(abs);
  const storedHash = certificate.certificateHash?.toLowerCase() ?? null;
  const pdfMatchesStored = storedHash ? pdfHash === storedHash : null;

  if (!certificate.transactionHash) {
    await respondVerify(res, 200, {
      status: "NOT_PUBLISHED",
      message:
        "Certificate exists but has not been published to the blockchain yet",
      certificateId: certificate.certificateId,
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
      await respondVerify(res, 200, {
        status: "INVALID",
        message:
          "Certificate is marked published in database, but was not found on-chain",
        certificateId: certificate.certificateId,
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

    await respondVerify(res, 200, {
      status: valid ? "VALID" : "INVALID",
      message: valid
        ? "Certificate is authentic. PDF hash matches the on-chain record."
        : "Certificate hash mismatch. The PDF may have been altered, or on-chain data does not match.",
      certificateId: certificate.certificateId,
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
    await respondVerify(res, 503, {
      status: "CHAIN_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to read certificate from blockchain",
      certificateId: certificate.certificateId,
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
