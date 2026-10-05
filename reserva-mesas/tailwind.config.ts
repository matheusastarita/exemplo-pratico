import type { Config } from "tailwindcss";

// Todas as cores vêm de variáveis CSS (canais RGB) definidas em globals.css, pra
// funcionar com /opacidade do Tailwind. A cor da marca (--brand e derivadas) é
// calculada a partir de restaurant_settings.primary_color e injetada no <html>
// pelo layout raiz — trocar a cor em Configurações repinta o app inteiro.
const v = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        white: v("white"),
        stone: {
          50: v("stone-50"),
          100: v("stone-100"),
          200: v("stone-200"),
          300: v("stone-300"),
          400: v("stone-400"),
          500: v("stone-500"),
          600: v("stone-600"),
          700: v("stone-700"),
          800: v("stone-800"),
          900: v("stone-900"),
          950: v("stone-950"),
        },
        red: {
          50: v("red-50"),
          100: v("red-100"),
          200: v("red-200"),
          300: v("red-300"),
          400: v("red-400"),
          600: v("red-600"),
          700: v("red-700"),
        },
        emerald: {
          50: v("emerald-50"),
          700: v("emerald-700"),
        },
        amber: {
          50: v("amber-50"),
          100: v("amber-100"),
          700: v("amber-700"),
          800: v("amber-800"),
        },
        // Cor da marca do restaurante (configurável).
        //   DEFAULT  fundo de botões/realces
        //   dark     hover/pressionado
        //   soft     fundo suave (chips, seleção)
        //   ink      versão escura o bastante pra texto sobre o creme (contraste AA)
        //   contrast cor do texto sobre a marca (branco ou quase preto, conforme o contraste)
        brand: {
          DEFAULT: v("brand"),
          dark: v("brand-dark"),
          soft: v("brand-soft"),
          ink: v("brand-ink"),
          contrast: v("brand-contrast"),
        },
        accent: {
          DEFAULT: v("accent"),
          dark: v("accent-dark"),
          light: v("accent-light"),
        },
        cream: v("cream"),
        // Cor única por status — usar em Badge, mapa de mesas, calendário etc. em vez
        // de escolher uma paleta Tailwind à mão. Sempre acompanhada de rótulo/ícone.
        status: {
          confirmed: v("status-confirmed"),
          "confirmed-bg": v("status-confirmed-bg"),
          pending: v("status-pending"),
          "pending-bg": v("status-pending-bg"),
          seated: v("status-seated"),
          "seated-bg": v("status-seated-bg"),
          completed: v("status-completed"),
          "completed-bg": v("status-completed-bg"),
          "no-show": v("status-no-show"),
          "no-show-bg": v("status-no-show-bg"),
          cancelled: v("status-cancelled"),
          "cancelled-bg": v("status-cancelled-bg"),
          late: v("status-late"),
          "late-bg": v("status-late-bg"),
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      borderRadius: {
        control: "var(--r-control)", // inputs, selects, chips pequenos
        card: "var(--r-card)", // cards, painéis, modais/sheets
      },
      boxShadow: {
        card: "0 2px 20px rgba(28, 25, 23, 0.05)",
        elevated: "0 16px 48px rgba(28, 25, 23, 0.20)", // modal/drawer/sheet
      },
      minHeight: {
        tap: "44px",
      },
      minWidth: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
