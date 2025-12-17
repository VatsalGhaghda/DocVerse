import { Users, Globe, Shield, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DocVerseLogo } from "@/components/DocVerseLogo";

const values = [
  {
    icon: Shield,
    title: "Privacy-minded",
    description:
      "Your files are processed to complete the requested action. If you’re working with sensitive documents, use your best judgment before uploading.",
  },
  {
    icon: Zap,
    title: "Fast workflow",
    description: "A clean UI with previews and straightforward controls so you can finish common PDF tasks quickly.",
  },
  {
    icon: Globe,
    title: "Works in your browser",
    description: "Use DocVerse on desktop or mobile—no installs and no sign-in required.",
  },
  {
    icon: Users,
    title: "Practical toolset",
    description: "Built as a utility app for everyday needs: merge, split, compress, organize, watermark, protect/unlock, sign, and more.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden gradient-hero py-14 sm:py-16 lg:py-10 border-b border-border">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
          </div>

          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-2xl border border-border/60 bg-background/40 p-4 shadow-card backdrop-blur">
                <DocVerseLogo size={56} zoom={2.6} className="h-14 w-14" alt="DocVerse" />
              </div>
              <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
                About{" "}
                <span className="text-gradient">DocVerse</span>
              </h1>
              <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground">
                DocVerse is a modern, browser-based PDF toolbox.
                It focuses on practical features, clean UX, and sensible limits—so you can get work done without signing up.
              </p>
            </div>
          </div>
        </section>

        {/* What you can do */}
        <section className="py-14 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8 shadow-card backdrop-blur">
                <h2 className="mb-4 text-2xl sm:text-3xl font-bold">What you can do with DocVerse</h2>
                <div className="prose prose-lg text-muted-foreground">
                  <p className="mb-4">
                    DocVerse includes a collection of focused tools for common document workflows.
                    You can merge PDFs, split by ranges/pages, compress files, convert between formats, add page numbers,
                    add watermarks, organize/reorder pages, protect/unlock PDFs, and place signatures.
                  </p>
                  <p>
                    The project aims to keep the experience simple: upload, configure, process, download.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="relative border-y border-border bg-muted/30 py-16 sm:py-20 overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-32 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
          </div>
          <div className="container mx-auto px-4">
            <div className="relative mx-auto max-w-5xl">
              <h2 className="mb-10 sm:mb-12 text-center text-3xl font-bold">Project principles</h2>
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
                {values.map((value) => (
                  <div key={value.title} className="feature-card text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl gradient-primary">
                      <value.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="py-14 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8 shadow-card backdrop-blur">
                <h2 className="mb-4 text-2xl sm:text-3xl font-bold">Notes & limitations</h2>
                <div className="prose prose-lg text-muted-foreground">
                  <p className="mb-4">
                    Some operations can take longer on large PDFs (especially image-heavy files).
                    Keep the tab open during processing.
                  </p>
                  <p className="mb-4">
                    Features and limits may vary by tool (e.g., maximum file count, page limits, or output limits).
                    These limits exist to keep the app stable and predictable.
                  </p>
                  <p>
                    If you run into an issue or want a new tool, reach out via the links in the footer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
