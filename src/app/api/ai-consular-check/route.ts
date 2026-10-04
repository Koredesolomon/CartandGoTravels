import { ACCESS_COOKIE, readToken } from "@/lib/payment";
import { NextRequest, NextResponse } from "next/server";

const MAX_DOCUMENT_CHARS = 12000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;

const requestLog = new Map<string, number[]>();

type ConsularCheckRequest = {
  country?: unknown;
  visaClass?: unknown;
  documentText?: unknown;
};

type AnthropicContentBlock = {
  type?: string;
  text?: string;
};

type AnthropicResponse = {
  content?: AnthropicContentBlock[];
  error?: {
    message?: string;
  };
};

function isRateLimited(clientKey: string) {
  const now = Date.now();
  const recent = (requestLog.get(clientKey) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    requestLog.set(clientKey, recent);
    return true;
  }

  requestLog.set(clientKey, [...recent, now]);
  return false;
}

function getOutputText(response: AnthropicResponse) {
  return (
    response.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function extractJsonObject(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return trimmed;
  }

  return trimmed.slice(start, end + 1);
}

function clamp(value: unknown, min: number, max: number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.round(number)));
}

function normalizeReport(value: unknown) {
  const report = value as {
    score?: unknown;
    statusLabel?: unknown;
    completeness?: unknown;
    clarity?: unknown;
    ties?: unknown;
    flags?: unknown;
    roadmap?: unknown;
    showPaySmallSmall?: unknown;
    summary?: unknown;
    disclaimer?: unknown;
  };

  const score = clamp(report.score, 0, 100);
  const statusLabel =
    typeof report.statusLabel === "string"
      ? report.statusLabel
      : score >= 80
        ? "Excellent to apply"
        : score >= 50
          ? "Good profile"
          : "Critical gaps";

  return {
    score,
    statusLabel,
    completeness: clamp(report.completeness, 0, 30),
    clarity: clamp(report.clarity, 0, 30),
    ties: clamp(report.ties, 0, 40),
    flags: Array.isArray(report.flags) ? report.flags.filter((flag): flag is { type: string; title: string; body: string } =>
      flag !== null && typeof flag === "object" && ["risk", "weak", "excellent"].includes(flag.type) && typeof flag.title === "string" && typeof flag.body === "string",
    ).slice(0, 6) : [],
    roadmap: Array.isArray(report.roadmap) ? report.roadmap.filter((item): item is string => typeof item === "string").slice(0, 7) : [],
    showPaySmallSmall: Boolean(report.showPaySmallSmall),
    summary: typeof report.summary === "string" ? report.summary : "",
    disclaimer:
      typeof report.disclaimer === "string"
        ? report.disclaimer
        : "This readiness check is informational and is not legal advice, immigration advice, or a visa decision.",
  };
}

export async function POST(request: NextRequest) {
  const access = readToken(request.cookies.get(ACCESS_COOKIE)?.value, "access");
  if (!access) {
    return NextResponse.json({ error: "Payment is required or your session has expired." }, { status: 402 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not configured. Add it to your environment to enable AI Consular Check.",
      },
      { status: 503 },
    );
  }

  const clientKey = access.ref;

  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { error: "Too many checks. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  let body: ConsularCheckRequest;

  try {
    body = (await request.json()) as ConsularCheckRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const country = typeof body.country === "string" ? body.country.trim() : "";
  const visaClass =
    typeof body.visaClass === "string" ? body.visaClass.trim() : "";
  const documentText =
    typeof body.documentText === "string" ? body.documentText.trim() : "";

  if (!country || !visaClass || !documentText) {
    return NextResponse.json(
      { error: "Country, visa class and document text are required." },
      { status: 400 },
    );
  }

  if (documentText.length > MAX_DOCUMENT_CHARS) {
    return NextResponse.json(
      {
        error: `Document text is too long. Please keep it under ${MAX_DOCUMENT_CHARS.toLocaleString()} characters.`,
      },
      { status: 413 },
    );
  }

  const systemPrompt = [
    "You are CartandGo's AI Consular Check assistant.",
    "Review visa-readiness documents like a careful pre-submission reviewer, not as an embassy officer and not as a lawyer.",
    "Do not guarantee approval or refusal.",
    "Identify credibility, financial traceability, home-country ties, document consistency, and practical fixes.",
    "Be direct, professional, and grounded only in the provided text.",
    "Return only a valid JSON object with exactly these fields:",
    "- score: integer 0-100",
    "- statusLabel: one of Critical gaps, Good profile, Excellent to apply",
    "- completeness: integer 0-30",
    "- clarity: integer 0-30",
    "- ties: integer 0-40",
    "- flags: array of 1-6 objects with type risk|weak|excellent, title, body",
    "- roadmap: array of 3-7 strings",
    "- showPaySmallSmall: boolean",
    "- summary: string",
    "- disclaimer: string",
  ].join("\n");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      signal: AbortSignal.timeout(30000),
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
        max_tokens: 1800,
        temperature: 0.2,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              `Target country: ${country}`,
              `Visa class: ${visaClass}`,
              "Document text:",
              documentText,
            ].join("\n"),
          },
        ],
      }),
    });

    const data = (await response.json()) as AnthropicResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error?.message ??
            "The AI review service could not complete the request.",
        },
        { status: response.status },
      );
    }

    try {
      const outputText = getOutputText(data);
      const report = normalizeReport(JSON.parse(extractJsonObject(outputText)));

      return NextResponse.json({ report });
    } catch {
      return NextResponse.json(
        { error: "The AI review returned an unreadable report. Please try again." },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json({ error: "The AI review service is unavailable. Please try again." }, { status: 502 });
  }
}
