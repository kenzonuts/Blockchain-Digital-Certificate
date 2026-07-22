import { Router } from "express";
import fs from "fs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { generateCertificatePdf } from "../services/pdf";
import { buildVerifyUrl } from "../services/qr";
import { issueCertificateOnChain } from "../services/blockchain";
import { sha256File } from "../services/hash";
import { absoluteFromPublicPath, safeUnlink } from "../lib/uploads";

export const certificatesRouter = Router();

certificatesRouter.use(requireAuth);

const createSchema = z.object({
  certificateId: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[A-Za-z0-9-_]+$/, "Certificate ID may only contain letters, numbers, - and _"),
  recipientName: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(200),
  issueDate: z.string().min(1),
  issuer: z.string().trim().min(1).max(160),
  templateId: z.string().min(1),
});

function serializeCertificate(
  certificate: {
    id: string;
    certificateId: string;
    recipientName: string;
    title: string;
    issueDate: Date;
    issuer: string;
    templateId: string;
    pdfPath: string | null;
    certificateHash: string | null;
    transactionHash: string | null;
    blockNumber: number | null;
    blockchainTimestamp: Date | null;
    createdAt: Date;
    template?: {
      id: string;
      templateName: string;
      status: string;
    } | null;
  }
) {
  return {
    id: certificate.id,
    certificateId: certificate.certificateId,
    recipientName: certificate.recipientName,
    title: certificate.title,
    issueDate: certificate.issueDate,
    issuer: certificate.issuer,
    templateId: certificate.templateId,
    pdfPath: certificate.pdfPath,
    certificateHash: certificate.certificateHash,
    transactionHash: certificate.transactionHash,
    blockNumber: certificate.blockNumber,
    blockchainTimestamp: certificate.blockchainTimestamp,
    createdAt: certificate.createdAt,
    verifyUrl: buildVerifyUrl(certificate.certificateId),
    template: certificate.template
      ? {
          id: certificate.template.id,
          templateName: certificate.template.templateName,
          status: certificate.template.status,
        }
      : undefined,
  };
}

certificatesRouter.get("/", async (_req, res) => {
  const certificates = await prisma.certificate.findMany({
    include: {
      template: {
        select: { id: true, templateName: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    certificates: certificates.map(serializeCertificate),
  });
});

certificatesRouter.get("/:id", async (req, res) => {
  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [{ id: req.params.id }, { certificateId: req.params.id }],
    },
    include: {
      template: {
        select: { id: true, templateName: true, status: true },
      },
    },
  });

  if (!certificate) {
    res.status(404).json({ message: "Certificate not found" });
    return;
  }

  res.json({ certificate: serializeCertificate(certificate) });
});

certificatesRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: parsed.error.issues[0]?.message ?? "Invalid certificate payload",
    });
    return;
  }

  const issueDate = new Date(parsed.data.issueDate);
  if (Number.isNaN(issueDate.getTime())) {
    res.status(400).json({ message: "Invalid issue date" });
    return;
  }

  const template = await prisma.certificateTemplate.findUnique({
    where: { id: parsed.data.templateId },
  });

  if (!template) {
    res.status(400).json({ message: "Template not found" });
    return;
  }

  if (!template.backgroundImage) {
    res.status(400).json({
      message: "Selected template has no background image",
    });
    return;
  }

  const existing = await prisma.certificate.findUnique({
    where: { certificateId: parsed.data.certificateId },
  });

  if (existing) {
    res.status(409).json({ message: "Certificate ID already exists" });
    return;
  }

  const created = await prisma.certificate.create({
    data: {
      certificateId: parsed.data.certificateId,
      recipientName: parsed.data.recipientName,
      title: parsed.data.title,
      issueDate,
      issuer: parsed.data.issuer,
      templateId: template.id,
    },
  });

  try {
    const { pdfPath, certificateHash } = await generateCertificatePdf({
      certificate: created,
      template,
    });

    const certificate = await prisma.certificate.update({
      where: { id: created.id },
      data: { pdfPath, certificateHash },
      include: {
        template: {
          select: { id: true, templateName: true, status: true },
        },
      },
    });

    res.status(201).json({ certificate: serializeCertificate(certificate) });
  } catch (error) {
    await prisma.certificate.delete({ where: { id: created.id } }).catch(() => undefined);
    console.error(error);
    res.status(500).json({ message: "Failed to generate certificate PDF" });
  }
});

certificatesRouter.post("/:id/regenerate", async (req, res) => {
  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [{ id: req.params.id }, { certificateId: req.params.id }],
    },
    include: { template: true },
  });

  if (!certificate) {
    res.status(404).json({ message: "Certificate not found" });
    return;
  }

  if (certificate.transactionHash) {
    res.status(400).json({
      message:
        "Cannot regenerate PDF after blockchain publish (hash would change)",
    });
    return;
  }

  const oldPdf = certificate.pdfPath;
  const { pdfPath, certificateHash } = await generateCertificatePdf({
    certificate,
    template: certificate.template,
  });

  const updated = await prisma.certificate.update({
    where: { id: certificate.id },
    data: { pdfPath, certificateHash },
    include: {
      template: {
        select: { id: true, templateName: true, status: true },
      },
    },
  });

  if (oldPdf && oldPdf !== pdfPath) safeUnlink(oldPdf);

  res.json({ certificate: serializeCertificate(updated) });
});

certificatesRouter.get("/:id/download", async (req, res) => {
  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [{ id: req.params.id }, { certificateId: req.params.id }],
    },
  });

  if (!certificate?.pdfPath) {
    res.status(404).json({ message: "Certificate PDF not found" });
    return;
  }

  const abs = absoluteFromPublicPath(certificate.pdfPath);
  if (!fs.existsSync(abs)) {
    res.status(404).json({ message: "Certificate PDF file missing on disk" });
    return;
  }

  res.download(
    abs,
    `${certificate.certificateId}.pdf`,
    (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ message: "Failed to download PDF" });
      }
    }
  );
});

certificatesRouter.post("/:id/publish", async (req, res) => {
  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [{ id: req.params.id }, { certificateId: req.params.id }],
    },
    include: {
      template: {
        select: { id: true, templateName: true, status: true },
      },
    },
  });

  if (!certificate) {
    res.status(404).json({ message: "Certificate not found" });
    return;
  }

  if (certificate.transactionHash) {
    res.status(400).json({ message: "Certificate already published" });
    return;
  }

  if (!certificate.pdfPath || !certificate.certificateHash) {
    res.status(400).json({
      message: "Certificate PDF/hash missing. Generate PDF first.",
    });
    return;
  }

  const abs = absoluteFromPublicPath(certificate.pdfPath);
  if (!fs.existsSync(abs)) {
    res.status(400).json({ message: "Certificate PDF file missing on disk" });
    return;
  }

  // Re-hash stored PDF so on-chain value always matches file bytes
  const freshHash = sha256File(abs);
  if (freshHash !== certificate.certificateHash) {
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { certificateHash: freshHash },
    });
  }

  try {
    const onChain = await issueCertificateOnChain({
      certificateId: certificate.certificateId,
      certificateHash: freshHash,
    });

    const updated = await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        certificateHash: freshHash,
        transactionHash: onChain.transactionHash,
        blockNumber: onChain.blockNumber,
        blockchainTimestamp: onChain.blockchainTimestamp,
      },
      include: {
        template: {
          select: { id: true, templateName: true, status: true },
        },
      },
    });

    res.json({
      certificate: serializeCertificate(updated),
      issuerWallet: onChain.issuerWallet,
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Failed to publish on blockchain";
    res.status(500).json({ message });
  }
});
