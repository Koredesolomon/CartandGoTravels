import { NextRequest, NextResponse } from "next/server";

const MAX_MESSAGE_LENGTH = 6000;

type LeadSubmissionRequest = {
  email?: unknown;
  message?: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function sendLeadEmail({
  replyTo,
  message,
}: {
  replyTo: string;
  message: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.LEAD_FROM_EMAIL;
  const toEmail = process.env.LEAD_TO_EMAIL;

  if (!resendApiKey || !fromEmail || !toEmail) {
    throw new Error(
      "Email delivery is not configured. Set RESEND_API_KEY, LEAD_FROM_EMAIL and LEAD_TO_EMAIL.",
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail,
      reply_to: replyTo || undefined,
      subject: "New Cart&Go Travels form request",
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email delivery failed: ${await response.text()}`);
  }
}

export async function POST(request: NextRequest) {
  let body: LeadSubmissionRequest;

  try {
    body = (await request.json()) as LeadSubmissionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = getString(body.message).slice(0, MAX_MESSAGE_LENGTH);
  const email = getString(body.email);

  if (!message) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 },
    );
  }

  try {
    await sendLeadEmail({ replyTo: email, message });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to submit request" },
      { status: 502 },
    );
  }
}
