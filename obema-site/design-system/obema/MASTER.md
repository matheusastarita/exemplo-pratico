# OBEMA · Design system (MASTER)

Fonte de verdade visual do site. Os tokens vivem em `app/globals.css`; este arquivo explica as regras.

## Marca

- **Tom:** direto, local (Curitiba), sem promessa vazia. "Resultado medido, não prometido."
- **Símbolo:** o anel verde-limão no lugar do "O" (componente `Logo`).

## Cores

| Token | Hex | Uso |
| --- | --- | --- |
| `navy` | `#0b1b34` | Fundo das seções escuras, texto principal no claro |
| `navy-2` | `#122849` | Cards sobre o azul-marinho |
| `navy-3` | `#1d375f` | Anel de foco no claro, hover |
| `ink` | `#071222` | Molduras (celular), sombras |
| `paper` | `#e9edf2` | Fundo claro padrão |
| `paper-2` | `#dce3ec` | Faixas alternadas no claro |
| `lime` | `#c9f03c` | Botão principal, destaques, ícones sobre navy |

Regras:
- Verde-limão nunca vira texto sobre fundo claro (contraste baixo). Sobre o claro ele só aparece como preenchimento (botões, selos de ícone).
- Seções escuras usam a classe `.dark`, que troca todos os tokens do shadcn de uma vez.
- Texto secundário: `muted-foreground` (#46546b no claro, #a9b3c2 no escuro). Os dois passam de 4,5:1.

## Tipografia

- **Títulos:** Archivo (700–900), tracking negativo (-0,035em a -0,045em).
- **Texto:** Schibsted Grotesk.
- Escala: `text-hero`, `text-display`, `text-title`, `text-lede` (todas fluidas, com `clamp`).
- Rótulo de seção: utilitário `eyebrow` (traço + caixa alta espaçada).

## Forma e espaço

- Raio: `--radius` 1,25rem; botões e cabeçalho em pílula (`rounded-full`).
- Container: utilitário `wrap` (máx. 1360px, margem lateral de 16 a 64px).
- Seções: `py-24 md:py-32`.

## Movimento

- Portal da home (GlyphPortal) é a única peça com movimento guiado pela rolagem.
- Entradas de bloco: `data-reveal` (CSS `animation-timeline: view()`), sem JavaScript.
- Tudo respeita `prefers-reduced-motion`: sem animação, conteúdo no estado final.
- Vídeos nunca tocam sozinhos; tocar um pausa os outros.

## Componentes e acessibilidade

- Alvos de toque com no mínimo 44px.
- Ícones: lucide-react. Sem emoji como ícone.
- Menu do celular: `Sheet` (foco preso e Esc para fechar).
- Formulário: rótulo visível, erro ao lado do campo, `aria-invalid` e foco no primeiro erro.
- Link "Pular para o conteúdo" no topo de toda página.
