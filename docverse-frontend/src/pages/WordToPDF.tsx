import { useState, useEffect, useRef } from "react";
import { FileText, ArrowRight, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { FileUploadZone } from "@/components/FileUploadZone";
import { ToolProcessingState } from "@/components/ToolProcessingState";
import { ToolSuccessState } from "@/components/ToolSuccessState";
import { xhrUploadForBlob, XhrUploadError } from "@/lib/xhrUpload";

export default function WordToPDF() {
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
        formData.append("files", file, file.name ?? "document.docx");
      }
    });

    try {
      const { blob, contentType } = await xhrUploadForBlob({
        url: `${apiBase}/convert/word-to-pdf`,
        formData,
        onProgress: (p) => setProgress(p),
      });

      const url = URL.createObjectURL(blob);
      const kind: "pdf" | "zip" = contentType.toLowerCase().includes("zip") ? "zip" : "pdf";
      setDownloadKind(kind);
      setDownloadUrl(url);
      setIsComplete(true);
    } catch (err) {
      console.error("Error converting Word to PDF", err);
      if (err instanceof XhrUploadError) {
        setError(err.message);
      } else {
        setError("Something went wrong while converting your document. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setIsComplete(false);
    setDownloadKind(null);
    setError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setUploadKey((prev) => prev + 1);
    setProgress(0);
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
      title="Word to PDF"
      description="Convert Word documents (.doc, .docx) into shareable, print-ready PDFs."
      icon={FileText}
      iconColor="primary"
    >
      <div className="mx-auto max-w-3xl">
        {!isComplete ? (
          isProcessing ? (
            <ToolProcessingState
              containerRef={loadingRef}
              title="Converting to PDF..."
              progress={progress}
              error={error}
              color="primary"
            />
          ) : (
            <>
              <div ref={uploadRef}>
                <FileUploadZone
                  key={uploadKey}
                  accept=".doc,.docx"
                  multiple
                  maxFiles={5}
                  variant="primary"
                  iconType="word"
                  horizontalScroll={false}
                  onFilesChange={setFiles}
                />
              </div>

              {files.length > 0 && (
                <div ref={previewRef} className="mt-8 space-y-6">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-2">Preserve formatting</h3>
                    <p className="text-sm text-muted-foreground">
                      Use this tool when you need to lock in the layout of your Word documents for sharing or printing.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <Button
                      size="lg"
                      className="btn-hero gradient-primary shadow-primary"
                      onClick={handleProcess}
                      disabled={isProcessing || !allReady}
                    >
                      Convert {fileCount} Word file{fileCount === 1 ? "" : "s"}
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
          <ToolSuccessState
            icon={FileText}
            iconColor="primary"
            title="Conversion Complete!"
            description={`Your Word file${fileCount === 1 ? "" : "s"} ${fileCount === 1 ? "has" : "have"} been converted to PDF.`}
            downloadLabel={downloadKind === "zip" || fileCount > 1 ? "Download PDFs (ZIP)" : "Download PDF"}
            disabledDownload={!downloadUrl}
            onDownload={() => {
              if (!downloadUrl) return;
              const link = document.createElement("a");
              link.href = downloadUrl;
              if (downloadKind === "zip" || fileCount > 1) {
                link.download = "converted-word-pdfs.zip";
              } else {
                const baseName = (files[0]?.name || "document").replace(/\.(docx?|DOCX?)$/, "");
                link.download = `${baseName}.pdf`;
              }
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            secondaryLabel="Convert more documents"
            onSecondary={handleReset}
          />
        )}
      </div>
    </ToolPageLayout>
  );
}
