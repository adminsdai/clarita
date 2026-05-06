import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1A1F2A",
    lineHeight: 1.5,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#7C5CFF",
    paddingBottom: 14,
    marginBottom: 22,
  },
  brand: {
    fontSize: 9,
    color: "#7C5CFF",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#6B7280",
  },
  section: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  glosa: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 8,
  },
  h1: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 6,
    color: "#111827",
  },
  h2: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 5,
    color: "#1F2937",
  },
  h3: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 4,
    color: "#1F2937",
  },
  p: { marginBottom: 6 },
  bullet: { flexDirection: "row", marginBottom: 3, paddingLeft: 8 },
  bulletDot: { width: 12 },
  bulletText: { flex: 1 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    fontSize: 8,
    color: "#9CA3AF",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
});

type Block =
  | { type: "h1" | "h2" | "h3" | "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function parseMarkdown(md: string): Block[] {
  const lines = md.split(/\r?\n/);
  const blocks: Block[] = [];
  let buffer: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (buffer.length > 0) {
      const text = buffer.join(" ").trim();
      if (text) blocks.push({ type: "p", text: stripInlineMd(text) });
      buffer = [];
    }
  };
  const flushList = () => {
    if (listType && listItems.length > 0) {
      blocks.push({ type: listType, items: listItems.map(stripInlineMd) });
    }
    listType = null;
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (line.startsWith("# ")) {
      flushParagraph(); flushList();
      blocks.push({ type: "h1", text: stripInlineMd(line.slice(2).trim()) });
    } else if (line.startsWith("## ")) {
      flushParagraph(); flushList();
      blocks.push({ type: "h2", text: stripInlineMd(line.slice(3).trim()) });
    } else if (line.startsWith("### ")) {
      flushParagraph(); flushList();
      blocks.push({ type: "h3", text: stripInlineMd(line.slice(4).trim()) });
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      if (listType !== "ul") { flushList(); listType = "ul"; }
      listItems.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph();
      if (listType !== "ol") { flushList(); listType = "ol"; }
      listItems.push(line.replace(/^\s*\d+\.\s+/, ""));
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

function stripInlineMd(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)");
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
    timeStyle: "short",
  }).format(fecha);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>CDT — ASISTENTE LPDP</Text>
          <Text style={styles.title}>Reporte de análisis legal</Text>
          <Text style={styles.meta}>
            {userName} · {fechaFmt}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Caso descrito</Text>
          <Text style={styles.glosa}>{glosa}</Text>
        </View>

        {blocks.map((block, i) => {
          if (block.type === "h1") return <Text key={i} style={styles.h1}>{block.text}</Text>;
          if (block.type === "h2") return <Text key={i} style={styles.h2}>{block.text}</Text>;
          if (block.type === "h3") return <Text key={i} style={styles.h3}>{block.text}</Text>;
          if (block.type === "p") return <Text key={i} style={styles.p}>{block.text}</Text>;
          if (block.type === "ul" || block.type === "ol") {
            return (
              <View key={i}>
                {block.items.map((item, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>
                      {block.type === "ul" ? "•" : `${j + 1}.`}
                    </Text>
                    <Text style={styles.bulletText}>{item}</Text>
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
            `Reporte generado por CDT · LPDP Chile · página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
