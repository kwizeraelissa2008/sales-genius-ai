/** Server-only email delivery helper. */

export type SendResult = {
  delivered: boolean;
  provider: "resend" | "none";
  reason?: string;
};

export async function sendViaResend(args: {
  to: string;
  subject: string;
  body: string;
  fromName: string;
  fromEmail?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const key = process.env['RESEND_API_KEY'];
  if (!key) {
    return {
      delivered: false,
      provider: "none",
      reason:
        "No email provider is connected yet. Connect a sending domain to deliver emails automatically.",
    };
  }
  const from = args.fromEmail || process.env['SENDER_EMAIL'] || "onboarding@resend.dev";
  // Replies go straight back to the signed-in user's own inbox.
  const displayName = args.replyTo ? `${args.fromName} (${args.replyTo})` : args.fromName;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: `${displayName} <${from}>`,
      to: [args.to],
      subject: args.subject,
      text: args.body,
      ...(args.replyTo ? { reply_to: args.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { delivered: false, provider: "resend", reason: `Send failed (${res.status}): ${text}` };
  }
  return { delivered: true, provider: "resend" };
}
