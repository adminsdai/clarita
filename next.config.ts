import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  // Fuerza la inclusión de KB y prompts en el bundle de la función
  // serverless. Sin esto, Vercel puede excluirlos por usar fs.readFile
  // dinámico (no traceable estáticamente).
  outputFileTracingIncludes: {
    "/api/solicitudes": ["./knowledge-base/**/*", "./prompts/**/*"],
    "/api/solicitudes/[id]": ["./knowledge-base/**/*", "./prompts/**/*"],
    "/api/solicitudes/[id]/pdf": ["./knowledge-base/**/*", "./prompts/**/*"],
  },
};

export default nextConfig;
