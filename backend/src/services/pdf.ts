import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Certificate, CertificateTemplate } from "@prisma/client";
import {
  CERTIFICATE_UPLOAD_DIR,
  absoluteFromPublicPath,
  ensureUploadDirs,
  toPublicUploadPath,
} from "../lib/uploads";
import { sha256File } from "./hash";
import { generateQrPng } from "./qr";

type TemplateWithAssets = CertificateTemplate;

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

async function embedImage(
  pdf: PDFDocument,
  publicPath?: string | null
) {
  if (!publicPath) return null;
  const abs = absoluteFromPublicPath(publicPath);
  if (!fs.existsSync(abs)) return null;

  const bytes = fs.readFileSync(abs);
  const lower = abs.toLowerCase();

  if (lower.endsWith(".png")) {
    return pdf.embedPng(bytes);
  }

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return pdf.embedJpg(bytes);
  }

  // webp is not supported by pdf-lib; skip gracefully
  return null;
}

export async function generateCertificatePdf(input: {
  certificate: Certificate;
  template: TemplateWithAssets;
}): Promise<{ pdfPath: string; certificateHash: string }> {
  ensureUploadDirs();

  const { certificate, template } = input;
  const pdf = await PDFDocument.create();
  // Avoid embedding mutable metadata timestamps that change on regenerate
  pdf.setTitle(certificate.title);
  pdf.setAuthor(certificate.issuer);
  pdf.setProducer("CertChain");
  pdf.setCreator("CertChain");
  pdf.setCreationDate(new Date("2026-01-01T00:00:00.000Z"));
  pdf.setModificationDate(new Date("2026-01-01T00:00:00.000Z"));

  const background = await embedImage(pdf, template.backgroundImage);
  const pageWidth = background?.width ?? 842;
  const pageHeight = background?.height ?? 595;
  const page = pdf.addPage([pageWidth, pageHeight]);

  if (background) {
    page.drawImage(background, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  } else {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(0.97, 0.98, 1),
    });
  }

  const logo = await embedImage(pdf, template.logo);
  if (logo) {
    const logoHeight = pageHeight * 0.12;
    const scale = logoHeight / logo.height;
    const logoWidth = logo.width * scale;
    page.drawImage(logo, {
      x: (pageWidth - logoWidth) / 2,
      y: pageHeight * 0.78,
      width: logoWidth,
      height: logoHeight,
    });
  }

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const titleSize = Math.min(28, pageWidth * 0.035);
  const nameSize = Math.min(36, pageWidth * 0.045);
  const bodySize = Math.min(14, pageWidth * 0.018);

  const centerText = (
    text: string,
    y: number,
    size: number,
    bold = false
  ) => {
    const used = bold ? fontBold : font;
    const width = used.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (pageWidth - width) / 2,
      y,
      size,
      font: used,
      color: rgb(0.07, 0.09, 0.15),
    });
  };

  centerText(certificate.title, pageHeight * 0.68, titleSize, true);
  centerText("This certifies that", pageHeight * 0.58, bodySize);
  centerText(certificate.recipientName, pageHeight * 0.5, nameSize, true);
  centerText(
    `Certificate ID: ${certificate.certificateId}`,
    pageHeight * 0.42,
    bodySize
  );
  centerText(
    `Issued on ${formatDate(certificate.issueDate)} by ${certificate.issuer}`,
    pageHeight * 0.36,
    bodySize
  );

  const signature = await embedImage(pdf, template.signature);
  if (signature) {
    const height = pageHeight * 0.1;
    const scale = height / signature.height;
    const width = signature.width * scale;
    page.drawImage(signature, {
      x: pageWidth * 0.18,
      y: pageHeight * 0.12,
      width,
      height,
    });
  }

  const stamp = await embedImage(pdf, template.stamp);
  if (stamp) {
    const height = pageHeight * 0.14;
    const scale = height / stamp.height;
    const width = stamp.width * scale;
    page.drawImage(stamp, {
      x: pageWidth * 0.72 - width / 2,
      y: pageHeight * 0.1,
      width,
      height,
    });
  }

  const qrPng = await generateQrPng(certificate.certificateId);
  const qrImage = await pdf.embedPng(qrPng);
  const qrSize = Math.min(pageWidth, pageHeight) * 0.12;
  page.drawImage(qrImage, {
    x: pageWidth - qrSize - pageWidth * 0.04,
    y: pageHeight - qrSize - pageHeight * 0.04,
    width: qrSize,
    height: qrSize,
  });

  const pdfBytes = await pdf.save({ useObjectStreams: false });
  const fileName = `${certificate.certificateId.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;
  const absPath = path.join(CERTIFICATE_UPLOAD_DIR, fileName);
  fs.writeFileSync(absPath, pdfBytes);

  const certificateHash = sha256File(absPath);
  const pdfPath = toPublicUploadPath(absPath);

  return { pdfPath, certificateHash };
}
