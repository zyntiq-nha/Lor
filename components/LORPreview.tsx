"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  initialContent: string;
  verifyToken: string;
};

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function splitBodyAndClosing(content: string): { body: string[]; closing: string[] } {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const marker = normalized.toLowerCase().lastIndexOf("\nsincerely,");

  if (marker === -1) {
    return {
      body: normalized.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean),
      closing: []
    };
  }

  const body = normalized
    .slice(0, marker)
    .trim()
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  const closing = normalized
    .slice(marker + 1)
    .trim()
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  return { body, closing };
}

export default function LORPreview({ initialContent, verifyToken }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections = useMemo(() => splitBodyAndClosing(initialContent), [initialContent]);

  async function handleDownload() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyToken, fileName: "LOR.pdf" })
      });

      if (!res.ok) throw new Error("Failed to generate LOR");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "LOR.pdf";
      a.rel = "noopener";
      a.click();

      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card form-grid">
      <h3 className="panel-title">Preview LOR</h3>

      <div className="lor-paper">
        <div className="lor-header">
          <Image
            className="lor-logo"
            src="/assets/logo.png"
            alt="Company logo"
            width={128}
            height={36}
          />
          <div className="lor-company-block">
            <div>Zyntiq (OPC) Pvt Ltd</div>
            <div className="lor-date">Date: {formatToday()}</div>
          </div>
        </div>

        <h2 className="lor-title">Letter of Recommendation</h2>
        <p className="lor-subtitle">To whomsoever it may concern</p>

        <div className="lor-body">
          {sections.body.map((paragraph, idx) => (
            <p key={`body-${idx}`}>{paragraph}</p>
          ))}
        </div>

        {sections.closing.length > 0 ? (
          <div className="lor-closing">
            {sections.closing.map((line, idx) => (
              <p key={`close-${idx}`}>{line}</p>
            ))}
            <Image
              className="lor-stamp"
              src="/assets/seal&sign.png"
              alt="Seal and signature"
              width={98}
              height={98}
            />
          </div>
        ) : null}

        <div className="lor-footer">Email: contact@zyntiq.in</div>
      </div>

      <div className="row">
        <button className="btn" type="button" onClick={handleDownload} disabled={loading}>
          {loading ? "Preparing..." : "Download"}
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}