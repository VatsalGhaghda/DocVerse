import { useState } from "react";
import { FileStack, ArrowRight, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { FileUploadZone } from "@/components/FileUploadZone";

export default function MergePDF() {
  const [files, setFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/jobs/merge-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileCount: files.length,
          // In later phases this will contain uploaded file IDs / locations
          filenames: files.map((f) => f.name ?? "unknown"),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Merge job response", data);
      setIsComplete(true);
    } catch (err: any) {
      console.error("Error creating merge job", err);
      setError("Something went wrong while starting the merge. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setIsComplete(false);
  };

  return (
    <ToolPageLayout
      title="Merge PDF"
      description="Combine multiple PDF files into a single document. Drag to reorder pages before merging."
      icon={FileStack}
      iconColor="primary"
    >
      <div className="mx-auto max-w-3xl">
        {!isComplete ? (
          <>
            <FileUploadZone
              accept=".pdf"
              multiple
              maxFiles={20}
              onFilesChange={setFiles}
            />

            {error && (
              <p className="mt-4 text-sm text-destructive text-center">{error}</p>
            )}

            {files.length >= 2 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <Button
                  size="lg"
                  className="btn-hero gradient-primary shadow-primary"
                  onClick={handleProcess}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Merge {files.length} PDFs
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear all files
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10">
              <FileStack className="h-10 w-10 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Merge Complete!</h2>
            <p className="text-muted-foreground mb-8">
              Your PDF files have been successfully merged.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Button size="lg" className="btn-hero gradient-secondary">
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
