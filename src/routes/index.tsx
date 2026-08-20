import { createFileRoute } from "@tanstack/react-router";
import { Bot, Car, Layers, LayoutTemplate, Link2, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { AiTab } from "@/components/AiTab";
import { TemplatesTab } from "@/components/TemplatesTab";
import { CarBrandingTab } from "@/components/CarBrandingTab";
import { MockupTab } from "@/components/MockupTab";
import { CorelTab } from "@/components/CorelTab";
import { StudioProvider, useStudio } from "@/lib/studio";
import { useHydrated } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pilot Studio — Graphic Designer & Branding" },
      {
        name: "description",
        content:
          "AI design operator for branding, print and vehicle graphics: templates, mockups, panel tiling, export center and a CorelDRAW X7 bridge.",
      },
      { property: "og:title", content: "Pilot Studio — Graphic Designer & Branding" },
      {
        property: "og:description",
        content:
          "Generate, edit and export branding, print and vehicle-wrap artwork with an AI operator and a CorelDRAW X7 bridge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const TABS = [
  { id: "ai", label: "AI", icon: Bot },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "car", label: "Car Branding", icon: Car },
  { id: "mockups", label: "Mockups & Doctor", icon: Layers },
  { id: "corel", label: "Corel Link", icon: Link2 },
];

function Header() {
  const { design, corel } = useStudio();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-lg">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <div>
            <h1 className="font-display text-base font-bold">
              Graphic Designer &amp; Branding <span className="brand-text">for Pilot</span>
            </h1>
            <p className="font-mono text-[11px] text-muted-foreground">
              {design.name} · {design.widthMm}×{design.heightMm} mm · {design.colorMode}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] ${
            corel.linked ? "border-success/50 text-success" : "border-border text-muted-foreground"
          }`}
        >
          CorelDRAW X7 {corel.linked ? (corel.autoUpload ? "linked · auto-upload" : "linked") : "not linked"}
        </span>
      </div>
    </header>
  );
}

function Studio() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-[1600px] px-4 py-5">
        <Tabs defaultValue="ai">
          <TabsList className="mb-5 h-11 w-full justify-start gap-1 overflow-x-auto bg-surface-2/60 p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="gap-2 px-4 text-sm">
                <t.icon className="h-4 w-4" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="ai">
            <AiTab />
          </TabsContent>
          <TabsContent value="templates">
            <TemplatesTab />
          </TabsContent>
          <TabsContent value="car">
            <CarBrandingTab />
          </TabsContent>
          <TabsContent value="mockups">
            <MockupTab />
          </TabsContent>
          <TabsContent value="corel">
            <CorelTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Page() {
  return (
    <>
      <SubscriptionGate>
        <StudioProvider>
          <Studio />
        </StudioProvider>
      </SubscriptionGate>
      <Toaster position="top-right" richColors />
    </>
  );
}
