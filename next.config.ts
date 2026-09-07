import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança aplicados a todas as rotas.
 *
 * Não há Content-Security-Policy aqui de propósito: uma CSP restritiva exige
 * nonce por requisição para os scripts inline do Next (hidratação) e o script
 * de tema, o que pede plumbing no proxy. Sem nonce, uma CSP com
 * 'unsafe-inline' daria falsa sensação de proteção. Fica como próximo passo.
 */
const securityHeaders = [
  // Só HTTPS, inclusive subdomínios. A Vercel já serve TLS em todos os domínios.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Impede o navegador de "adivinhar" o tipo de um arquivo servido.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nenhuma página pode ser embutida em iframe — corta clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  // Não vaza o caminho completo da página para sites externos.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O app não usa nenhuma dessas APIs; desligar reduz a superfície.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  // Não anuncia a stack no cabeçalho X-Powered-By.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
