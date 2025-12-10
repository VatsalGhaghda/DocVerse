import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import { PDFDocument } from "pdf-lib";

const app = express();
const PORT = process.env.PORT || 4000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file (frontend also enforces this)
    files: 5,
  },
});

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "docverse-backend",
    message: "DocVerse backend is running. Use /health for health checks and /upload for uploads.",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "docverse-backend" });
});

app.post("/upload", (req: Request, res: Response) => {
  // TODO: Wire this to real file handling / job queue in later phases
  res.json({
    status: "accepted",
    message: "Upload endpoint stub. Implement storage & processing in later phases.",
    bodyExample: req.body,
  });
});

app.post("/merge-pdf", upload.array("files", 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length < 2) {
      return res.status(400).json({
        status: "error",
        message: "Please upload at least 2 PDF files to merge.",
      });
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotal = 100 * 1024 * 1024; // 100MB total

    if (totalSize > maxTotal) {
      return res.status(413).json({
        status: "error",
        message: "Total size of uploaded files exceeds 100MB.",
      });
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const pdf = await PDFDocument.load(file.buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();

    res
      .status(200)
      .contentType("application/pdf")
      .setHeader("Content-Disposition", "attachment; filename=merged.pdf")
      .send(Buffer.from(mergedBytes));
  } catch (error) {
    console.error("Error merging PDFs", error);
    res.status(500).json({
      status: "error",
      message: "Failed to merge PDFs. Please try again.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`DocVerse backend listening on port ${PORT}`);
});
