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

type OpenAIOutputBlock = {
  type?: string;
  text?: string;
};

type OpenAIOutputItem = {
  content?: OpenAIOutputBlock[];
};

type OpenAIResponse = {
  output_text?: string;
  output?: OpenAIOutputItem[];
  error?: {
    message?: string;
  };
};

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "score",
    "statusLabel",
    "completeness",
    "clarity",
    "ties",
    "flags",
    "roadmap",
    "showPaySmallSmall",
    "summary",
    "disclaimer",
  ],
  properties: {
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    statusLabel: {
      type: "string",
      enum: ["Critical gaps", "Good profile", "Excellent to apply"],
    },
    completeness: {
      type: "integer",
      minimum: 0,
      maximum: 30,
    },
    clarity: {
      type: "integer",
      minimum: 0,
      maximum: 30,
    },
    ties: {
      type: "integer",
      minimum: 0,
      maximum: 40,
    },
    flags: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "body"],
        properties: {
          type: {
            type: "string",
            enum: ["risk", "weak", "excellent"],
          },
          title: {
            type: "string",
          },
          body: {
            type: "string",
          },
        },
      },
    },
    roadmap: {
      type: "array",
      minItems: 3,
      maxItems: 7,
      items: {
        type: "string",
      },
    },
    showPaySmallSmall: {
      type: "boolean",
    },
    summary: {
      type: "string",
    },
    disclaimer: {
      type: "string",
    },
  },
} as const;

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local"
  );
}

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

function getOutputText(response: OpenAIResponse) {
  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((block) => block.text ?? "")
      .join("")
      .trim() ?? ""
  );
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
    flags: Array.isArray(report.flags) ? report.flags : [],
    roadmap: Array.isArray(report.roadmap) ? report.roadmap : [],
    showPaySmallSmall: Boolean(report.showPaySmallSmall),
    summary: typeof report.summary === "string" ? report.summary : "",
    disclaimer:
      typeof report.disclaimer === "string"
        ? report.disclaimer
        : "This readiness check is informational and is not legal advice, immigration advice, or a visa decision.",
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not configured. Add it to your environment to enable AI Consular Check.",
      },
      { status: 503 },
    );
  }

  const clientKey = getClientKey(request);

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

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
      instructions:
        "You are CartandGo's AI Consular Check assistant. Review visa-readiness documents like a careful pre-submission reviewer, not as an embassy officer and not as a lawyer. Do not guarantee approval or refusal. Identify credibility, financial traceability, home-country ties, document consistency, and practical fixes. Be direct, professional, and grounded only in the provided text. Return only JSON that matches the schema.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Target country: ${country}`,
                `Visa class: ${visaClass}`,
                "Document text:",
                documentText,
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "consular_check_report",
          strict: true,
          schema: reportSchema,
        },
      },
    }),
  });

  const data = (await response.json()) as OpenAIResponse;

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
    const report = normalizeReport(JSON.parse(outputText));

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json(
      { error: "The AI review returned an unreadable report. Please try again." },
      { status: 502 },
    );
  }
}
