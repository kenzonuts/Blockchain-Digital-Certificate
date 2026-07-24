import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", requireAuth, async (_req, res) => {
  const [
    totalCertificates,
    totalTemplates,
    blockchainTransactions,
    certificatesVerified,
    recentCertificates,
  ] = await Promise.all([
    prisma.certificate.count(),
    prisma.certificateTemplate.count(),
    prisma.certificate.count({
      where: { transactionHash: { not: null } },
    }),
    prisma.verificationLog.count(),
    prisma.certificate.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        certificateId: true,
        recipientName: true,
        title: true,
        transactionHash: true,
        createdAt: true,
      },
    }),
  ]);

  res.json({
    totalCertificates,
    totalTemplates,
    blockchainTransactions,
    certificatesVerified,
    recentCertificates,
  });
});
