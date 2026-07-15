// Live app URLs — set on Vercel after the app projects deploy.
export const LINKS = {
  padi: process.env.NEXT_PUBLIC_PADI_URL ?? "#launching",
  oga: process.env.NEXT_PUBLIC_OGA_URL ?? "#launching",
  github: "https://github.com/eddiemessiah/celo-agent-hackathon",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_BOT
    ? `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT}`
    : "#launching",
};

export const launching = (href: string) => href === "#launching";
