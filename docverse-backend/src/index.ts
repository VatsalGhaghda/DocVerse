import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();
const PORT = process.env.PORT || 4000;

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

app.post("/jobs/merge-pdf", (req: Request, res: Response) => {
  // Phase 1 stub: pretend we created a merge job
  const jobId = `job_merge_${Date.now()}`;

  res.status(202).json({
    status: "queued",
    jobId,
    tool: "merge-pdf",
    received: req.body ?? null,
    message: "Merge job accepted (stub). Real merging will be implemented in a later phase.",
  });
});

app.listen(PORT, () => {
  console.log(`DocVerse backend listening on port ${PORT}`);
});
