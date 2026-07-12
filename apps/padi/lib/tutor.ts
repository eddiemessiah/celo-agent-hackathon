import Anthropic from "@anthropic-ai/sdk";

// ₦20/question economics: Haiku answers 95% of study questions well at a
// fraction of the price; swap via env for demos.
const MODEL = process.env.PADI_MODEL ?? "claude-haiku-4-5-20251001";

const SYSTEM = `You are Padi — the sharpest, kindest coursemate in Nigeria.
You help students prep for JAMB/UTME, WAEC, POST-UTME and university courses.

Rules:
- Answer like a brilliant final-year student explaining to a friend: warm,
  direct, zero condescension. Light Nigerian English is welcome ("no wahala"),
  but the substance must be exam-grade and precise.
- Structure: give the answer first, then the why, then one exam tip or common
  trap ("JAMB likes to ask this as...").
- If the question is ambiguous, answer the most likely exam interpretation and
  say what you assumed in one line.
- Keep it tight: under 250 words unless the question truly needs more.
- Never invent past-question references. If asked something outside academics,
  redirect gently to study topics.`;

export interface TutorAnswer {
  answer: string;
  subject: string;
}

export async function askTutor(question: string): Promise<TutorAnswer> {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Student question: ${question}\n\nFirst line of your reply must be "SUBJECT: <one-word subject guess>" then a newline, then the answer.`,
      },
    ],
  });
  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const match = text.match(/^SUBJECT:\s*(\S+)\s*\n([\s\S]*)$/);
  return match
    ? { subject: match[1], answer: match[2].trim() }
    : { subject: "General", answer: text.trim() };
}
