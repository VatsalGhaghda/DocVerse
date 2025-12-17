import { Shield, Zap, Cloud, Globe } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Fast workflow",
    description: "A streamlined UI with quick previews and one-click actions for common PDF tasks.",
  },
  {
    icon: Shield,
    title: "Privacy-minded",
    description: "Your files are processed only to complete the requested action. Avoid uploading sensitive documents if you’re unsure.",
  },
  {
    icon: Cloud,
    title: "Works in your browser",
    description: "Use DocVerse on desktop or mobile—no installs, no sign-in required.",
  },
  {
    icon: Globe,
    title: "All-in-one toolkit",
    description: "Merge, split, compress, watermark, page numbers, organize, protect/unlock, sign, and more.",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative border-y border-border bg-muted/30 py-20 lg:py-28 overflow-hidden">
      <div className="snow-overlay dark:snow-overlay-dark" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Why choose DocVerse?
          </h2>
          <p className="text-lg text-muted-foreground">
            Built as a clean, modern PDF utility app—focused on simplicity and real features.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
                <feature.icon className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
