/// <reference types="multer" />
import fs from "fs";
import os from "os";
import path from "path";
import "multer";
import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  CompressPDFJob,
  CompressPDFResult,
} from "@adobe/pdfservices-node-sdk";
import { execFileAsync, streamToBuffer } from "./utils";
import { isAdobeEnabled } from "./adobe";

const compressWithGhostscript = async (
  inputBuffer: Buffer,
  opts: { pdfSettings: string; dpi: number }
): Promise<Buffer> => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "docverse-compress-"));
  const inputPath = path.join(tmpDir, "input.pdf");
  const outputPath = path.join(tmpDir, "output.pdf");

  try {
    fs.writeFileSync(inputPath, inputBuffer);

    const isWindows = process.platform === "win32";
    const gsPath = process.env.GS_PATH || (isWindows ? "gswin64c" : "gs");

    const args = [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      `-dPDFSETTINGS=${opts.pdfSettings}`,
      // Image downsampling tuned by effective DPI derived from quality slider
      "-dDownsampleColorImages=true",
      "-dColorImageDownsampleType=/Bicubic",
      `-dColorImageResolution=${opts.dpi}`,
      "-dDownsampleGrayImages=true",
      "-dGrayImageDownsampleType=/Bicubic",
      `-dGrayImageResolution=${opts.dpi}`,
      "-dDownsampleMonoImages=true",
      "-dMonoImageDownsampleType=/Subsample",
      `-dMonoImageResolution=${opts.dpi}`,
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      `-sOutputFile=${outputPath}`,
      inputPath,
    ];

    await execFileAsync(gsPath, args);

    const compressed = fs.readFileSync(outputPath);
    return compressed;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
    }
  }
};

const compressWithAdobe = async (file: Express.Multer.File): Promise<Buffer> => {
  if (!isAdobeEnabled()) {
    throw new Error("Adobe PDF Services is not enabled");
  }

  const originalName = file.originalname || "document.pdf";

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "docverse-adobe-compress-"));
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

    const job = new (CompressPDFJob as any)({ inputAsset });

    const pollingURL: string = await anyPdfServices.submit({ job });
    const pdfResult = (await anyPdfServices.getJobResult({
      pollingURL,
      resultType: CompressPDFResult as any,
    })) as any;

    const resultAsset = pdfResult.result.asset;

    if (typeof anyPdfServices.getContent === "function") {
      const streamAsset = await anyPdfServices.getContent({ asset: resultAsset });
      return await streamToBuffer(streamAsset.readStream);
    }

    const resultStream: AsyncIterable<Buffer | string> = await anyPdfServices.download({
      asset: resultAsset,
    });

    const chunks: Buffer[] = [];
    for await (const chunk of resultStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
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

export const compressPdfFile = async (
  file: Express.Multer.File,
  opts: { pdfSettings: string; dpi: number }
): Promise<{ bytes: Buffer; engine: "adobe" | "ghostscript" }> => {
  const useAdobeAsPrimary = process.env.USE_ADOBE_AS_PRIMARY === "true";

  if (useAdobeAsPrimary && isAdobeEnabled()) {
    try {
      const adobeBytes = await compressWithAdobe(file);
      const chosenBytes = adobeBytes.length >= file.buffer.length ? file.buffer : adobeBytes;
      return { bytes: chosenBytes, engine: "adobe" };
    } catch (error) {
      console.error("Adobe PDF Services compression failed", error);
      const gsBytes = await compressWithGhostscript(file.buffer, opts);
      const chosenBytes = gsBytes.length >= file.buffer.length ? file.buffer : gsBytes;
      return { bytes: chosenBytes, engine: "ghostscript" };
    }
  }

  const gsBytes = await compressWithGhostscript(file.buffer, opts);
  const chosenBytes = gsBytes.length >= file.buffer.length ? file.buffer : gsBytes;
  return { bytes: chosenBytes, engine: "ghostscript" };
};
