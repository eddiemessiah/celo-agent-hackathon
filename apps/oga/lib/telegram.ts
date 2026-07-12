const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function sendTelegram(chatId: number, text: string): Promise<void> {
  if (!TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch((err) => console.error("telegram send failed", err));
}
