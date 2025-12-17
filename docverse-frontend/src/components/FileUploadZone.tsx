import { useState, useCallback, useEffect } from "react";
import { Upload, X, FileText, GripVertical, Plus, FileSpreadsheet, Presentation } from "lucide-react";
import { PdfThumbnail } from "@/components/PdfThumbnail";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToolTheme } from "@/components/ToolPageLayout";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "complete" | "error";
  file?: File;
  kind?: "pdf" | "image" | "other";
  pdfPages?: number;
  pixelCount?: number;
}

interface FileUploadZoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onFilesChange?: (files: UploadedFile[]) => void;
  className?: string;
  showThumbnails?: boolean;
  allowEncryptedPdf?: boolean;
  externalError?: string | null;
  pdfEncryptionMode?: "allow" | "require_encrypted" | "reject_encrypted";
  encryptedPdfErrorMessage?: string;
  unencryptedPdfErrorMessage?: string;
  maxPdfPages?: number;
  maxTotalPages?: number;
  maxImages?: number;
  maxTotalPixels?: number;
  pdfPageLimitErrorMessage?: string;
  totalPageLimitErrorMessage?: string;
  imageLimitErrorMessage?: string;
  pixelLimitErrorMessage?: string;
  // Controls which icon/colour to show for non-PDF thumbnails and the upload chip
  variant?: "primary" | "secondary" | "accent";
  iconType?: "generic" | "word" | "excel" | "powerpoint";
  // When true, thumbnails are laid out in a horizontally scrollable row.
  // When false, they wrap normally without showing the horizontal scroll strip.
  horizontalScroll?: boolean;
}

export function FileUploadZone({
  accept = ".pdf",
  multiple = true,
  maxFiles = 20,
  onFilesChange,
  className,
  showThumbnails = true,
  allowEncryptedPdf = false,
  externalError,
  pdfEncryptionMode,
  encryptedPdfErrorMessage,
  unencryptedPdfErrorMessage,
  maxPdfPages,
  maxTotalPages,
  maxImages,
  maxTotalPixels,
  pdfPageLimitErrorMessage,
  totalPageLimitErrorMessage,
  imageLimitErrorMessage,
  pixelLimitErrorMessage,
  variant,
  iconType = "generic",
  horizontalScroll = true,
}: FileUploadZoneProps) {
  const toolTheme = useToolTheme();
  const resolvedVariant = variant ?? toolTheme?.iconColor ?? "primary";
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const resolvedPdfEncryptionMode =
    pdfEncryptionMode ?? (allowEncryptedPdf ? "allow" : "reject_encrypted");

  const uploadZoneVariantClasses = (() => {
    if (resolvedVariant === "secondary") {
      return {
        hover: "hover:border-secondary/50",
        active: "border-secondary bg-secondary/5",
      } as const;
    }
    if (resolvedVariant === "accent") {
      return {
        hover: "hover:border-accent/50",
        active: "border-accent bg-accent/5",
      } as const;
    }
    return {
      hover: "hover:border-primary/50",
      active: "border-primary bg-primary/5",
    } as const;
  })();

  const colorClasses = (() => {
    if (resolvedVariant === "secondary") {
      return {
        bg: "bg-secondary/10",
        icon: "text-secondary",
        ready: "text-secondary",
      } as const;
    }
    if (resolvedVariant === "accent") {
      return {
        bg: "bg-accent/10",
        icon: "text-accent",
        ready: "text-accent",
      } as const;
    }
    return {
      bg: "bg-primary/10",
      icon: "text-primary",
      ready: "text-secondary",
    } as const;
  })();

  const renderFileIcon = () => {
    if (iconType === "excel") {
      return <FileSpreadsheet className={`h-10 w-10 ${colorClasses.icon}`} />;
    }
    if (iconType === "powerpoint") {
      return <Presentation className={`h-10 w-10 ${colorClasses.icon}`} />;
    }
    if (iconType === "word") {
      return <FileText className={`h-10 w-10 ${colorClasses.icon}`} />;
    }
    return <FileText className={`h-10 w-10 ${colorClasses.icon}`} />;
  };

  useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const acceptTokens = accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const matchesAccept = (file: File): boolean => {
    if (acceptTokens.length === 0) return true;

    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();

    return acceptTokens.some((token) => {
      if (token === "*/*") return true;
      if (token.endsWith("/*")) {
        const prefix = token.slice(0, -1);
        return type.startsWith(prefix);
      }
      if (token.startsWith(".")) return name.endsWith(token);
      return type === token;
    });
  };

  const acceptLabel = (() => {
    const exts = acceptTokens.filter((t) => t.startsWith("."));
    if (exts.length > 0) return exts.join(", ").toUpperCase();
    const mimes = acceptTokens.filter((t) => !t.startsWith("."));
    if (mimes.length > 0) return mimes.join(", ");
    return "selected formats";
  })();

  const isPdfFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    return file.type === "application/pdf" || name.endsWith(".pdf");
  };

  const isImageFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    return file.type.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
  };

  const getPdfPageCount = async (file: File): Promise<number | null> => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      // @ts-ignore - worker configured globally in PdfThumbnail/PdfPageThumbnail
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = (pdfjsLib as any).getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const count = Number(pdf?.numPages);
      return Number.isFinite(count) ? count : null;
    } catch {
      return null;
    }
  };

  const getImagePixelCount = async (file: File): Promise<number | null> => {
    try {
      if (typeof createImageBitmap === "function") {
        const bmp = await createImageBitmap(file);
        const pixels = bmp.width * bmp.height;
        bmp.close?.();
        return Number.isFinite(pixels) ? pixels : null;
      }
    } catch {
      // ignore and fallback
    }

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      const pixels = await new Promise<number>((resolve, reject) => {
        img.onload = () => resolve(img.width * img.height);
        img.onerror = () => reject(new Error("image-load-failed"));
        img.src = url;
      });
      URL.revokeObjectURL(url);
      return Number.isFinite(pixels) ? pixels : null;
    } catch {
      return null;
    }
  };

  const isEncryptedPdf = async (file: File): Promise<boolean> => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      // @ts-ignore - worker configured globally in PdfThumbnail/PdfPageThumbnail
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = (pdfjsLib as any).getDocument({ data: arrayBuffer });
      await loadingTask.promise;
      return false;
    } catch (err: any) {
      const name = String(err?.name || "");
      const message = String(err?.message || "");
      return (
        name.toLowerCase().includes("password") ||
        message.toLowerCase().includes("password")
      );
    }
  };

  const processFiles = useCallback(
    async (fileList: FileList) => {
      setUploadError(null);

      const remainingSlots = Math.max(0, maxFiles - files.length);
      if (remainingSlots === 0) {
        setUploadError(`You can upload up to ${maxFiles} file(s).`);
        return;
      }

      const candidates = Array.from(fileList).slice(0, remainingSlots);

      const existingPdfPages = files.reduce((sum, f) => sum + (f.pdfPages || 0), 0);
      const existingImageCount = files.reduce((sum, f) => sum + (f.kind === "image" ? 1 : 0), 0);
      const existingTotalPages = files.reduce(
        (sum, f) => sum + (typeof f.pdfPages === "number" ? f.pdfPages : f.kind === "image" ? 1 : 0),
        0
      );
      const existingTotalPixels = files.reduce((sum, f) => sum + (f.pixelCount || 0), 0);

      let runningPdfPages = existingPdfPages;
      let runningImageCount = existingImageCount;
      let runningTotalPages = existingTotalPages;
      let runningTotalPixels = existingTotalPixels;

      for (const candidate of candidates) {
        if (!matchesAccept(candidate)) {
          setUploadError(`Unsupported file format. Please upload ${acceptLabel}.`);
          continue;
        }

        const candidateIsPdf = isPdfFile(candidate);
        const candidateIsImage = isImageFile(candidate);

        let pdfPages: number | null = null;
        let pixelCount: number | null = null;

        if (candidateIsPdf && (typeof maxPdfPages === "number" || typeof maxTotalPages === "number")) {
          pdfPages = await getPdfPageCount(candidate);
          if (typeof maxPdfPages === "number" && typeof pdfPages === "number" && pdfPages > maxPdfPages) {
            setUploadError(
              pdfPageLimitErrorMessage ||
                `This PDF has ${pdfPages} pages. The limit for this tool is ${maxPdfPages} pages.`
            );
            continue;
          }
        }

        if (candidateIsImage && typeof maxTotalPixels === "number") {
          pixelCount = await getImagePixelCount(candidate);
        }

        if (candidateIsImage && typeof maxImages === "number" && runningImageCount + 1 > maxImages) {
          setUploadError(
            imageLimitErrorMessage || `You can upload up to ${maxImages} image(s) for this tool.`
          );
          continue;
        }

        const candidatePagesForTotal =
          typeof pdfPages === "number" ? pdfPages : candidateIsImage ? 1 : 0;

        if (
          typeof maxTotalPages === "number" &&
          runningTotalPages + candidatePagesForTotal > maxTotalPages
        ) {
          setUploadError(
            totalPageLimitErrorMessage ||
              `This upload is too large. The limit for this tool is ${maxTotalPages} total page(s).`
          );
          continue;
        }

        if (
          typeof maxTotalPixels === "number" &&
          typeof pixelCount === "number" &&
          runningTotalPixels + pixelCount > maxTotalPixels
        ) {
          setUploadError(
            pixelLimitErrorMessage ||
              "These images are too large (resolution). Please upload fewer or smaller images."
          );
          continue;
        }

        if (isPdfFile(candidate) && resolvedPdfEncryptionMode !== "allow") {
          const encrypted = await isEncryptedPdf(candidate);

          if (resolvedPdfEncryptionMode === "reject_encrypted" && encrypted) {
            setUploadError(
              encryptedPdfErrorMessage ||
                "Protected PDFs aren't supported for this tool. Please unlock the PDF first using Unlock PDF."
            );
            continue;
          }

          if (resolvedPdfEncryptionMode === "require_encrypted" && !encrypted) {
            setUploadError(
              unencryptedPdfErrorMessage ||
                "This tool only works with protected PDFs. Please upload a password-protected PDF."
            );
            continue;
          }
        }

        const uploaded: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: candidate.name,
          size: candidate.size,
          progress: 0,
          status: "uploading" as const,
          file: candidate,
          kind: candidateIsPdf ? "pdf" : candidateIsImage ? "image" : "other",
          pdfPages: typeof pdfPages === "number" ? pdfPages : undefined,
          pixelCount: typeof pixelCount === "number" ? pixelCount : undefined,
        };

        if (candidateIsPdf && typeof pdfPages === "number") {
          runningPdfPages += pdfPages;
        }
        if (candidateIsImage) {
          runningImageCount += 1;
          runningTotalPages += 1;
        } else if (candidateIsPdf && typeof pdfPages === "number") {
          runningTotalPages += pdfPages;
        }
        if (typeof pixelCount === "number") {
          runningTotalPixels += pixelCount;
        }

        // Simulate upload progress
        setTimeout(() => {
          const interval = setInterval(() => {
            setFiles((prev) => {
              const updated: UploadedFile[] = prev.map((f) => {
                if (f.id === uploaded.id && f.progress < 100) {
                  const newProgress = Math.min(f.progress + Math.random() * 30, 100);
                  return {
                    ...f,
                    progress: newProgress,
                    status: (newProgress === 100 ? "complete" : "uploading") as UploadedFile["status"],
                  };
                }
                return f;
              });
              return updated;
            });
          }, 200);

          setTimeout(() => clearInterval(interval), 2000);
        }, 0);

        setFiles((prev) => [...prev, uploaded]);
      }
    },
    [
      acceptLabel,
      allowEncryptedPdf,
      files,
      matchesAccept,
      maxFiles,
      maxImages,
      maxPdfPages,
      maxTotalPages,
      maxTotalPixels,
      pdfPageLimitErrorMessage,
      totalPageLimitErrorMessage,
      imageLimitErrorMessage,
      pixelLimitErrorMessage,
      resolvedPdfEncryptionMode,
      encryptedPdfErrorMessage,
      unencryptedPdfErrorMessage,
    ]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        void processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleItemDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, id: string) => {
      e.dataTransfer.effectAllowed = "move";
      setDraggingId(id);
    },
    []
  );

  const handleItemDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      setFiles((prev) => {
        if (!draggingId || draggingId === targetId) return prev;

        const currentIndex = prev.findIndex((f) => f.id === draggingId);
        const targetIndex = prev.findIndex((f) => f.id === targetId);

        if (currentIndex === -1 || targetIndex === -1) return prev;
        const updated = [...prev];
        const [moved] = updated.splice(currentIndex, 1);
        updated.splice(targetIndex, 0, moved);
        return updated;
      });
    },
    [draggingId, onFilesChange]
  );

  const handleItemDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        void processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, [onFilesChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("mx-auto w-full max-w-3xl", className)}>
      {/* Upload Zone */}
      <div
        className={cn(
          "upload-zone cursor-pointer min-h-[260px] sm:min-h-[320px]",
          uploadZoneVariantClasses.hover,
          isDragging && "upload-zone-active",
          isDragging && uploadZoneVariantClasses.active
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />
        <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl mb-4", colorClasses.bg)}>
          <Upload className={cn("h-8 w-8", colorClasses.icon)} />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          Drop your files here
        </h3>
        <p className="text-muted-foreground mb-4">
          or click to browse from your computer
        </p>
        <Button variant="outline" size="lg" className="pointer-events-none">
          Select Files
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          {(() => {
            const lower = accept.toLowerCase();

            if (lower.includes(".pdf")) {
              return "Supports: PDF files up to 100MB each";
            }

            if (lower.includes(".jpg") || lower.includes(".jpeg") || lower.includes(".png")) {
              return "Supports: JPG, PNG files up to 100MB each";
            }

            if (lower.includes(".doc") || lower.includes(".docx")) {
              return "Supports: Word files (.doc, .docx) up to 100MB each";
            }

            if (lower.includes(".xls") || lower.includes(".xlsx")) {
              return "Supports: Excel files (.xls, .xlsx) up to 100MB each";
            }

            if (lower.includes(".ppt") || lower.includes(".pptx")) {
              return "Supports: PowerPoint files (.ppt, .pptx) up to 100MB each";
            }

            return "Supports: selected files up to 100MB each";
          })()}
        </p>

        {externalError || uploadError ? (
          <p className="mt-3 text-sm text-destructive text-center max-w-md px-2">
            {externalError || uploadError}
          </p>
        ) : null}
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{files.length} file(s) selected</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add more
            </Button>
          </div>

          <div
            className={cn(
              "pb-1",
              horizontalScroll
                ? "overflow-x-auto scroll-slim"
                : "overflow-visible"
            )}
          >
            <div
              className={cn(
                "flex gap-4",
                horizontalScroll
                  ? "min-w-full justify-center sm:justify-start"
                  : "flex-wrap justify-center sm:justify-start"
              )}
            >
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group relative flex flex-col rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-move min-w-[220px] max-w-[260px]"
                  draggable
                  onDragStart={(e) => handleItemDragStart(e, file.id)}
                  onDragOver={(e) => handleItemDragOver(e, file.id)}
                  onDragEnd={handleItemDragEnd}
                >
                <div className="absolute left-2 top-2 inline-flex items-center rounded-full bg-muted/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm">
                  {formatFileSize(file.size)}
                </div>

                <button
                  type="button"
                  className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>

                <div className="flex-1 rounded-lg bg-muted/60 flex items-center justify-center mb-2 overflow-hidden max-w-[200px] mx-auto">
                  {showThumbnails && file.file && file.file.type === "application/pdf" ? (
                    <PdfThumbnail file={file.file} />
                  ) : (
                    renderFileIcon()
                  )}
                </div>

                <div className="min-h-[2.5rem] flex flex-col justify-between">
                  <p className="text-xs font-medium text-center truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    {file.status === "uploading" && (
                      <Progress value={file.progress} className="h-1.5 w-20" />
                    )}
                    {file.status === "complete" && (
                      <span className={cn("text-[11px] font-medium", colorClasses.ready)}>
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-1 flex justify-center text-[10px] text-muted-foreground">
                  <GripVertical className="h-3 w-3" />
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
