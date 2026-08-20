import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ImagePlus,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Sparkles,
  Trash2,
  User,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePersistentState } from "@/lib/storage";
import { fileToDataUrl, streamChat, streamImage, type Attachment, type ChatMessage } from "@/lib/ai";
import { useStudio } from "@/lib/studio";
import { autoFix, makeObject, runDesignDoctor } from "@/lib/design";

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

const QUICK_ACTIONS = [
  "Make this design print-ready",
  "Improve this design",
  "Create 20 copies on A3",
  "Align everything",
  "Make it look premium",
  "Prepare for Instagram",
  "What looks wrong here?",
  "Redesign but keep the logo",
];

const uid = () => Math.random().toString(36).slice(2, 10);

export function AiTab() {
  const { design, setDesign, checkpoint, undo, canUndo, log, prefs, brand } = useStudio();
  const [messages, setMessages] = usePersistentState<ChatMessage[]>("chat", []);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgBusy, setImgBusy] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgFinal, setImgFinal] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const docContext = () =>
    `Current document: "${design.name}" (${design.category}) ${design.widthMm}×${design.heightMm} mm, bleed ${design.bleedMm} mm, ${design.colorMode}, ${design.objects.length} objects: ${design.objects
      .map((o) => `${o.name}[${o.type} ${o.w.toFixed(0)}×${o.h.toFixed(0)}mm @ ${o.x.toFixed(0)},${o.y.toFixed(0)}]`)
      .join(", ")}. Brand: ${brand.company}, colours ${brand.primary}/${brand.secondary}. Default export ${prefs.defaultFormat.toUpperCase()} at ${prefs.dpi} DPI.`;

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content && attachments.length === 0) return;
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content,
      ...(attachments.length ? { attachments } : {}),
    };
    const assistantId = uid();
    const next = [...messages, userMsg];
    setMessages([...next, { id: assistantId, role: "assistant", content: "", pending: true }]);
    setInput("");
    setAttachments([]);
    setBusy(true);
    try {
      const full = await streamChat(
        next,
        (partial) =>
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: partial, pending: true } : m)),
          ),
        `You are Pilot AI, an autonomous design operator for CorelDRAW X7, branding and large-format print. ${docContext()} Plan multi-step work as UNDERSTAND → PLAN → EXECUTE → INSPECT → FIX → EXPORT and reply with concrete numbered actions, mm measurements and CMYK/print advice. Analyse any attached image or video in detail before answering.`,
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: full, pending: false } : m)),
      );
      log(`AI answered: ${content.slice(0, 60)}`, "ai");
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      toast.error("AI request failed", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const toggleVoice = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRec }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice not supported", { description: "Use Chrome or Edge for voice commands." });
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i]![0]!.transcript;
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const added: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 18 * 1024 * 1024) {
        toast.error(`${file.name} is too large`, { description: "Keep uploads under 18 MB." });
        continue;
      }
      added.push({
        id: uid(),
        name: file.name,
        kind: file.type.startsWith("video") ? "video" : "image",
        dataUrl: await fileToDataUrl(file),
        size: file.size,
      });
    }
    setAttachments((prev) => [...prev, ...added]);
  };

  const generate = async () => {
    if (!imgPrompt.trim()) return;
    setImgBusy(true);
    setImgSrc(null);
    setImgFinal(false);
    try {
      await streamImage(imgPrompt, (url, final) => {
        setImgSrc(url);
        if (final) setImgFinal(true);
      });
      log(`Generated image: ${imgPrompt.slice(0, 50)}`, "ai");
    } catch (e) {
      toast.error("Image generation failed", { description: (e as Error).message });
    } finally {
      setImgBusy(false);
    }
  };

  const placeOnCanvas = () => {
    if (!imgSrc) return;
    checkpoint();
    setDesign((d) => ({
      ...d,
      objects: [
        ...d.objects,
        makeObject({
          type: "image",
          name: "AI image",
          src: imgSrc,
          x: d.widthMm * 0.1,
          y: d.heightMm * 0.1,
          w: d.widthMm * 0.5,
          h: d.heightMm * 0.4,
        }),
      ],
    }));
    toast.success("Placed on the canvas");
  };

  const doctor = () => {
    const issues = runDesignDoctor(design);
    const body = issues.map((i) => `${i.level === "info" ? "ℹ" : "⚠"} ${i.message}`).join("\n");
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        content: `🤖 Design Doctor — ${design.name}\n\n✓ Found ${design.objects.length} objects\n🎨 Colour mode: ${design.colorMode}\n📐 Page: ${design.widthMm}×${design.heightMm} mm · bleed ${design.bleedMm} mm\n\nAI found ${issues.length} finding(s):\n${body}\n\nUse “Fix all” to apply everything that can be corrected safely.`,
      },
    ]);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <section className="panel flex h-[720px] flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-lg">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </span>
            <div>
              <h2 className="text-sm font-bold">Pilot AI Operator</h2>
              <p className="text-[11px] text-muted-foreground">Gemini 2.5 Flash · vision · voice · agent mode</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={doctor}>
              Design doctor
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!canUndo}
              onClick={() => {
                undo();
                toast.success("AI changes reverted");
              }}
            >
              Undo AI
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMessages([])}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {QUICK_ACTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-lg border border-border bg-surface-2/50 px-3 py-2 text-left text-xs transition-colors hover:border-primary/60"
                >
                  <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
                  {q}
                </button>
              ))}
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                  <Bot className="h-4 w-4 text-primary" />
                </span>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-2"
                }`}
              >
                {m.attachments?.length ? (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {m.attachments.map((a) =>
                      a.kind === "image" ? (
                        <img key={a.id} src={a.dataUrl} alt={a.name} className="h-16 w-16 rounded object-cover" />
                      ) : (
                        <video key={a.id} src={a.dataUrl} className="h-16 w-24 rounded object-cover" muted />
                      ),
                    )}
                  </div>
                ) : null}
                {m.content || (m.pending ? "…" : "")}
                {m.pending && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}
              </div>
              {m.role === "user" && (
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                  <User className="h-4 w-4" />
                </span>
              )}
            </div>
          ))}
        </div>

        <footer className="border-t border-border p-3">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a) => (
                <span key={a.id} className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[11px]">
                  {a.name.slice(0, 22)}
                  <button onClick={() => setAttachments((p) => p.filter((x) => x.id !== a.id))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border hover:border-primary/60">
              <Paperclip className="h-4 w-4" />
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
            <Button
              size="icon"
              variant={listening ? "default" : "outline"}
              className="h-9 w-9 shrink-0"
              onClick={toggleVoice}
            >
              {listening ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Tell AI what you want to do…"
              className="max-h-32 min-h-9 resize-none bg-background/60"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" disabled={busy} onClick={() => send()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </footer>
      </section>

      <div className="space-y-4">
        <section className="panel p-4">
          <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold">
            <ImagePlus className="h-4 w-4 text-primary" /> AI Image Studio
          </h3>
          <Textarea
            value={imgPrompt}
            onChange={(e) => setImgPrompt(e.target.value)}
            rows={3}
            placeholder="Describe artwork: “gold monogram logo for a phone accessories shop, flat vector, black background”"
            className="bg-background/60 text-xs"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="flex-1" disabled={imgBusy} onClick={generate}>
              {imgBusy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1 h-3.5 w-3.5" />}
              Generate
            </Button>
            <Button size="sm" variant="outline" disabled={!imgSrc} onClick={placeOnCanvas}>
              Place on canvas
            </Button>
          </div>
          {imgSrc && (
            <img
              src={imgSrc}
              alt="AI generated artwork"
              className={`mt-3 w-full rounded-lg transition-[filter] duration-500 ${imgFinal ? "blur-0" : "blur-2xl"}`}
            />
          )}
        </section>

        <section className="panel p-4">
          <h3 className="mb-2 font-display text-sm font-bold">Safety &amp; checkpoints</h3>
          <p className="text-xs text-muted-foreground">
            Every AI operation writes an automatic checkpoint before touching your artwork.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                checkpoint();
                setDesign(autoFix(design));
                log("AI fix-all applied", "ai");
                toast.success("Applied all safe fixes");
              }}
            >
              Fix all
            </Button>
            <Button size="sm" variant="outline" disabled={!canUndo} onClick={undo}>
              Undo AI changes
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
