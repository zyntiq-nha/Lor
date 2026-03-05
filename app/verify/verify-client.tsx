"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import LORPreview from "@/components/LORPreview";
import type { VerifyResponse } from "@/types/db";

export default function VerifyClientPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const body = token ? { token } : { name, email };

    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    setLoading(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({ error: "Unable to verify" }));
      setError(payload.error || "Unable to verify");
      return;
    }

    const payload = (await res.json()) as VerifyResponse;
    setResult(payload);
  }

  return (
    <main className="container page">
      <div className="grid two">
        <form className="card form-grid" onSubmit={onSubmit}>
          <h2 className="panel-title">Verify & Get LOR</h2>
          {token ? (
            <p className="muted">Secure token detected. Click Get LOR to continue.</p>
          ) : (
            <>
              <div>
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  suppressHydrationWarning
                />
              </div>
            </>
          )}

          <button className="btn" type="submit" disabled={loading} suppressHydrationWarning>
            {loading ? "Getting..." : "Get LOR"}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </form>

        {result ? (
          <LORPreview initialContent={result.content} verifyToken={result.verify_token} />
        ) : (
          <section className="card empty-note muted">Get LOR to preview your letter.</section>
        )}
      </div>
    </main>
  );
}