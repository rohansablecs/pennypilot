import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ReceiptExtraction = {
  vendor: string;
  amount: string;
  date: string;
  confidence: number;
  documentType: string;
};

const MODEL =
  process.env.HF_RECEIPT_MODEL ||
  "openai/gpt-oss-120b:fireworks-ai";

const SYSTEM_PROMPT = `
You are PennyPilot Receipt Intelligence.

Your job is to extract structured expense information from OCR text
obtained from receipts, invoices, payment confirmations, bills,
fee receipts, bank slips, restaurant bills, pharmacy bills,
e-commerce invoices, and other business payment documents.

You MUST return valid JSON matching the requested schema.

IMPORTANT RULES:

1. NEVER invent information.
2. Use ONLY information present in the OCR text.
3. Do not assume a vendor merely because an institution or organization
   appears somewhere in the document.
4. Prefer explicit labels:
   - Amount
   - Amount Paid
   - Total
   - Grand Total
   - Net Amount
   - Amount Due
   - Payable
   - Paid
   - Received
5. Ignore:
   - transaction IDs
   - bank reference numbers
   - invoice numbers
   - enrollment IDs
   - registration IDs
   - GST numbers
   - phone numbers
   - account numbers
   - timestamps
   - years used in document titles
6. For dates, prefer the actual transaction/document date.
7. If a date is ambiguous, use surrounding document context.
8. Indian documents commonly use DD/MM/YYYY, but do not blindly
   assume this when the document clearly uses another convention.
9. Convert a valid date to YYYY-MM-DD.
10. Amount must be returned as a plain numeric string:
    "2000"
    "1250.50"
    NEVER "₹2000".
11. If a field cannot be reliably extracted, return an empty string.
12. Do not use generic words such as:
    "receipt", "invoice", "successfully", "payment", "amount",
    "total", "received", "successful"
    as the vendor.
13. For payment confirmations, the merchant/payee/business name may
    appear as a header or explicit merchant/payee field.
14. "Payment Received Successfully" is a status, NOT a vendor.
15. The confidence value must represent confidence in the extraction,
    not confidence in whether the expense itself is legitimate.
16. Never classify something as fraud.
17. Never create an amount from a transaction/reference number.
18. When multiple monetary values exist, choose the actual amount
    paid/charged/received for the transaction, not an item price,
    tax amount, discount, reference number, or timestamp.

The result is going directly into a financial expense form,
so accuracy and conservative extraction are more important than
filling every field.
`;

export async function POST(
  request: Request
) {
  try {
    const token =
      process.env.HF_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Hugging Face token is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      await request.json();

    const ocrText =
      typeof body?.ocrText === "string"
        ? body.ocrText.trim()
        : "";

    if (!ocrText) {
      return NextResponse.json(
        {
          error:
            "No OCR text was provided.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Protect the model from accidentally receiving an enormous
     * browser-generated OCR payload.
     */
    const limitedOCR =
      ocrText.slice(0, 30000);

    const userPrompt = `
Extract the business expense information from this OCR document.

Return ONLY the JSON object.

OCR DOCUMENT:
----------------
${limitedOCR}
----------------

Return this exact structure:

{
  "vendor": "",
  "amount": "",
  "date": "",
  "confidence": 0,
  "documentType": ""
}

documentType should be one concise description such as:
"retail_receipt",
"restaurant_bill",
"invoice",
"payment_confirmation",
"fee_receipt",
"pharmacy_bill",
"bank_payment",
"ecommerce_invoice",
"transport_receipt",
"other"
`;

    const response =
      await fetch(
        "https://router.huggingface.co/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            model: MODEL,

            messages: [
              {
                role: "system",
                content:
                  SYSTEM_PROMPT,
              },
              {
                role: "user",
                content:
                  userPrompt,
              },
            ],

            temperature: 0.1,

            max_tokens: 500,

            /*
             * GPT-OSS through supported HF providers can produce
             * structured JSON. cite...
             */
            response_format: {
              type: "json_schema",
              json_schema: {
                name:
                  "receipt_extraction",
                strict: true,
                schema: {
                  type: "object",
                  additionalProperties:
                    false,
                  properties: {
                    vendor: {
                      type: "string",
                    },
                    amount: {
                      type: "string",
                    },
                    date: {
                      type: "string",
                    },
                    confidence: {
                      type: "number",
                    },
                    documentType: {
                      type: "string",
                    },
                  },
                  required: [
                    "vendor",
                    "amount",
                    "date",
                    "confidence",
                    "documentType",
                  ],
                },
              },
            },
          }),
        }
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Hugging Face receipt error:",
        response.status,
        errorText
      );

      return NextResponse.json(
        {
          error:
            "Receipt intelligence service failed.",
        },
        {
          status: 502,
        }
      );
    }

    const result =
      await response.json();

    const content =
      result?.choices?.[0]?.message
        ?.content;

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Receipt intelligence returned no result.",
        },
        {
          status: 502,
        }
      );
    }

    const parsed =
      parseModelJSON(content);

    const cleaned =
      validateExtraction(parsed);

    return NextResponse.json(
      cleaned
    );
  } catch (error) {
    console.error(
      "Receipt parsing error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to process receipt.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   MODEL JSON PARSER
========================================================= */

function parseModelJSON(
  content: string
): unknown {
  let cleaned =
    content.trim();

  /*
   * Handle accidental markdown fences even though
   * structured output should prevent them.
   */
  cleaned =
    cleaned
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /^```\s*/i,
        ""
      )
      .replace(
        /\s*```$/i,
        ""
      )
      .trim();

  try {
    return JSON.parse(
      cleaned
    );
  } catch {
    /*
     * Try to recover the first JSON object.
     */
    const start =
      cleaned.indexOf("{");

    const end =
      cleaned.lastIndexOf("}");

    if (
      start >= 0 &&
      end > start
    ) {
      return JSON.parse(
        cleaned.slice(
          start,
          end + 1
        )
      );
    }

    throw new Error(
      "Model returned invalid JSON."
    );
  }
}

/* =========================================================
   OUTPUT VALIDATION
========================================================= */

function validateExtraction(
  value: unknown
): ReceiptExtraction {
  const object =
    typeof value === "object" &&
    value !== null
      ? value as Record<
          string,
          unknown
        >
      : {};

  const vendor =
    typeof object.vendor ===
    "string"
      ? cleanVendor(
          object.vendor
        )
      : "";

  const amount =
    typeof object.amount ===
    "string"
      ? cleanAmount(
          object.amount
        )
      : "";

  const date =
    typeof object.date ===
    "string"
      ? normalizeDate(
          object.date
        )
      : "";

  const confidence =
    typeof object.confidence ===
    "number"
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              object.confidence
            )
          )
        )
      : 0;

  const documentType =
    typeof object.documentType ===
    "string"
      ? object.documentType
          .trim()
          .slice(0, 50)
      : "other";

  return {
    vendor,
    amount,
    date,
    confidence,
    documentType,
  };
}

function cleanVendor(
  value: string
): string {
  const ignored = [
    "receipt",
    "invoice",
    "bill",
    "payment",
    "payment receipt",
    "payment status",
    "payment confirmation",
    "success",
    "successful",
    "successfully",
    "amount",
    "total",
    "paid",
    "received",
  ];

  const cleaned =
    value
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (
    !cleaned ||
    cleaned.length > 100
  ) {
    return "";
  }

  if (
    ignored.includes(
      cleaned.toLowerCase()
    )
  ) {
    return "";
  }

  return cleaned;
}

function cleanAmount(
  value: string
): string {
  const normalized =
    value
      .replace(/[₹$€£]/g, "")
      .replace(
        /(?:rs\.?|inr)/gi,
        ""
      )
      .replace(/,/g, "")
      .trim();

  /*
   * Only accept a real numeric value.
   */
  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      normalized
    )
  ) {
    return "";
  }

  const number =
    Number(normalized);

  if (
    !Number.isFinite(number) ||
    number <= 0 ||
    number > 100000000
  ) {
    return "";
  }

  return number
    .toFixed(2)
    .replace(
      /\.00$/,
      ""
    );
}

function normalizeDate(
  value: string
): string {
  /*
   * Only accept the ISO format from the model.
   */
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return "";
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() + 1 !==
      month ||
    date.getDate() !==
      day
  ) {
    return "";
  }

  return value;
}