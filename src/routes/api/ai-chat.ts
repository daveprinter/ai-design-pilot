import { createFileRoute } from "@tanstack/react-router";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "video_url"; video_url: { url: string } };

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ContentBlock[];
};

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { messages, system } = (await request.json()) as {
          messages: ChatMessage[];
          system?: string;
        };

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            stream: true,
            messages: [
              {
                role: "system",
                content:
                  system ??
                  "You are Pilot AI, an expert graphic design and branding operator for CorelDRAW X7, print production and vehicle graphics. You understand design briefs, analyse uploaded images and videos, plan multi-step work (UNDERSTAND -> PLAN -> CREATE -> INSPECT -> FIX -> EXPORT), and answer with concrete, actionable steps, measurements in mm, CMYK values and print-ready advice. When the user asks for an operation on a document, describe the exact action plan as a numbered checklist the designer or the Corel automation bridge can execute. Be concise and practical.",
              },
              ...messages,
            ],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "AI request failed");
          return new Response(text, { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
