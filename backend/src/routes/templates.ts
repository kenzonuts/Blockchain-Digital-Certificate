import { Router } from "express";
import { TemplateStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { templateFields } from "../middleware/upload";
import { safeUnlink, toPublicUploadPath } from "../lib/uploads";

export const templatesRouter = Router();

templatesRouter.use(requireAuth);

type UploadedFiles = {
  backgroundImage?: Express.Multer.File[];
  logo?: Express.Multer.File[];
  signature?: Express.Multer.File[];
  stamp?: Express.Multer.File[];
};

function filePublicPath(files: UploadedFiles, field: keyof UploadedFiles) {
  const file = files[field]?.[0];
  if (!file) return undefined;
  return toPublicUploadPath(file.path);
}

function serializeTemplate(template: {
  id: string;
  templateName: string;
  backgroundImage: string | null;
  logo: string | null;
  signature: string | null;
  stamp: string | null;
  status: TemplateStatus;
  createdAt: Date;
}) {
  return {
    id: template.id,
    templateName: template.templateName,
    backgroundImage: template.backgroundImage,
    logo: template.logo,
    signature: template.signature,
    stamp: template.stamp,
    status: template.status,
    createdAt: template.createdAt,
  };
}

templatesRouter.get("/", async (_req, res) => {
  const templates = await prisma.certificateTemplate.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  res.json({ templates: templates.map(serializeTemplate) });
});

templatesRouter.get("/:id", async (req, res) => {
  const template = await prisma.certificateTemplate.findUnique({
    where: { id: req.params.id },
  });

  if (!template) {
    res.status(404).json({ message: "Template not found" });
    return;
  }

  res.json({ template: serializeTemplate(template) });
});

templatesRouter.post("/", templateFields, async (req, res) => {
  const parsed = z
    .object({
      templateName: z.string().trim().min(1).max(120),
      setActive: z
        .union([z.literal("true"), z.literal("false"), z.boolean()])
        .optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Template name is required" });
    return;
  }

  const files = (req.files ?? {}) as UploadedFiles;
  const backgroundImage = filePublicPath(files, "backgroundImage");

  if (!backgroundImage) {
    res.status(400).json({ message: "Background template image is required" });
    return;
  }

  const setActive =
    parsed.data.setActive === true || parsed.data.setActive === "true";

  const template = await prisma.$transaction(async (tx) => {
    if (setActive) {
      await tx.certificateTemplate.updateMany({
        where: { status: TemplateStatus.ACTIVE },
        data: { status: TemplateStatus.INACTIVE },
      });
    }

    return tx.certificateTemplate.create({
      data: {
        templateName: parsed.data.templateName,
        backgroundImage,
        logo: filePublicPath(files, "logo") ?? null,
        signature: filePublicPath(files, "signature") ?? null,
        stamp: filePublicPath(files, "stamp") ?? null,
        status: setActive ? TemplateStatus.ACTIVE : TemplateStatus.INACTIVE,
      },
    });
  });

  res.status(201).json({ template: serializeTemplate(template) });
});

templatesRouter.put("/:id", templateFields, async (req, res) => {
  const existing = await prisma.certificateTemplate.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) {
    res.status(404).json({ message: "Template not found" });
    return;
  }

  const parsed = z
    .object({
      templateName: z.string().trim().min(1).max(120).optional(),
      clearLogo: z.union([z.literal("true"), z.boolean()]).optional(),
      clearSignature: z.union([z.literal("true"), z.boolean()]).optional(),
      clearStamp: z.union([z.literal("true"), z.boolean()]).optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid template payload" });
    return;
  }

  const files = (req.files ?? {}) as UploadedFiles;
  const nextBackground = filePublicPath(files, "backgroundImage");
  const nextLogo = filePublicPath(files, "logo");
  const nextSignature = filePublicPath(files, "signature");
  const nextStamp = filePublicPath(files, "stamp");

  const clearLogo =
    parsed.data.clearLogo === true || parsed.data.clearLogo === "true";
  const clearSignature =
    parsed.data.clearSignature === true ||
    parsed.data.clearSignature === "true";
  const clearStamp =
    parsed.data.clearStamp === true || parsed.data.clearStamp === "true";

  const template = await prisma.certificateTemplate.update({
    where: { id: existing.id },
    data: {
      templateName: parsed.data.templateName ?? existing.templateName,
      backgroundImage: nextBackground ?? existing.backgroundImage,
      logo: clearLogo ? null : (nextLogo ?? existing.logo),
      signature: clearSignature ? null : (nextSignature ?? existing.signature),
      stamp: clearStamp ? null : (nextStamp ?? existing.stamp),
    },
  });

  if (nextBackground && existing.backgroundImage) {
    safeUnlink(existing.backgroundImage);
  }
  if ((nextLogo || clearLogo) && existing.logo) safeUnlink(existing.logo);
  if ((nextSignature || clearSignature) && existing.signature) {
    safeUnlink(existing.signature);
  }
  if ((nextStamp || clearStamp) && existing.stamp) safeUnlink(existing.stamp);

  res.json({ template: serializeTemplate(template) });
});

templatesRouter.post("/:id/activate", async (req, res) => {
  const existing = await prisma.certificateTemplate.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) {
    res.status(404).json({ message: "Template not found" });
    return;
  }

  if (!existing.backgroundImage) {
    res
      .status(400)
      .json({ message: "Cannot activate template without background image" });
    return;
  }

  const template = await prisma.$transaction(async (tx) => {
    await tx.certificateTemplate.updateMany({
      where: { status: TemplateStatus.ACTIVE },
      data: { status: TemplateStatus.INACTIVE },
    });

    return tx.certificateTemplate.update({
      where: { id: existing.id },
      data: { status: TemplateStatus.ACTIVE },
    });
  });

  res.json({ template: serializeTemplate(template) });
});

templatesRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.certificateTemplate.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { certificates: true } } },
  });

  if (!existing) {
    res.status(404).json({ message: "Template not found" });
    return;
  }

  if (existing._count.certificates > 0) {
    res.status(400).json({
      message: "Cannot delete template that is used by certificates",
    });
    return;
  }

  await prisma.certificateTemplate.delete({ where: { id: existing.id } });

  safeUnlink(existing.backgroundImage);
  safeUnlink(existing.logo);
  safeUnlink(existing.signature);
  safeUnlink(existing.stamp);

  res.json({ message: "Template deleted" });
});
