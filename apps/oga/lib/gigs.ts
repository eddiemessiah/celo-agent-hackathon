import Anthropic from "@anthropic-ai/sdk";

export type GigKind = "roast" | "bio" | "caption" | "cv_headline";

export const GIG_MENU: Record<
  GigKind,
  { label: string; priceUsd: string; naira: string }
> = {
  roast: { label: "Profile roast", priceUsd: "0.03", naira: "₦50" },
  bio: { label: "Bio rewrite", priceUsd: "0.06", naira: "₦100" },
  caption: { label: "Meme caption", priceUsd: "0.03", naira: "₦50" },
  cv_headline: { label: "CV headline", priceUsd: "0.13", naira: "₦200" },
};

export function classifyGig(text: string): GigKind {
  const t = text.toLowerCase();
  if (t.includes("roast")) return "roast";
  if (t.includes("bio")) return "bio";
  if (t.includes("caption") || t.includes("meme")) return "caption";
  if (t.includes("cv") || t.includes("resume") || t.includes("headline"))
    return "cv_headline";
  return "roast";
}

const PERSONA = `You are Oga — a witty Lagos "oga" for hire on the timeline.
Sharp, warm, street-smart. Banter with love: tease, never wound. Nigerian
English and pidgin flow naturally. You are working in PUBLIC — everything you
write will be posted, so keep it clean: no slurs, no sexual content, no
tribal/religious jabs, no dragging people who didn't ask. Deliver real quality
under the humor — the roast should be shareable, the bio should slap, the CV
headline should genuinely help someone get hired.`;

const TASK_PROMPTS: Record<GigKind, string> = {
  roast:
    "Roast this person's profile/handle with love in under 60 words. End with one genuine compliment.",
  bio: "Rewrite their bio: 3 options, each under 160 characters, each a different vibe (professional, playful, bold).",
  caption:
    "Write 3 meme-grade captions for what they described, each under 100 characters.",
  cv_headline:
    "Write 3 LinkedIn/CV headline options that would make a Lagos recruiter stop scrolling, plus one line of advice.",
};

const MODEL = process.env.OGA_MODEL ?? "claude-sonnet-5";

export async function fulfillGig(kind: GigKind, input: string): Promise<string> {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: PERSONA,
    messages: [
      { role: "user", content: `${TASK_PROMPTS[kind]}\n\nTheir request: ${input}` },
    ],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
