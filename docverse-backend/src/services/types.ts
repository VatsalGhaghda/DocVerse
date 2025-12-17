export type OfficeFormat = "word" | "excel" | "powerpoint";

export type PdfToOfficeFormat = "word" | "excel" | "powerpoint";

export interface ConversionResult {
  pdfBytes: Buffer;
  outputFilename: string;
  engine: "adobe" | "libreoffice";
}

export interface PdfToOfficeResult {
  outputBytes: Buffer;
  outputFilename: string;
  engine: "adobe" | "libreoffice";
  contentType: string;
}
