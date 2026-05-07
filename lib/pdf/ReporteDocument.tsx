import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    padding: 56,
    paddingBottom: 72,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1A1F2A",
    lineHeight: 1.6,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#1A1F2A",
    paddingBottom: 12,
    marginBottom: 24,
  },
  brand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    color: "#374151",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#111827",
  },
  meta: {
    fontSize: 9,
    color: "#6B7280",
  },
  h1: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
    marginBottom: 8,
    color: "#111827",
  },
  h2: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
    color: "#1F2937",
  },
  h3: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 4,
    color: "#1F2937",
  },
  p: {
    marginBottom: 8,
    textAlign: "justify" as const,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  italic: {
    fontFamily: "Helvetica-Oblique",
  },
  bullet: {
    flexDirection: "row" as const,
    marginBottom: 4,
    paddingLeft: 12,
  },
  bulletDot: { width: 14 },
  bulletText: { flex: 1 },
  footer: {
    position: "absolute" as const,
    bottom: 24,
    left: 56,
    right: 56,
    fontSize: 7.5,
    color: "#9CA3AF",
    textAlign: "center" as const,
    borderTopWidth: 0.5,
    borderTopColor: "#D1D5DB",
    paddingTop: 8,
  },
});

type Span = { text: string; bold: boolean; italic: boolean };

type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; spans: Span[] }
  | { type: "ul"; items: Span[][] }
  | { type: "ol"; items: Span[][] };

function parseInline(s: string): Span[] {
  const spans: Span[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)|([^*`[]+)/g;
  let match;
  while ((match = regex.exec(s)) !== null) {
    if (match[1] !== undefined) {
      spans.push({ text: match[1], bold: true, italic: false });
    } else if (match[2] !== undefined) {
      spans.push({ text: match[2], bold: false, italic: true });
    } else if (match[3] !== undefined) {
      spans.push({ text: match[3], bold: false, italic: false });
    } else if (match[4] !== undefined) {
      spans.push({ text: `${match[4]} (${match[5]})`, bold: false, italic: false });
    } else if (match[6] !== undefined) {
      spans.push({ text: match[6], bold: false, italic: false });
    }
  }
  return spans.length > 0 ? spans : [{ text: s, bold: false, italic: false }];
}

function parseMarkdown(md: string): Block[] {
  const lines = md.split(/\r?\n/);
  const blocks: Block[] = [];
  let buffer: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: Span[][] = [];

  const flushParagraph = () => {
    if (buffer.length > 0) {
      const text = buffer.join(" ").trim();
      if (text) blocks.push({ type: "p", spans: parseInline(text) });
      buffer = [];
    }
  };
  const flushList = () => {
    if (listType && listItems.length > 0) {
      blocks.push({ type: listType, items: listItems });
    }
    listType = null;
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (line.startsWith("# ")) {
      flushParagraph(); flushList();
      blocks.push({ type: "h1", text: line.slice(2).trim() });
    } else if (line.startsWith("## ")) {
      flushParagraph(); flushList();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
    } else if (line.startsWith("### ")) {
      flushParagraph(); flushList();
      blocks.push({ type: "h3", text: line.slice(4).trim() });
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      if (listType !== "ul") { flushList(); listType = "ul"; }
      listItems.push(parseInline(line.replace(/^\s*[-*]\s+/, "")));
    } else if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph();
      if (listType !== "ol") { flushList(); listType = "ol"; }
      listItems.push(parseInline(line.replace(/^\s*\d+\.\s+/, "")));
    } else if (line.trim() === "") {
      flushParagraph(); flushList();
    } else {
      flushList();
      buffer.push(line.trim());
    }
  }
  flushParagraph(); flushList();
  return blocks;
}

function RenderSpans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((span, i) => (
        <Text
          key={i}
          style={
            span.bold
              ? styles.bold
              : span.italic
                ? styles.italic
                : undefined
          }
        >
          {span.text}
        </Text>
      ))}
    </>
  );
}

export function ReporteDocument({
  glosa,
  reporteMarkdown,
  fecha,
  userName,
}: {
  glosa: string;
  reporteMarkdown: string;
  fecha: Date;
  userName: string;
}) {
  const blocks = parseMarkdown(reporteMarkdown);
  const fechaFmt = new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
  }).format(fecha);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>CLARITA — ASISTENTE DE DERECHOS DE DATOS</Text>
          <Text style={styles.title}>Solicitud de Ejercicio de Derechos</Text>
          <Text style={styles.meta}>
            {userName} · {fechaFmt}
          </Text>
        </View>

        {blocks.map((block, i) => {
          if (block.type === "h1")
            return <Text key={i} style={styles.h1}>{block.text}</Text>;
          if (block.type === "h2")
            return <Text key={i} style={styles.h2}>{block.text}</Text>;
          if (block.type === "h3")
            return <Text key={i} style={styles.h3}>{block.text}</Text>;
          if (block.type === "p")
            return (
              <Text key={i} style={styles.p}>
                <RenderSpans spans={block.spans} />
              </Text>
            );
          if (block.type === "ul" || block.type === "ol") {
            return (
              <View key={i}>
                {block.items.map((item, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>
                      {block.type === "ul" ? "•" : `${j + 1}.`}
                    </Text>
                    <Text style={styles.bulletText}>
                      <RenderSpans spans={item} />
                    </Text>
                  </View>
                ))}
              </View>
            );
          }
          return null;
        })}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Documento generado por Clarita · Herramienta de IA · No constituye asesoría jurídica · Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
