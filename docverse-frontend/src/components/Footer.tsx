import { Link } from "react-router-dom";
import { Github, Linkedin, Mail } from "lucide-react";
import { DocVerseLogo } from "@/components/DocVerseLogo";

const footerSections: Array<{
  title: string;
  links: Array<{ name: string; href: string }>;
}> = [
  {
    title: "Core tools",
    links: [
      { name: "Merge PDF", href: "/merge" },
      { name: "Split PDF", href: "/split" },
      { name: "Compress PDF", href: "/compress" },
      { name: "OCR Scanner", href: "/ocr" },
      { name: "Sign PDF", href: "/sign" },
    ],
  },
  {
    title: "Convert",
    links: [
      { name: "PDF to Word", href: "/pdf-to-word" },
      { name: "PDF to Excel", href: "/pdf-to-excel" },
      { name: "PDF to PowerPoint", href: "/pdf-to-powerpoint" },
      { name: "PDF to Image", href: "/pdf-to-image" },
      { name: "Image to PDF", href: "/image-to-pdf" },
    ],
  },
  {
    title: "Edit & organize",
    links: [
      { name: "Organize PDF", href: "/organize" },
      { name: "Add Page Numbers", href: "/page-numbers" },
      { name: "Watermark PDF", href: "/watermark" },
    ],
  },
  {
    title: "Security",
    links: [
      { name: "Protect PDF", href: "/protect" },
      { name: "Unlock PDF", href: "/unlock" },
      { name: "About", href: "/about" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="mb-4 inline-flex items-center gap-2">
              <DocVerseLogo size={26} zoom={2.6} className="h-[26px] w-[26px] rounded-md" alt="DocVerse" />
              <span className="text-xl font-bold">DocVerse</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              A clean, modern PDF toolkit built as a project—focused on usability and real features.
            </p>
            <div className="flex gap-4">
              <a
                href="mailto:ghaghdavatsal0@gmail.com"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/VatsalGhaghda"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/vatsal-ghaghda/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h4 className="mb-4 font-semibold">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DocVerse. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Made with ❤️ for document lovers everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
