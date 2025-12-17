/// <reference types="multer" />
import fs from "fs";
import os from "os";
import path from "path";
import "multer";
import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  ExportPDFJob,
  ExportPDFParams,
  ExportPDFTargetFormat,
  ExportPDFResult,
} from "@adobe/pdfservices-node-sdk";
import { PdfToOfficeFormat, PdfToOfficeResult } from "./types";
import { execFileAsync, streamToBuffer } from "./utils";
import { isAdobeEnabled } from "./adobe";

const getPdfToOfficeMime = (format: PdfToOfficeFormat): string => {
  if (format === "word") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (format === "excel") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
};

const getPdfToOfficeExtension = (format: PdfToOfficeFormat): string => {
  if (format === "word") return "docx";
  if (format === "excel") return "xlsx";
  return "pptx";
};

const getPdfToOfficeTargetFormat = (format: PdfToOfficeFormat): any => {
  if (format === "word") return (ExportPDFTargetFormat as any).DOCX;
  if (format === "excel") return (ExportPDFTargetFormat as any).XLSX;
  return (ExportPDFTargetFormat as any).PPTX;
};

export const convertPdfToOfficeWithAdobe = async (
  format: PdfToOfficeFormat,
  file: Express.Multer.File
): Promise<PdfToOfficeResult> => {
  if (!isAdobeEnabled()) {
    throw new Error("Adobe PDF Services is not enabled");
  }

  const originalName = file.originalname || "document.pdf";
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  const ext = getPdfToOfficeExtension(format);
  const outputFilename = `${base}.${ext}`;

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "docverse-adobe-export-"));
  const inputPath = path.join(tempDir, originalName);
  await fs.promises.writeFile(inputPath, file.buffer);

  let readStream: fs.ReadStream | undefined;
  try {
    const clientId = process.env.ADOBE_CLIENT_ID;
    const clientSecret = process.env.ADOBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Adobe client credentials are not configured");
    }

    const credentials = new ServicePrincipalCredentials({ clientId, clientSecret });
    const pdfServices = new PDFServices({ credentials });
    const anyPdfServices = pdfServices as any;

    readStream = fs.createReadStream(inputPath);
    const inputAsset = await anyPdfServices.upload({
      readStream,
      mimeType: (MimeType as any).PDF,
    });

    const params = new (ExportPDFParams as any)({
      targetFormat: getPdfToOfficeTargetFormat(format),
    });

    const job = new (ExportPDFJob as any)({ inputAsset, params });

    const pollingURL: string = await anyPdfServices.submit({ job });
    const result = (await anyPdfServices.getJobResult({
      pollingURL,
      resultType: ExportPDFResult as any,
    })) as any;

    const resultAsset = result.result.asset;

    if (typeof anyPdfServices.getContent === "function") {
      const streamAsset = await anyPdfServices.getContent({ asset: resultAsset });
      const outputBytes = await streamToBuffer(streamAsset.readStream);
      return {
        outputBytes,
        outputFilename,
        engine: "adobe",
        contentType: getPdfToOfficeMime(format),
      };
    }

    const resultStream: AsyncIterable<Buffer | string> = await anyPdfServices.download({
      asset: resultAsset,
    });
    const chunks: Buffer[] = [];
    for await (const chunk of resultStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return {
      outputBytes: Buffer.concat(chunks),
      outputFilename,
      engine: "adobe",
      contentType: getPdfToOfficeMime(format),
    };
  } finally {
    try {
      readStream?.destroy();
    } catch {
    }
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
    }
  }
};

export const convertPdfToOfficeWithLibreOffice = async (
  format: PdfToOfficeFormat,
  file: Express.Multer.File
): Promise<PdfToOfficeResult> => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "docverse-pdf-to-office-"));

  const originalName = file.originalname || "document.pdf";
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  const inputPath = path.join(tempDir, originalName);

  await fs.promises.writeFile(inputPath, file.buffer);

  const outputExt = getPdfToOfficeExtension(format);

  try {
    await execFileAsync("soffice", [
      "--headless",
      "--convert-to",
      outputExt,
      "--outdir",
      tempDir,
      inputPath,
    ]);

    const outputPath = path.join(tempDir, `${base}.${outputExt}`);
    const outputBytes = await fs.promises.readFile(outputPath);

    return {
      outputBytes,
      outputFilename: `${base}.${outputExt}`,
      engine: "libreoffice",
      contentType: getPdfToOfficeMime(format),
    };
  } finally {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
    }
  }
};

export const convertPdfToOffice = async (
  format: PdfToOfficeFormat,
  file: Express.Multer.File
): Promise<PdfToOfficeResult> => {
  const useAdobeAsPrimary = process.env.USE_ADOBE_AS_PRIMARY === "true";

  if (useAdobeAsPrimary && isAdobeEnabled()) {
    try {
      return await convertPdfToOfficeWithAdobe(format, file);
    } catch (error) {
      console.error("Adobe PDF Services PDF export failed", error);
      return convertPdfToOfficeWithLibreOffice(format, file);
    }
  }

  return convertPdfToOfficeWithLibreOffice(format, file);
};
