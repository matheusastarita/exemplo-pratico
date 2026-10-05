# Site OBEMA Marketing

Novo site da OBEMA (obemamarketing.com.br), feito com **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS 4** e a estrutura de componentes do **shadcn/ui**.

A abertura da home usa o componente **Glyph Portal** (© 2026 Christian Katzmann, MIT): rolando a página, a câmera entra pela letra "O" de OBEMA e o azul-marinho de dentro das letras vira o fundo do texto principal.

## Rodar no computador

Precisa do Node.js 20.9 ou mais novo.

```bash
cd obema-site
npm install
npm run dev        # abre em http://localhost:3000
```

Para conferir a versão de produção:

```bash
npm run build
npm start
```

## Páginas

| Rota | Conteúdo |
| --- | --- |
| `/` | Portal OBEMA, serviços, método, case, depoimentos em vídeo, dúvidas e chamada final |
| `/servicos` | As 8 frentes em detalhe, o que vem sempre incluído e como funciona |
| `/cases` | Case Instituto J. Mortensen com antes e depois, e os depoimentos |
| `/sobre` | Manifesto, combinados de trabalho e os fundadores |
| `/contato` | Formulário que abre o WhatsApp com a mensagem pronta, e todos os canais |

## Onde editar

- **Textos, serviços, case, depoimentos e dúvidas:** `lib/content.ts`
- **WhatsApp, e-mail, Instagram, cidade e fundadores:** `lib/site.ts`
- **Cores, fontes e tamanhos de texto:** `app/globals.css` (tokens no topo do arquivo)
- **Vídeos e imagens:** `public/media/`

## Estrutura

```
app/                  rotas (App Router), layout, sitemap e robots
components/ui/        componentes base no padrão shadcn (button, sheet, accordion...) e o glyph-portal
components/site/      blocos do site (cabeçalho, rodapé, portal da home, seções)
lib/                  conteúdo, dados de contato, fontes e utilitários
design-system/obema/  regras visuais da marca (MASTER.md)
```

`components/ui` é a pasta padrão do shadcn. O `components.json` aponta para ela, então `npx shadcn@latest add <componente>` instala novos componentes no lugar certo, ao lado dos que já existem.

## Observações

- O site é 100% estático: não tem banco de dados nem back-end. O formulário de contato só monta a mensagem e abre o WhatsApp da OBEMA.
- As fotos de `/servicos` e `/sobre` vêm do Unsplash. Se alguma não carregar, fica no lugar um fundo com o anel da marca.
- Com "reduzir movimento" ligado no sistema, o portal e as animações de entrada ficam desligados e todo o conteúdo aparece direto.
