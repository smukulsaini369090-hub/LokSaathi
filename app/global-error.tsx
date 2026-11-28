"use client";

import React, { useEffect } from "react";

/**
 * Root-level standalone Global Error Boundary.
 * Deliberately has ZERO React Context imports and uses self-contained styles so it renders
 * safely under strict CSP even if RootLayout or providers fail.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn("LokSaathi global boundary recovered:", error?.digest || "global_error");
  }, [error?.digest]);

  return (
    <html lang="hi">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
          color: "#0f172a",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <main
          role="main"
          style={{
            maxWidth: "460px",
            width: "100%",
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "24px",
            padding: "28px",
            textAlign: "center",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 14px",
              borderRadius: "12px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "20px",
            }}
          >
            लो
          </div>

          <h1 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>
            अस्थायी तकनीकी बाधा / Temporary Technical Issue
          </h1>
          <p style={{ fontSize: "15px", color: "#334155", lineHeight: 1.6, margin: "0 0 20px" }}>
            कृपया 'फिर कोशिश करें' दबाएं या होम पेज पर वापस जाएं। आपका स्थानीय डेटा सुरक्षित है।
            <br />
            Please tap Try Again or return Home. Your saved local data remains safe.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: "48px",
                padding: "12px 20px",
                borderRadius: "14px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              फिर कोशिश करें / Try Again
            </button>

            <a
              href="/"
              style={{
                minHeight: "48px",
                padding: "12px 20px",
                borderRadius: "14px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f1f5f9",
                color: "#0f172a",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              होम पर जाएं / Go Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
