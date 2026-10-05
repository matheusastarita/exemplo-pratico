# OBEMA · Design system (MASTER)

Fonte de verdade visual do site. Os tokens vivem em `app/globals.css`; este arquivo explica as regras.

## Direção

Minimalista, branco e azul-marinho. A referência é o topo da home: fundo branco, título enorme em azul-marinho e a última linha em cinza-azulado ("agenda cheia.").

- **Tom:** direto, local (Curitiba), sem promessa vazia. "Resultado medido, não prometido."
- **Marca:** a palavra OBEMA em Archivo bem pesada, sem símbolo.

## Cores

| Token | Hex | Uso |
| --- | --- | --- |
| `navy` | `#0b1b34` | Texto principal, botão principal, seções escuras |
| `navy-2` | `#122849` | Cards sobre o azul-marinho |
| `slate` (`slate-accent`) | `#7d8aa0` | Destaque em títulos grandes (só texto grande) |
| `muted-foreground` | `#5b6779` | Texto secundário no branco (5,7:1) |
| `paper` (`muted`) | `#f5f7fa` | Faixas alternadas, bem claras |
| branco | `#ffffff` | Fundo padrão |

Regras:
- Sem verde-limão nem brilhos coloridos. A marca é branco e azul.
- O cinza `slate` não passa de 4,5:1 no branco, então só aparece em títulos grandes. Texto pequeno usa `muted-foreground`.
- Seções escuras usam a classe `.dark`, que troca os tokens do shadcn de uma vez (botão principal vira branco).

## Tipografia

- **Títulos:** Archivo 800 (extrabold), tracking -0,04em a -0,045em, entrelinha 1,02 a 1,1.
- **Texto:** Schibsted Grotesk.
- Rótulo de seção: utilitário `eyebrow` (ponto + caixa alta espaçada), igual à linha "Curitiba · PR · Estúdio de social media · Desde 2023".

## Cabeçalho

Barra de largura total: "OBEMA" à esquerda, links simples com sublinhado na página atual e botão "WhatsApp ↗" com contorno. Transparente no topo; ganha fundo branco com borda ao rolar e fica azul-marinho sobre seções escuras.

## Forma e espaço

- Botões em pílula (`rounded-full`); cards com raio de 1,25rem e borda fina.
- Container: utilitário `wrap` (máx. 1360px, margem lateral de 16 a 64px).
- Seções: `py-24 md:py-32`.

## Movimento

- Portal da home (GlyphPortal): entra pelo "O" azul-marinho e o fundo clareia até o branco do topo.
- Entradas de bloco: `data-reveal` (CSS `animation-timeline: view()`), sem JavaScript.
- Tudo respeita `prefers-reduced-motion`.
- Vídeos nunca tocam sozinhos; tocar um pausa os outros.

## Acessibilidade

- Alvos de toque com no mínimo 44px.
- Ícones: lucide-react. Sem emoji como ícone.
- Menu do celular: `Sheet` (foco preso e Esc para fechar).
- Formulário: rótulo visível, erro ao lado do campo, `aria-invalid` e foco no primeiro erro.
- Link "Pular para o conteúdo" no topo de toda página.
