/// <reference types="multer" />
import fs from "fs";
import os from "os";
import path from "path";
import "multer";
import { PDFDocument } from "pdf-lib";
import { execFileAsync } from "./utils";

export const ocrSearchablePdfWithTesseract = async (
  files: Express.Multer.File[],
  uiLanguage: string
): Promise<Buffer> => {
  const tesseractLangMap: Record<string, string> = {
    en: "eng",
    es: "spa",
    fr: "fra",
    de: "deu",
    it: "ita",
    pt: "por",
    zh: "chi_sim",
    ja: "jpn",
    ko: "kor",
    ar: "ara",
  };
  const language = tesseractLangMap[uiLanguage] || "eng";

  const safeRemovePath = async (targetPath: string) => {
    try {
      const stat = await fs.promises.stat(targetPath);
      if (stat.isDirectory()) {
        await fs.promises.rm(targetPath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(targetPath);
      }
    } catch {
    }
  };

  const convertPdfToJpegPages = async (pdfPath: string): Promise<string[]> => {
    const outputBase = pdfPath.replace(/\.[^.]+$/, "");
    const args = ["-jpeg", "-r", "120", pdfPath, outputBase];
    await execFileAsync("pdftoppm", args);

    const jpgPaths: string[] = [];
    let pageIndex = 1;
    while (true) {
      const candidate = `${outputBase}-${pageIndex}.jpg`;
      try {
        await fs.promises.access(candidate, fs.constants.F_OK);
        jpgPaths.push(candidate);
        pageIndex++;
      } catch {
        break;
      }
    }
    return jpgPaths;
  };

  const perPagePdfPaths: string[] = [];
  const tempRoots: string[] = [];

  try {
    for (const [index, file] of files.entries()) {
      const originalName = file.originalname || `file-${index + 1}`;
      const lowerName = originalName.toLowerCase();
      const isPdf = file.mimetype === "application/pdf" || lowerName.endsWith(".pdf");

      let tempRootDir: string | null = null;

      try {
        if (isPdf) {
          tempRootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "docverse-ocrsp-pdf-"));
          const pdfPath = path.join(tempRootDir, "input.pdf");
          await fs.promises.writeFile(pdfPath, file.buffer);

          const jpgPaths = await convertPdfToJpegPages(pdfPath);
          for (const jpgPath of jpgPaths) {
            const outputBase = jpgPath.replace(/\.[^.]+$/, "-ocrsp");
            const args = [jpgPath, outputBase, "-l", language, "pdf"];
            await execFileAsync("tesseract", args);
            const pagePdfPath = `${outputBase}.pdf`;
            perPagePdfPaths.push(pagePdfPath);
          }
        } else {
          const extMatch = lowerName.match(/\.([a-z0-9]+)$/);
          const ext = extMatch ? extMatch[1] : "png";
          tempRootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "docverse-ocrsp-img-"));
          const imgPath = path.join(tempRootDir, `input.${ext}`);
          await fs.promises.writeFile(imgPath, file.buffer);

          const outputBase = imgPath.replace(/\.[^.]+$/, "-ocrsp");
          const args = [imgPath, outputBase, "-l", language, "pdf"];
          await execFileAsync("tesseract", args);
          const imgPdfPath = `${outputBase}.pdf`;
          perPagePdfPaths.push(imgPdfPath);
        }

        if (tempRootDir) {
          tempRoots.push(tempRootDir);
        }
      } catch (fileErr) {
        console.error("Error processing file for searchable PDF OCR", originalName, fileErr);
        if (tempRootDir) {
          tempRoots.push(tempRootDir);
        }
      }
    }

    if (perPagePdfPaths.length === 0) {
      throw new Error(
        "Failed to generate searchable PDF. Please ensure Tesseract and pdftoppm are installed and try again."
      );
    }

    const finalDoc = await PDFDocument.create();

    for (const pagePdfPath of perPagePdfPaths) {
      try {
        const pdfBytes = await fs.promises.readFile(pagePdfPath);
        const srcDoc = await PDFDocument.load(pdfBytes);
        const srcPages = await finalDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        for (const p of srcPages) {
          finalDoc.addPage(p);
        }
      } catch (mergeErr) {
        console.error("Error merging OCR PDF page", pagePdfPath, mergeErr);
      }
    }

    const finalBytes = await finalDoc.save();

    for (const tmpRoot of tempRoots) {
      await safeRemovePath(tmpRoot);
    }

    return Buffer.from(finalBytes);
  } catch (err) {
    for (const tmpRoot of tempRoots) {
      await safeRemovePath(tmpRoot);
    }
    throw err;
  }
};
