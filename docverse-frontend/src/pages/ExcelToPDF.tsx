import { useState, useEffect, useRef } from "react";
import { FileSpreadsheet, ArrowRight, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { FileUploadZone } from "@/components/FileUploadZone";
import { ToolProcessingState } from "@/components/ToolProcessingState";
import { xhrUploadForBlob, XhrUploadError } from "@/lib/xhrUpload";

export default function ExcelToPDF() {
  const [files, setFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadKind, setDownloadKind] = useState<"pdf" | "zip" | null>(null);
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
        formData.append("files", file, file.name ?? "spreadsheet.xlsx");
      }
    });

    try {
      const { blob, contentType } = await xhrUploadForBlob({
        url: `${apiBase}/convert/excel-to-pdf`,
        formData,
        onProgress: (p) => setProgress(p),
        progressStart: 8,
        progressCap: 92,
        progressTickMs: 100,
        progressTickAmount: 4,
      });

      const url = URL.createObjectURL(blob);
      const kind: "pdf" | "zip" = contentType.toLowerCase().includes("zip") ? "zip" : "pdf";
      setDownloadKind(kind);
      setDownloadUrl(url);
      setIsComplete(true);
    } catch (err) {
      console.error("Error converting Excel to PDF", err);
      if (err instanceof XhrUploadError) {
        setError(err.message);
      } else {
        setError("Something went wrong while converting your spreadsheet. Please try again.");
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
    const offset = window.scrollY + rect.top - 180;
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

  const fileCount = files.length;

  return (
    <ToolPageLayout
      title="Excel to PDF"
      description="Convert Excel spreadsheets (.xls, .xlsx) into polished PDFs for reports and sharing."
      icon={FileSpreadsheet}
      iconColor="secondary"
    >
      <div className="mx-auto max-w-3xl">
        {!isComplete ? (
          isProcessing ? (
            <ToolProcessingState
              containerRef={loadingRef}
              title="Converting to PDF..."
              progress={progress}
              error={error}
              color="secondary"
            />
          ) : (
            <>
              <div ref={uploadRef}>
                <FileUploadZone
                  key={uploadKey}
                  accept=".xls,.xlsx"
                  multiple
                  maxFiles={5}
                  variant="secondary"
                  iconType="excel"
                  horizontalScroll={false}
                  onFilesChange={setFiles}
                />
              </div>

              {files.length > 0 && (
                <div ref={previewRef} className="mt-8 space-y-6">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-2">Great for reports</h3>
                    <p className="text-sm text-muted-foreground">
                      Use this when you want to freeze the layout of dashboards or summary sheets before sending them.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <Button
                      size="lg"
                      className="btn-hero gradient-secondary"
                      onClick={handleProcess}
                      disabled={isProcessing || !allReady}
                    >
                      Convert {fileCount} Excel file{fileCount === 1 ? "" : "s"}
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
              Your Excel file{fileCount === 1 ? "" : "s"} ha
              {fileCount === 1 ? "s" : "ve"} been converted to PDF.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                className="btn-hero gradient-secondary"
                onClick={() => {
                  if (!downloadUrl) return;
                  const link = document.createElement("a");
                  link.href = downloadUrl;
                  if (downloadKind === "zip" || fileCount > 1) {
                    link.download = "converted-excel-pdfs.zip";
                  } else {
                    const baseName = (files[0]?.name || "spreadsheet").replace(/\.(xlsx?|XLSX?)$/, "");
                    link.download = `${baseName}.pdf`;
                  }
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                disabled={!downloadUrl}
              >
                <Download className="h-5 w-5 mr-2" />
                {downloadKind === "zip" || fileCount > 1 ? "Download PDFs (ZIP)" : "Download PDF"}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Convert more spreadsheets
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
