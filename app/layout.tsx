import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CDT — Asistente LPDP",
  description:
    "Convierte el derecho de protección de datos personales en algo ejecutable: entiende decisiones automatizadas y acciona sobre ellas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className="dark">
      <body>{children}</body>
    </html>
  );
}
