"use client";

import { useRef, useState } from "react";
import { Camera, Check, FileImage, Loader2, X } from "lucide-react";
import { createWorker } from "tesseract.js";

type ReceiptData = {
  vendor: string;
  amount: string;
  date: string;
};

type Props = {
  onDetected: (data: ReceiptData) => void;
  onClose: () => void;
};

export default function ReceiptScanner({
  onDetected,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [scanning, setScanning] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const scanReceipt = async (
    file: File
  ) => {
    setError("");
    setScanning(true);
    setProgress(0);

    const imageUrl =
      URL.createObjectURL(file);

    setPreview(imageUrl);

    try {
      const worker = await createWorker(
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
                  message.progress * 100
                )
              );
            }
          },
        }
      );

      const result =
        await worker.recognize(file);

      const text =
        result.data.text;

      await worker.terminate();

      const parsed =
        parseReceipt(text);

      onDetected(parsed);
    } catch (err) {
      console.error(err);

      setError(
        "Couldn't read this receipt. You can still enter the expense manually."
      );
    } finally {
      setScanning(false);
    }
  };

  const handleFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/")
    ) {
      setError(
        "Please upload an image of the receipt."
      );
      return;
    }

    scanReceipt(file);
  };

  return (
    <div className="receipt-scanner">

      <div className="receipt-header">

        <div>
          <span className="section-kicker">
            PENNYPILOT VISION
          </span>

          <h2>
            Scan a receipt
          </h2>

          <p>
            Extract expense details
            automatically.
          </p>
        </div>

        <button
          className="close-button"
          onClick={onClose}
        >
          <X size={18} />
        </button>

      </div>

      {!preview && !scanning && (
        <button
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
            JPG, PNG or WEBP
          </span>

          <span className="receipt-upload-action">
            Choose image
          </span>
        </button>
      )}

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
                Reading receipt...
              </strong>

              <span>
                {progress}%
              </span>

            </div>
          )}

          {!scanning && !error && (
            <div className="receipt-complete">
              <Check size={20} />
              Receipt processed
            </div>
          )}

        </div>
      )}

      {error && (
        <div className="receipt-error">
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
      />

      {!scanning && (
        <div className="receipt-footer">

          <button
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
   RECEIPT PARSER
========================================================= */

function parseReceipt(
  text: string
): ReceiptData {
  const lines = text
    .split("\n")
    .map((line) =>
      line.trim()
    )
    .filter(Boolean);

  /*
   * Try to identify a monetary
   * value from the receipt.
   *
   * We intentionally prefer values
   * near TOTAL / AMOUNT keywords.
   */

  const totalPatterns = [
    /(?:grand\s*total|total\s*amount|amount\s*due|net\s*amount|total)[^\d₹]*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,

    /₹\s*([\d,]+(?:\.\d{1,2})?)/i,

    /\b([\d,]+\.\d{2})\b/,
  ];

  let amount = "";

  for (
    const pattern of totalPatterns
  ) {
    const match =
      text.match(pattern);

    if (match?.[1]) {
      amount =
        match[1].replace(
          /,/g,
          ""
        );

      break;
    }
  }

  /*
   * Try to detect a date.
   */

  let date = "";

  const dateMatch = text.match(
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/
  );

  if (dateMatch) {
    const day =
      dateMatch[1].padStart(2, "0");

    const month =
      dateMatch[2].padStart(2, "0");

    let year =
      dateMatch[3];

    if (year.length === 2) {
      year = `20${year}`;
    }

    date =
      `${year}-${month}-${day}`;
  }

  /*
   * Vendor heuristic:
   *
   * Usually the first meaningful
   * non-numeric line is the store
   * / business name.
   */

  const ignored = [
    "receipt",
    "invoice",
    "tax invoice",
    "bill",
    "cash memo",
    "gst",
  ];

  let vendor = "";

  for (const line of lines) {
    const normalized =
      line.toLowerCase();

    const looksNumeric =
      /^[₹$€£\d\s,./:-]+$/.test(
        line
      );

    const looksLikeTotal =
      normalized.includes(
        "total"
      ) ||
      normalized.includes(
        "amount"
      );

    if (
      line.length >= 3 &&
      line.length <= 60 &&
      !looksNumeric &&
      !looksLikeTotal &&
      !ignored.includes(
        normalized
      )
    ) {
      vendor = line;
      break;
    }
  }

  return {
    vendor,
    amount,
    date,
  };
}