// Cabeçalhos de segurança HTTP. connect-src precisa liberar o domínio do Supabase
// (API REST + Realtime via WebSocket). img-src aceita https: porque o logo do
// restaurante é uma URL configurável em Configurações. Os demais recursos
// (script/estilo/fonte) só vêm do próprio site.
const isDev = process.env.NODE_ENV === "development";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Em desenvolvimento o Supabase pode rodar local (http://127.0.0.1:54321) — libera
// só a origem configurada, além do domínio padrão *.supabase.co.
const extraConnect = [];
if (supabaseUrl && !supabaseUrl.includes(".supabase.co")) {
  const origin = new URL(supabaseUrl).origin;
  extraConnect.push(origin, origin.replace(/^http/, "ws"));
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // 'unsafe-eval' só no dev (o React usa eval para mensagens de erro no modo de desenvolvimento).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  ["connect-src 'self' https://*.supabase.co wss://*.supabase.co", ...extraConnect].join(" "),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
