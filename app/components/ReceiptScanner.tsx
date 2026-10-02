"use client";

import { useRef, useState } from "react";
import {
  Camera,
  Check,
  FileImage,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import {
  createWorker,
  PSM,
} from "tesseract.js";

type ReceiptData = {
  vendor: string;
  amount: string;
  date: string;
};

type Props = {
  onDetected: (data: ReceiptData) => void;
  onClose: () => void;
};

type AIReceiptResult = {
  vendor: string;
  amount: string;
  date: string;
  confidence: number;
  documentType: string;
};

export default function ReceiptScanner({
  onDetected,
  onClose,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [scanning, setScanning] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [status, setStatus] =
    useState("");

  const resetScanner = () => {
    setPreview(null);
    setError("");
    setStatus("");
    setProgress(0);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const scanReceipt = async (
    file: File
  ) => {
    setError("");
    setScanning(true);
    setProgress(0);

    const imageUrl =
      URL.createObjectURL(file);

    setPreview(imageUrl);

    let worker:
      | Awaited<
          ReturnType<typeof createWorker>
        >
      | null = null;

    try {
      /* =====================================================
         STEP 1 — PREPARE IMAGE
      ===================================================== */

      setStatus(
        "Preparing receipt…"
      );

      const image =
        await preprocessReceipt(
          file
        );

      /* =====================================================
         STEP 2 — TESSERACT
      ===================================================== */

      setStatus(
        "Reading receipt…"
      );

      worker =
        await createWorker(
          "eng",
          1,
          {
            logger: (message) => {
              if (
                message.status ===
                  "recognizing text" &&
                typeof message.progress ===
                  "number"
              ) {
                setProgress(
                  Math.round(
                    message.progress *
                      65
                  )
                );
              }
            },
          }
        );

      /*
       * First pass:
       *
       * Receipt/invoice style document.
       */
      await worker.setParameters(
        {
          preserve_interword_spaces:
            "1",

          tessedit_pageseg_mode:
            PSM.SINGLE_BLOCK,
        }
      );

      const singleBlock =
        await worker.recognize(
          image,
          {},
          {
            text: true,
            blocks: true,
          }
        );

      /*
       * Second pass:
       *
       * Payment confirmations and documents where text
       * is scattered around the page.
       */
      await worker.setParameters(
        {
          preserve_interword_spaces:
            "1",

          tessedit_pageseg_mode:
            PSM.SPARSE_TEXT,
        }
      );

      const sparse =
        await worker.recognize(
          image,
          {},
          {
            text: true,
            blocks: true,
          }
        );

      const singleText =
        singleBlock.data.text ||
        "";

      const sparseText =
        sparse.data.text ||
        "";

      /*
       * Preserve both OCR passes.
       *
       * GPT-OSS gets the raw evidence and decides which
       * interpretation is correct.
       */
      const combinedOCR = [
        "=== OCR PASS: SINGLE BLOCK ===",
        singleText,
        "",
        "=== OCR PASS: SPARSE TEXT ===",
        sparseText,
      ].join("\n");

      console.log(
        "PennyPilot OCR:",
        combinedOCR
      );

      if (
        !combinedOCR.trim()
      ) {
        throw new Error(
          "OCR produced no text."
        );
      }

      setProgress(70);

      /* =====================================================
         STEP 3 — GPT-OSS
      ===================================================== */

      setStatus(
        "Understanding receipt…"
      );

      const aiResult =
        await extractWithAI(
          combinedOCR
        );

      setProgress(100);

      console.log(
        "PennyPilot AI extraction:",
        aiResult
      );

      /* =====================================================
         STEP 4 — FINAL VALIDATION
      ===================================================== */

      const finalResult =
        validateAIResult(
          aiResult
        );

      /*
       * Send only the fields expected by the existing dashboard.
       *
       * The dashboard remains responsible for category,
       * payment method, user review and database saving.
       */
      onDetected({
        vendor:
          finalResult.vendor,

        amount:
          finalResult.amount,

        date:
          finalResult.date,
      });
    } catch (err) {
      console.error(
        "PennyPilot scanner error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Couldn't process this receipt. Try another image or enter the expense manually."
      );
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Worker cleanup failure should not block the UI.
        }
      }

      URL.revokeObjectURL(
        imageUrl
      );

      setScanning(false);
      setStatus("");
    }
  };

  const handleFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please upload an image of the receipt."
      );
      return;
    }

    if (
      file.size >
      15 * 1024 * 1024
    ) {
      setError(
        "Please choose an image smaller than 15 MB."
      );
      return;
    }

    void scanReceipt(file);
  };

  return (
    <div className="receipt-scanner">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="receipt-header">
        <div>
          <span className="section-kicker">
            PENNYPILOT VISION
          </span>

          <h2>
            Scan a receipt
          </h2>

          <p>
            AI-powered receipt
            extraction.
          </p>
        </div>

        <button
          type="button"
          className="close-button"
          onClick={onClose}
          disabled={scanning}
          aria-label="Close receipt scanner"
        >
          <X size={18} />
        </button>
      </div>

      {/* =====================================================
          UPLOAD
      ===================================================== */}

      {!preview &&
        !scanning && (
          <button
            type="button"
            className="receipt-dropzone"
            onClick={() =>
              inputRef.current?.click()
            }
          >
            <div className="receipt-upload-icon">
              <Camera size={26} />
            </div>

            <strong>
              Upload receipt image
            </strong>

            <span>
              Receipt, invoice,
              payment slip or bill
            </span>

            <span className="receipt-upload-action">
              Choose image
            </span>
          </button>
        )}

      {/* =====================================================
          PREVIEW
      ===================================================== */}

      {preview && (
        <div className="receipt-preview">
          <img
            src={preview}
            alt="Receipt preview"
          />

          {scanning && (
            <div className="receipt-scanning">
              <Loader2
                size={24}
                className="spin"
              />

              <strong>
                {status ||
                  "Processing receipt…"}
              </strong>

              <span>
                {progress}%
              </span>

              <div
                style={{
                  width: "100%",
                  maxWidth: "260px",
                  height: "5px",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(0,0,0,0.08)",
                  overflow:
                    "hidden",
                  marginTop:
                    "8px",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    borderRadius:
                      "999px",
                    background:
                      "currentColor",
                    transition:
                      "width 180ms ease",
                  }}
                />
              </div>
            </div>
          )}

          {!scanning &&
            !error && (
              <div className="receipt-complete">
                <Check size={20} />
                Receipt processed
              </div>
            )}
        </div>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="receipt-error">
          {error}
        </div>
      )}

      {/* =====================================================
          FILE INPUT
      ===================================================== */}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        capture="environment"
        hidden
        onChange={handleFile}
      />

      {/* =====================================================
          FOOTER
      ===================================================== */}

      {!scanning && (
        <div className="receipt-footer">
          {preview && (
            <button
              type="button"
              className="secondary-button"
              onClick={
                resetScanner
              }
            >
              <RotateCcw size={16} />
              Scan another
            </button>
          )}

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              inputRef.current?.click()
            }
          >
            <FileImage size={16} />

            {preview
              ? "Choose another"
              : "Upload receipt"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Enter manually
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   GPT-OSS EXTRACTION
========================================================= */

async function extractWithAI(
  ocrText: string
): Promise<AIReceiptResult> {
  const response =
    await fetch(
      "/api/receipt/parse",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          ocrText,
        }),
      }
    );

  let payload:
    | Record<string, unknown>
    | null = null;

  try {
    payload =
      await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload?.error ===
      "string"
        ? payload.error
        : "AI receipt extraction failed.";

    throw new Error(
      message
    );
  }

  return {
    vendor:
      typeof payload?.vendor ===
      "string"
        ? payload.vendor
        : "",

    amount:
      typeof payload?.amount ===
      "string"
        ? payload.amount
        : "",

    date:
      typeof payload?.date ===
      "string"
        ? payload.date
        : "",

    confidence:
      typeof payload?.confidence ===
      "number"
        ? payload.confidence
        : 0,

    documentType:
      typeof payload?.documentType ===
      "string"
        ? payload.documentType
        : "other",
  };
}

/* =========================================================
   FINAL CLIENT-SIDE VALIDATION
========================================================= */

function validateAIResult(
  result: AIReceiptResult
): AIReceiptResult {
  let amount = "";

  if (
    /^\d+(?:\.\d{1,2})?$/.test(
      result.amount
    )
  ) {
    const numeric =
      Number(
        result.amount
      );

    if (
      Number.isFinite(
        numeric
      ) &&
      numeric > 0 &&
      numeric <= 100000000
    ) {
      amount =
        numeric
          .toFixed(2)
          .replace(
            /\.00$/,
            ""
          );
    }
  }

  let date = "";

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      result.date
    )
  ) {
    const parsed =
      new Date(
        `${result.date}T00:00:00`
      );

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      date =
        result.date;
    }
  }

  return {
    vendor:
      cleanVendor(
        result.vendor
      ),

    amount,

    date,

    confidence:
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            result.confidence
          )
        )
      ),

    documentType:
      result.documentType ||
      "other",
  };
}

function cleanVendor(
  value: string
): string {
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

  const ignored = [
    "receipt",
    "invoice",
    "bill",
    "payment",
    "payment receipt",
    "payment status",
    "payment confirmation",
    "successful",
    "successfully",
    "amount",
    "total",
    "paid",
    "received",
  ];

  if (
    ignored.includes(
      cleaned.toLowerCase()
    )
  ) {
    return "";
  }

  return cleaned;
}

/* =========================================================
   IMAGE PREPROCESSING
========================================================= */

async function preprocessReceipt(
  file: File
): Promise<HTMLCanvasElement> {
  const image =
    await loadImage(file);

  const originalWidth =
    image.naturalWidth;

  const originalHeight =
    image.naturalHeight;

  const minimumWidth =
    1800;

  const maximumWidth =
    3000;

  let width =
    originalWidth;

  let height =
    originalHeight;

  if (
    width <
    minimumWidth
  ) {
    const scale =
      minimumWidth /
      width;

    width =
      Math.round(
        width * scale
      );

    height =
      Math.round(
        height * scale
      );
  }

  if (
    width >
    maximumWidth
  ) {
    const scale =
      maximumWidth /
      width;

    width =
      Math.round(
        width * scale
      );

    height =
      Math.round(
        height * scale
      );
  }

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    width;

  canvas.height =
    height;

  const context =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true,
      }
    );

  if (!context) {
    throw new Error(
      "Could not prepare receipt image."
    );
  }

  context.fillStyle =
    "#ffffff";

  context.fillRect(
    0,
    0,
    width,
    height
  );

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  /*
   * Grayscale + moderate contrast.
   *
   * Don't aggressively threshold because payment
   * confirmations often contain colored UI elements.
   */
  const imageData =
    context.getImageData(
      0,
      0,
      width,
      height
    );

  const pixels =
    imageData.data;

  const contrast =
    1.3;

  const midpoint =
    128;

  for (
    let i = 0;
    i <
    pixels.length;
    i += 4
  ) {
    const red =
      pixels[i];

    const green =
      pixels[i + 1];

    const blue =
      pixels[i + 2];

    let gray =
      0.299 * red +
      0.587 * green +
      0.114 * blue;

    gray =
      (gray -
        midpoint) *
        contrast +
      midpoint;

    gray =
      Math.max(
        0,
        Math.min(
          255,
          gray
        )
      );

    pixels[i] =
      gray;

    pixels[i + 1] =
      gray;

    pixels[i + 2] =
      gray;
  }

  context.putImageData(
    imageData,
    0,
    0
  );

  return canvas;
}

function loadImage(
  file: File
): Promise<HTMLImageElement> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const url =
        URL.createObjectURL(
          file
        );

      const image =
        new Image();

      image.onload = () => {
        URL.revokeObjectURL(
          url
        );

        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          url
        );

        reject(
          new Error(
            "Could not load receipt image."
          )
        );
      };

      image.src =
        url;
    }
  );
}