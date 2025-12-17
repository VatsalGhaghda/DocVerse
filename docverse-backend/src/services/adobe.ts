import fs from "fs";
import os from "os";
import path from "path";
import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  OCRJob,
  OCRResult,
  OCRParams,
  OCRSupportedLocale,
  OCRSupportedType,
} from "@adobe/pdfservices-node-sdk";
import { safeDestroyStream, streamToBuffer } from "./utils";

export const isAdobeEnabled = (): boolean => {
  return (
    process.env.ADOBE_PDF_SERVICES_ENABLED === "true" &&
    !!process.env.ADOBE_CLIENT_ID &&
    !!process.env.ADOBE_CLIENT_SECRET
  );
};

export const ocrWithAdobe = async (pdfBytes: Buffer, uiLanguage: string): Promise<Buffer> => {
  if (!isAdobeEnabled()) {
    throw new Error("Adobe PDF Services is not enabled");
  }

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "docverse-adobe-ocr-"));
  const inputPath = path.join(tempDir, "input.pdf");
  await fs.promises.writeFile(inputPath, pdfBytes);

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

    const localeMap: Record<string, string[]> = {
      en: ["EN_US"],
      es: ["ES_ES", "ES_MX"],
      fr: ["FR_FR"],
      de: ["DE_DE"],
      it: ["IT_IT"],
      pt: ["PT_BR", "PT_PT"],
      zh: ["ZH_CN", "ZH_TW"],
      ja: ["JA_JP"],
      ko: ["KO_KR"],
      ar: ["AR_SA"],
    };

    const localeEnum = OCRSupportedLocale as any;
    const supportedTypeEnum = OCRSupportedType as any;

    let ocrLocale: any | undefined;
    for (const candidate of localeMap[uiLanguage] || []) {
      if (localeEnum && localeEnum[candidate]) {
        ocrLocale = localeEnum[candidate];
        break;
      }
    }

    const ocrType =
      (supportedTypeEnum && supportedTypeEnum.SEARCHABLE_IMAGE_EXACT) ||
      (supportedTypeEnum && supportedTypeEnum.SEARCHABLE_IMAGE) ||
      undefined;

    const params =
      ocrLocale || ocrType
        ? new (OCRParams as any)({
            ...(ocrLocale ? { ocrLocale } : {}),
            ...(ocrType ? { ocrType } : {}),
          })
        : undefined;

    const job = params
      ? new (OCRJob as any)({ inputAsset, params })
      : new (OCRJob as any)({ inputAsset });

    const pollingURL: string = await anyPdfServices.submit({ job });
    const ocrResult = (await anyPdfServices.getJobResult({
      pollingURL,
      resultType: OCRResult as any,
    })) as any;

    const resultAsset = ocrResult.result.asset;

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
    safeDestroyStream(readStream);
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
    }
  }
};
