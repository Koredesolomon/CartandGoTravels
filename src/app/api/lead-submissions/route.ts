import { NextRequest, NextResponse } from "next/server";
import { createLeadSubmissionPdf } from "@/lib/leadSubmissionPdf";

export const runtime = "nodejs";

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

  const submittedAt = new Date();
  const pdf = await createLeadSubmissionPdf({ message, email: replyTo, submittedAt });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail,
      reply_to: replyTo || undefined,
      subject: "New Cart&Go Travels form request",
      text: "A new form request has been received. The complete submission details are attached as a PDF. Reply to this email to contact the sender if a reply address was provided.",
      attachments: [{
        filename: `cartandgo-form-request-${submittedAt.toISOString().replace(/[:.]/g, "-")}.pdf`,
        content: pdf.toString("base64"),
      }],
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

  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const message = getString(body.message);
  const email = getString(body.email);

  if (message.length > MAX_MESSAGE_LENGTH || email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return NextResponse.json({ error: "Please check your email and message length." }, { status: 400 });
  }

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
