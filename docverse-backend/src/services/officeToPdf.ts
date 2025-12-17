/// <reference types="multer" />
import fs from "fs";
import os from "os";
import path from "path";
import "multer";
import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  CreatePDFJob,
  CreatePDFResult,
} from "@adobe/pdfservices-node-sdk";
import { ConversionResult, OfficeFormat } from "./types";
import { execFileAsync, streamToBuffer } from "./utils";
import { isAdobeEnabled } from "./adobe";

const getDefaultOriginalName = (format: OfficeFormat): string => {
  if (format === "excel") return "spreadsheet.xlsx";
  if (format === "powerpoint") return "presentation.pptx";
  return "document.docx";
};

export const convertOfficeToPdfWithAdobe = async (
  format: OfficeFormat,
  file: Express.Multer.File
): Promise<ConversionResult> => {
  if (!isAdobeEnabled()) {
    throw new Error("Adobe PDF Services is not enabled");
  }

  const originalName = file.originalname || getDefaultOriginalName(format);
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "docverse-adobe-"));
  const inputPath = path.join(tempDir, originalName);
  await fs.promises.writeFile(inputPath, file.buffer);

  try {
    const clientId = process.env.ADOBE_CLIENT_ID;
    const clientSecret = process.env.ADOBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Adobe client credentials are not configured");
    }

    const credentials = new ServicePrincipalCredentials({
      clientId,
      clientSecret,
    });

    const pdfServices = new PDFServices({ credentials });

    const ext = path.extname(originalName).toLowerCase();
    let mimeType: MimeType;
    if (ext === ".doc" || ext === ".docx") {
      mimeType = MimeType.DOCX;
    } else if (ext === ".xls" || ext === ".xlsx") {
      mimeType = MimeType.XLSX;
    } else if (ext === ".ppt" || ext === ".pptx") {
      mimeType = MimeType.PPTX;
    } else {
      mimeType = MimeType.DOCX;
    }

    const readStream = fs.createReadStream(inputPath);

    const anyPdfServices = pdfServices as any;

    const inputAsset = await anyPdfServices.upload({ readStream, mimeType });

    const createPDFJob = new (CreatePDFJob as any)({ inputAsset });

    const pollingURL: string = await anyPdfServices.submit({ job: createPDFJob });
    const pdfResult = (await anyPdfServices.getJobResult({
      pollingURL,
      resultType: CreatePDFResult as any,
    })) as any;

    const resultAsset = pdfResult.result.asset;

    if (typeof anyPdfServices.getContent === "function") {
      const streamAsset = await anyPdfServices.getContent({ asset: resultAsset });
      const pdfBytes = await streamToBuffer(streamAsset.readStream);

      return {
        pdfBytes,
        outputFilename: `${base}.pdf`,
        engine: "adobe",
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
      pdfBytes: Buffer.concat(chunks),
      outputFilename: `${base}.pdf`,
      engine: "adobe",
    };
  } finally {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
    }
  }
};

export const convertOfficeToPdfWithLibreOffice = async (
  format: OfficeFormat,
  file: Express.Multer.File
): Promise<ConversionResult> => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "docverse-office-"));

  const originalName = file.originalname || getDefaultOriginalName(format);
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  const inputPath = path.join(tempDir, originalName);

  await fs.promises.writeFile(inputPath, file.buffer);

  try {
    await execFileAsync("soffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      tempDir,
      inputPath,
    ]);

    const outputPath = path.join(tempDir, `${base}.pdf`);
    const pdfBytes = await fs.promises.readFile(outputPath);

    return {
      pdfBytes,
      outputFilename: `${base}.pdf`,
      engine: "libreoffice",
    };
  } finally {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
    }
  }
};

export const convertOfficeToPdf = async (
  format: OfficeFormat,
  file: Express.Multer.File
): Promise<ConversionResult> => {
  const useAdobeAsPrimary = process.env.USE_ADOBE_AS_PRIMARY === "true";

  if (useAdobeAsPrimary && isAdobeEnabled()) {
    try {
      return await convertOfficeToPdfWithAdobe(format, file);
    } catch (error) {
      console.error("Adobe PDF Services conversion failed", error);
      return convertOfficeToPdfWithLibreOffice(format, file);
    }
  }

  return convertOfficeToPdfWithLibreOffice(format, file);
};
