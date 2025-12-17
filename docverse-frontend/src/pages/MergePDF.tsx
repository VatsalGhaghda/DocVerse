import { useState, useEffect, useRef } from "react";
import { FileStack, ArrowRight, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { FileUploadZone } from "@/components/FileUploadZone";
import { ToolProcessingState } from "@/components/ToolProcessingState";
import { xhrUploadForBlob, XhrUploadError } from "@/lib/xhrUpload";

export default function MergePDF() {
  const [files, setFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const uploadRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const completeRef = useRef<HTMLDivElement | null>(null);

  const handleProcess = async () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();

      files.slice(0, 5).forEach((file: any) => {
        if (file.file) {
          formData.append("files", file.file, file.name ?? "file.pdf");
        }
      });

      const { blob } = await xhrUploadForBlob({
        url: `${apiBase}/merge-pdf`,
        formData,
        onProgress: (p) => setProgress(p),
        progressStart: 0,
        progressCap: 92,
        progressTickMs: 120,
        progressTickAmount: 5,
      });

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setIsComplete(true);
    } catch (err: any) {
      console.error("Error merging PDFs", err);
      if (err instanceof XhrUploadError) {
        setError(err.message);
      } else {
        setError("Something went wrong while starting the merge. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setIsComplete(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setUploadKey((prev) => prev + 1);
    // Scroll back to top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "merged.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Only allow merge when at least 2 files are selected and all are marked as complete ("Ready").
  const allReady =
    files.length >= 2 && files.every((file: any) => file.status === "complete");

  // When merging (loader visible), center loader in viewport
  useEffect(() => {
    if (isProcessing && !isComplete && loadingRef.current) {
      const rect = loadingRef.current.getBoundingClientRect();
      const offset = window.scrollY + rect.top - 180; // 180px padding from top
      window.scrollTo({ top: Math.max(offset, 0), behavior: "smooth" });
    }
  }, [isProcessing, isComplete]);

  // No additional scroll on completion; keep the page where the loader was

  // Auto-scroll to merge action section once there are enough files
  useEffect(() => {
    if (files.length >= 2 && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [files.length]);

  return (
    <ToolPageLayout
      title="Merge PDF"
      description="Combine multiple PDF files into a single document. Drag to reorder pages before merging."
      icon={FileStack}
      iconColor="primary"
    >
      <div className="mx-auto max-w-3xl">
        {!isComplete ? (
          isProcessing ? (
            <ToolProcessingState
              containerRef={loadingRef}
              title="Merging PDFs..."
              progress={progress}
              error={error}
              color="primary"
            />
          ) : (
            <>
              <div ref={uploadRef}>
                <FileUploadZone
                  key={uploadKey}
                  accept=".pdf"
                  multiple
                  maxFiles={10}
                  horizontalScroll={false}
                  onFilesChange={setFiles}
                />
              </div>

              {error && (
                <p className="mt-4 text-sm text-destructive text-center">{error}</p>
              )}

              {files.length >= 2 && (
                <div ref={previewRef} className="mt-8 flex flex-col items-center gap-4">
                  <Button
                    size="lg"
                    className="btn-hero gradient-primary shadow-primary"
                    onClick={handleProcess}
                    disabled={isProcessing || !allReady}
                  >
                    Merge {files.length} PDFs
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear all files
                  </Button>
                </div>
              )}
            </>
          )
        ) : (
          <div ref={completeRef} className="text-center py-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10">
              <FileStack className="h-10 w-10 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Merge Complete!</h2>
            <p className="text-muted-foreground mb-8">
              Your PDF files have been successfully merged.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                className="btn-hero gradient-secondary hover:brightness-110 transition"
                onClick={handleDownload}
                disabled={!downloadUrl}
              >
                <Download className="h-5 w-5 mr-2" />
                Download Merged PDF
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Merge more files
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
