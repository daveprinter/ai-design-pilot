import { flushSync } from "react-dom";

export type Attachment = {
  id: string;
  name: string;
  kind: "image" | "video";
  dataUrl: string;
  size: number;
};

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "video_url"; video_url: { url: string } };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  image?: string;
  pending?: boolean;
};

function toApiContent(m: ChatMessage): string | ContentBlock[] {
  if (!m.attachments?.length) return m.content;
  const blocks: ContentBlock[] = [{ type: "text", text: m.content || "Analyse this." }];
  for (const a of m.attachments) {
    if (a.kind === "image") blocks.push({ type: "image_url", image_url: { url: a.dataUrl } });
    else blocks.push({ type: "video_url", video_url: { url: a.dataUrl } });
  }
  return blocks;
}

/** Streams a Gemini 2.5 Flash reply, calling onDelta with accumulated text. */
export async function streamChat(
  history: ChatMessage[],
  onDelta: (full: string) => void,
  system?: string,
): Promise<string> {
  const res = await fetch("/api/ai-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(system ? { system } : {}),
      messages: history.map((m) => ({ role: m.role, content: toApiContent(m) })),
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error((await res.text().catch(() => "")) || `AI request failed (${res.status})`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
          error?: { message?: string };
        };
        if (json.error?.message) throw new Error(json.error.message);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          const snapshot = full;
          flushSync(() => onDelta(snapshot));
        }
      } catch {
        /* ignore keep-alive / partial frames */
      }
    }
  }
  return full;
}

/** Streams a generated image; onFrame receives data URLs (blurred until final). */
export async function streamImage(
  prompt: string,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
): Promise<void> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok || !res.body) {
    throw new Error((await res.text().catch(() => "")) || `Image generation failed (${res.status})`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let sawAny = false;
  let sawFinal = false;
  let streamError: string | undefined;

  const handle = (eventName: string, data: string) => {
    let payload: {
      type?: string;
      b64_json?: string;
      error?: { message?: string };
    } = {};
    try {
      payload = JSON.parse(data);
    } catch {
      return;
    }
    if (eventName === "error" || payload.type === "error") {
      sawAny = true;
      streamError = payload.error?.message ?? "Image generation failed";
      return;
    }
    const name = eventName || payload.type || "";
    if (!name.includes("partial_image") && !name.includes("completed")) return;
    if (!payload.b64_json) return;
    sawAny = true;
    const isFinal = name.includes("completed");
    if (isFinal) sawFinal = true;
    flushSync(() => onFrame(`data:image/png;base64,${payload.b64_json}`, isFinal));
  };

  let currentEvent = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (line.startsWith("event:")) currentEvent = line.slice(6).trim();
      else if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        if (data && data !== "[DONE]") handle(currentEvent, data);
      } else if (!line) currentEvent = "";
    }
  }

  if (streamError) throw new Error(streamError);
  if (!sawAny) {
    const replay = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, stream: false }),
    });
    if (!replay.ok) throw new Error(`Image generation failed (${replay.status})`);
    const json = (await replay.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image generation returned no image");
    onFrame(`data:image/png;base64,${b64}`, true);
    return;
  }
  if (!sawFinal) throw new Error("Image stream ended early");
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
