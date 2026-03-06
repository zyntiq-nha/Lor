import React from "react";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { createServiceRoleClient } from "@/lib/supabaseAdmin";
import { renderTemplate } from "@/lib/renderTemplate";
import QRCode from "qrcode";

export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: {
    paddingTop: 46,
    paddingBottom: 78,
    paddingHorizontal: 46,
    color: "#111827",
    fontFamily: "Helvetica"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 42
  },
  logo: {
    width: 130,
    height: 38,
    objectFit: "contain"
  },
  companyBlock: {
    textAlign: "right",
    fontSize: 11
  },
  dateLine: {
    marginTop: 6,
    fontSize: 11
  },
  title: {
    textAlign: "center",
    fontSize: 23,
    marginBottom: 14
  },
  subtitle: {
    textAlign: "center",
    fontSize: 12,
    marginBottom: 26
  },
  body: {
    textAlign: "justify",
    fontSize: 13,
    lineHeight: 1.72
  },
  bodyParagraph: {
    marginBottom: 11
  },
  closingSection: {
    marginTop: 10,
    width: 300,
    position: "relative",
    paddingBottom: 78
  },
  closingLine: {
    fontSize: 12,
    lineHeight: 1.14,
    marginBottom: 1
  },
  referenceId: {
    marginTop: 44,
    fontSize: 9,
    color: "#4b5563"
  },
  stampOverlay: {
    position: "absolute",
    width: 96,
    height: 96,
    left: 50,
    top: -15,
    objectFit: "contain"
  },
  qrCodeImage: {
    position: "absolute",
    width: 64,
    height: 64,
    left: 0,
    bottom: -10,
    objectFit: "contain"
  },
  footerWrap: {
    position: "absolute",
    left: 46,
    right: 46,
    bottom: 22
  },
  footerLine: {
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    marginBottom: 5
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#374151"
  }
});

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function toDataUri(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;

  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:${mime};base64,${base64}`;
}

function splitBodyAndClosing(content: string): { body: string; closing: string[] } {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const marker = normalized.toLowerCase().lastIndexOf("\nsincerely,");

  if (marker === -1) return { body: normalized, closing: [] };

  const body = normalized.slice(0, marker).trim();
  const closingText = normalized.slice(marker + 1).trim();
  const closingLines = closingText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return { body, closing: closingLines };
}

function buildReferenceId(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i += 1) {
    hash = (hash * 31 + content.charCodeAt(i)) >>> 0;
  }
  const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `ZYNTIQ-LOR-${dateTag}-${hash.toString(16).slice(0, 6).toUpperCase()}`;
}

function createLORDocument(content: string, logoSrc: string | null, signSealSrc: string | null, qrCodeSrc: string | null) {
  const { body, closing } = splitBodyAndClosing(content);
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const referenceId = buildReferenceId(content);

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        logoSrc ? React.createElement(Image, { src: logoSrc, style: styles.logo }) : React.createElement(View, null),
        React.createElement(
          View,
          { style: styles.companyBlock },
          React.createElement(Text, null, "Zyntiq (OPC) Pvt Ltd"),
          React.createElement(Text, { style: styles.dateLine }, `Date: ${formatToday()}`)
        )
      ),
      React.createElement(Text, { style: styles.title }, "Letter of Recommendation"),
      React.createElement(Text, { style: styles.subtitle }, "To whomsoever it may concern"),
      React.createElement(
        View,
        { style: styles.body },
        ...paragraphs.map((line, index) =>
          React.createElement(Text, { key: `p-${index}`, style: styles.bodyParagraph }, line)
        )
      ),
      React.createElement(
        Text,
        { style: [styles.body, { marginTop: 2 }] },
        "We wish them success in their future academic and professional endeavors."
      ),
      closing.length > 0
        ? React.createElement(
          View,
          { style: styles.closingSection },
          ...closing.map((line, index) =>
            React.createElement(Text, { key: `c-${index}`, style: styles.closingLine }, line)
          ),
          React.createElement(Text, { style: styles.referenceId }, `Reference ID: ${referenceId}`),
          signSealSrc ? React.createElement(Image, { src: signSealSrc, style: styles.stampOverlay }) : null,
          qrCodeSrc ? React.createElement(Image, { src: qrCodeSrc, style: styles.qrCodeImage }) : null
        )
        : null,
      React.createElement(
        View,
        { style: styles.footerWrap },
        React.createElement(View, { style: styles.footerLine }),
        React.createElement(
          View,
          { style: styles.footerRow },
          React.createElement(Text, null, "contact@zyntiq.in"),
          React.createElement(Text, null, "Generated by Zyntiq LOR Portal")
        )
      )
    )
  );
}

export async function POST(request: Request) {
  const supabase = createServiceRoleClient();
  const { token, fileName } = await request.json();
  const cleanToken = String(token || "").trim();

  if (!cleanToken) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const { data: user, error: userErr } = await supabase
    .from("lor_users")
    .select("name,role,tenure,template_id,last_downloaded_at")
    .eq("token", cleanToken)
    .maybeSingle();

  if (userErr || !user) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  if (user.last_downloaded_at) {
    const timeDiff = Date.now() - new Date(user.last_downloaded_at).getTime();
    if (timeDiff < 60000) {
      return NextResponse.json({ error: "Please wait 1 minute before generating another copy." }, { status: 429 });
    }
  }

  await supabase
    .from("lor_users")
    .update({ last_downloaded_at: new Date().toISOString() })
    .eq("token", cleanToken);

  const { data: template, error: templateErr } = await supabase
    .from("templates")
    .select("template_content,is_active")
    .eq("id", user.template_id)
    .eq("is_active", true)
    .maybeSingle();

  if (templateErr || !template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const today = formatToday();
  const safeContent = renderTemplate(template.template_content, {
    name: user.name,
    Name: user.name,
    role: user.role,
    Role: user.role,
    tenure: user.tenure,
    Tenure: user.tenure,
    date: today,
    Date: today
  });

  const assetsDir = path.join(process.cwd(), "public", "assets");
  const logoSrc = toDataUri(path.join(assetsDir, "logo.png"));
  const signSealSrc = toDataUri(path.join(assetsDir, "seal&sign.png"));

  const { origin } = new URL(request.url);
  const verificationUrl = `${origin}/verify?token=${cleanToken}`;
  const qrCodeSrc = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 128 });

  const blob = await pdf(createLORDocument(safeContent, logoSrc, signSealSrc, qrCodeSrc)).toBlob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName || "LOR.pdf"}"`
    }
  });
}