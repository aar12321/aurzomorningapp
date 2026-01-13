import { Resend } from 'resend';

// Expect an environment variable RESEND_API_KEY at runtime
export const getResend = () => {
  const apiKey = (import.meta as any).env?.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set; emails disabled.');
    return null as unknown as Resend;
  }
  return new Resend(apiKey);
};

export const buildDailyEmailHtml = (
  name: string,
  items: Array<{ topic: string; day: number; url: string }>
) => {
  const list = items
    .map(
      (i) =>
        `<li style="margin:10px 0;padding:12px 16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0">` +
        `<strong>${i.topic} — Day ${i.day}</strong> ` +
        `<a href="${i.url}" style="margin-left:8px;text-decoration:none;background:#111827;color:white;padding:8px 12px;border-radius:999px">Start</a>` +
        `</li>`
    )
    .join('');

  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:white;padding:24px">
    <div style="text-align:center;margin-bottom:12px">
      <h1 style="margin:0;font-size:22px">Good morning, ${name} 👋</h1>
      <p style="color:#6b7280;margin:8px 0 0">Your new daily quizzes are unlocked</p>
    </div>
    <ol style="list-style:none;padding:0;margin:16px 0">${list}</ol>
    <p style="color:#6b7280;text-align:center;margin-top:24px">⏰ Complete them today to keep your streak alive!</p>
  </div>`;
};
