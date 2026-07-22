import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", requireAuth, async (_req, res) => {
  const [totalCertificates, totalTemplates, blockchainTransactions] =
    await Promise.all([
      prisma.certificate.count(),
      prisma.certificateTemplate.count(),
      prisma.certificate.count({
        where: { transactionHash: { not: null } },
      }),
    ]);

  res.json({
    totalCertificates,
    totalTemplates,
    blockchainTransactions,
    certificatesVerified: 0,
  });
});
