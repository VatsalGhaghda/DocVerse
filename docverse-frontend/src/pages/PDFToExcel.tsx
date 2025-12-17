import { useState, useEffect, useRef } from "react";
import { FileSpreadsheet, ArrowRight, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { FileUploadZone } from "@/components/FileUploadZone";
import { ToolProcessingState } from "@/components/ToolProcessingState";
import { xhrUploadForBlob, XhrUploadError } from "@/lib/xhrUpload";

export default function PDFToExcel() {
  const [files, setFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadKind, setDownloadKind] = useState<"single" | "zip" | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const uploadRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  const allReady = files.length >= 1 && files.every((f: any) => f.status === "complete");

  const handleProcess = async () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

    if (!allReady || files.length === 0) return;

    setIsProcessing(true);
    setIsComplete(false);
    setError(null);
    setProgress(8);

    const formData = new FormData();
    files.forEach((item: any) => {
      const file = item.file as File | undefined;
      if (file) {
        formData.append("files", file, file.name ?? "document.pdf");
      }
    });

    try {
      const { blob, contentType } = await xhrUploadForBlob({
        url: `${apiBase}/convert/pdf-to-excel`,
        formData,
        onProgress: (p) => setProgress(p),
        progressStart: 8,
        progressCap: 92,
        progressTickMs: 100,
        progressTickAmount: 4,
      });

      const url = URL.createObjectURL(blob);
      const kind: "single" | "zip" = contentType.toLowerCase().includes("zip") ? "zip" : "single";
      setDownloadKind(kind);
      setDownloadUrl(url);
      setIsComplete(true);
    } catch (err) {
      console.error("Error converting PDF to Excel", err);
      if (err instanceof XhrUploadError) {
        setError(err.message);
      } else {
        setError("Something went wrong while converting your PDF. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setIsComplete(false);
    setError(null);
    setDownloadKind(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setUploadKey((prev) => prev + 1);
    setProgress(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!files.length || !uploadRef.current) return;
    const rect = uploadRef.current.getBoundingClientRect();
    const offset = window.scrollY + rect.top + 50;
    window.scrollTo({ top: Math.max(offset, 0), behavior: "smooth" });
  }, [files.length]);

  useEffect(() => {
    if (!allReady || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const offset = window.scrollY + rect.top - 80;
    window.scrollTo({ top: Math.max(offset, 0), behavior: "smooth" });
  }, [allReady]);

  useEffect(() => {
    if (isProcessing && !isComplete && loadingRef.current) {
      const rect = loadingRef.current.getBoundingClientRect();
      const offset = window.scrollY + rect.top - 120;
      window.scrollTo({ top: Math.max(offset, 0), behavior: "smooth" });
    }
  }, [isProcessing, isComplete]);

  return (
    <ToolPageLayout
      title="PDF to Excel"
      description="Extract tables and data from PDFs directly into Excel (.xlsx) spreadsheets."
      icon={FileSpreadsheet}
      iconColor="secondary"
    >
      <div className="mx-auto max-w-3xl">
        {!isComplete ? (
          isProcessing ? (
            <ToolProcessingState
              containerRef={loadingRef}
              title="Converting to Excel..."
              progress={progress}
              error={error}
              color="secondary"
            />
          ) : (
            <>
              <div ref={uploadRef}>
                <FileUploadZone
                  key={uploadKey}
                  accept=".pdf"
                  multiple
                  maxFiles={10}
                  maxTotalPages={50}
                  totalPageLimitErrorMessage="PDF to Excel supports up to 50 pages total per conversion request."
                  variant="secondary"
                  iconType="excel"
                  horizontalScroll={false}
                  onFilesChange={setFiles}
                />
              </div>

              {files.length > 0 && (
                <div ref={previewRef} className="mt-8 space-y-6">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-2">Best for tabular data</h3>
                    <p className="text-sm text-muted-foreground">
                      This tool works best with PDFs that contain clearly defined tables. Very complex layouts might need
                      manual clean-up in Excel.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <Button
                      size="lg"
                      className="btn-hero gradient-secondary"
                      onClick={handleProcess}
                      disabled={isProcessing || !allReady}
                    >
                      Convert {files.length} PDF{files.length === 1 ? "" : "s"} to Excel
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start over
                    </Button>
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10">
              <FileSpreadsheet className="h-10 w-10 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Conversion Complete!</h2>
            <p className="text-muted-foreground mb-8">
              Your PDF file{files.length === 1 ? "" : "s"} ha
              {files.length === 1 ? "s" : "ve"} been converted to Excel.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                className="btn-hero gradient-secondary"
                onClick={() => {
                  if (!downloadUrl) return;
                  const link = document.createElement("a");
                  link.href = downloadUrl;
                  if (downloadKind === "zip" || files.length > 1) {
                    link.download = "converted-excel-sheets.zip";
                  } else {
                    const baseName = (files[0]?.name || "document").replace(/\.pdf$/i, "");
                    link.download = `${baseName}.xlsx`;
                  }
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                disabled={!downloadUrl}
              >
                <Download className="h-5 w-5 mr-2" />
                {downloadKind === "zip" || files.length > 1
                  ? "Download Excel Files (ZIP)"
                  : "Download Excel File"}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Convert more PDFs
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
