# Relatório final: página de vendas da Fábrica de Clientes

## 1. O que foi feito

Uma página de vendas completa, em HTML, CSS e JavaScript puros, sem dependências, pronta para hospedar na Vercel ou na Netlify (basta publicar a pasta `fabrica-de-clientes/` como site estático).

| Arquivo | O que é |
| --- | --- |
| `index.html` | A página, com as 16 seções do roteiro na ordem pedida, dados estruturados (`Course` + `Offer`, sem nota) e metatags de SEO, Open Graph e Twitter. |
| `css/styles.css` | Identidade da área de membros: `#FAFAFA`/`#FFFFFF`, cinzas, texto `#111`, preto como cor de ação, Bricolage Grotesque, Instrument Sans e JetBrains Mono. O laranja `#FF7A1A` aparece só nas anotações da captura da lição. Modo escuro grafite automático. |
| `js/config.js` | **Único lugar para configurar** o link do checkout da Kiwify, o Pixel da Meta e o Google Analytics. |
| `js/main.js` | Checkout com UTMs, consentimento de cookies, acordeões, barra de progresso e botão fixo no celular. |
| `img/og-image.png` | Imagem de compartilhamento 1200×630 (44 KB), com a tipografia da página. |
| `favicon.svg` | Ícone da aba. |
| `texto-da-pagina.md` | O texto completo da página, exportado na ordem, para revisar sem abrir o código. |
| `textos-de-apoio.md` | Meta description, Open Graph, 3 subtítulos, 10 linhas de “o que você leva”, alt de cada imagem, avisos, microcopy do botão fixo e a tabela anúncio → página. |

### Como a página se comporta

- **Botões de compra** (dobra, oferta, chamada final, botão fixo): vão para o `checkoutUrl` de `js/config.js` e levam junto `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id`, `fbclid`, `gclid`, `gbraid`, `wbraid`, `ttclid`, `msclkid`, `src` e `sck` (os dois últimos são os parâmetros de rastreio da Kiwify). Se a pessoa navegar e voltar sem a query, os parâmetros guardados na sessão são reaproveitados. Enquanto o `checkoutUrl` estiver vazio, os botões levam à seção da oferta e aparece um marcador visível ao lado do botão.
- **O botão “Quero entrar” da barra superior** leva à seção da oferta (âncora), como o roteiro pede.
- **Medição só com consentimento:** o aviso de cookies só aparece se houver Pixel ou GA4 configurado. “Aceitar” e “Recusar” têm o mesmo tamanho, a mesma cor e o mesmo peso. Nada da Meta ou do Google carrega antes do “Aceitar”. Quem recusar depois de ter aceitado (pelo link “Preferências de cookies” do rodapé) tem os cookies `_ga`, `_gid`, `_fbp` e `_fbc` apagados e a página recarregada.
- **Eventos (só com consentimento):** clique em comprar → `InitiateCheckout` (Meta) e `begin_checkout` (GA4), com a posição do botão; abertura de pergunta frequente → `FaqOpen` (Meta) e `faq_open` (GA4), com o texto da pergunta.
- **Sem JavaScript:** a página continua legível, os acordeões aparecem abertos e o botão fixo some.
- **No console do navegador:** um aviso mostra quantos marcadores `[[PREENCHER]]`/`[[IMAGEM]]` ainda estão na página.

### Testes que rodei (Chromium, via Playwright)

| Teste | Resultado |
| --- | --- |
| Rolagem horizontal em 360, 390, 768 e 1280 px (claro e escuro) | Nenhuma, em todas as larguras |
| Acessibilidade com axe-core (WCAG 2.1 A/AA + boas práticas), tema claro e escuro, com todos os painéis abertos | 0 violações |
| Um único `h1`, sem saltos na hierarquia de títulos | OK |
| Acordeão por clique e por teclado (Enter), `aria-expanded` atualizado | OK |
| Checkout configurado + `?utm_source=meta&utm_campaign=frio&utm_content=ad1&fbclid=abc123&outro=nao` | Todos os botões: `https://pay.kiwify.com.br/TESTE?coupon=X&utm_source=meta&utm_campaign=frio&utm_content=ad1&fbclid=abc123` (o parâmetro estranho `outro` foi descartado e o `coupon` original foi mantido) |
| Requisições à Meta/Google antes do consentimento | 0. Depois do “Aceitar”: carregam `fbevents.js` e `gtag.js` |
| Recusar e recarregar | O aviso não volta e nada é carregado |
| Botão fixo no celular | Escondido na dobra, visível no meio da página, escondido na oferta |
| `title` / `meta description` | 57 / 151 caracteres |
| Desempenho com 4G lenta (150 ms, 1,6 Mbps) e CPU 4x mais lenta, 3 execuções | LCP 0,98 a 1,07 s · CLS 0,012 a 0,016 · 110 a 140 KB no total |

Observação: no teste de desempenho, as fontes vieram de um servidor local com o mesmo atraso de rede. Em produção, o Google Fonts abre uma conexão a mais (já há `preconnect`); a margem até 2,5 s é grande.

---

## 2. O que ficou como `[[PREENCHER]]`

A ficha do autor veio sem nenhum campo preenchido, então todos os dados abaixo estão marcados na página, em amarelo, com borda tracejada. Os marcadores repetidos têm o texto idêntico: use “Localizar e substituir” no editor.

### Dados da ficha do autor

| Marcador | Onde aparece | Campo da ficha |
| --- | --- | --- |
| `[[PREENCHER: preço à vista]]` | Dobra, cartão da oferta, botão fixo (3x) | Preço à vista |
| `[[PREENCHER: preço sem R$, ex. 497.00]]` | JSON-LD (`Offer.price`), no `<head>` | Preço à vista (só números, com ponto) |
| `[[PREENCHER: parcelamento]]` | Dobra, cartão da oferta (2x) | Parcelamento |
| `[[PREENCHER: dias de garantia]]` | Dobra, oferta, garantia, perguntas, botão fixo (6x) | Garantia (mínimo de 7 dias) |
| `checkoutUrl` em `js/config.js` | Todos os botões de compra (o marcador visível fica ao lado do botão da oferta e some sozinho quando o link é configurado) | Link do checkout |
| `[[PREENCHER: nome do autor]]` | Seção do autor e JSON-LD (2x) | Nome |
| `[[IMAGEM: foto do autor, quadrada]]` | Seção do autor | Foto |
| `[[PREENCHER: mini-biografia real...]]` | Seção do autor | Mini-biografia |
| `[[PREENCHER: sistema que você pode citar...]]` | Seção do autor | Sistema em produção |
| `[[PREENCHER: caso real com números...]]` | Seção “Caso e prova” | Caso real (apague a linha se não tiver) |
| Bloco de depoimentos (comentado no HTML) | Seção “Caso e prova” | Depoimentos (deixei fora da página, porque não há nenhum) |
| `[[PREENCHER: suporte incluído...]]` (3 variações) | Custos e limites, oferta, perguntas | Suporte |
| `[[PREENCHER: como o aluno recebe o acesso...]]` | Perguntas | Como o aluno recebe |
| `[[PREENCHER: razão social ou nome completo]]`, `[[PREENCHER: CNPJ ou CPF]]` | Rodapé | CNPJ/CPF e razão social |
| `[[PREENCHER: e-mail de contato]]` + `[[PREENCHER:EMAIL]]` (no `mailto:`) | Rodapé | E-mail |
| `[[PREENCHER: WhatsApp de contato]]` + `[[PREENCHER:WHATSAPP]]` (no link `wa.me/`, só números com DDI, ex.: 5511999999999) | Rodapé | WhatsApp |
| `[[PREENCHER:URL_TERMOS]]`, `[[PREENCHER:URL_PRIVACIDADE]]` + `[[PREENCHER: links de Termos e Privacidade]]` | Rodapé e aviso de cookies | Termos e Privacidade |
| `metaPixelId`, `ga4Id` em `js/config.js` | Medição (deixe vazio se não usar) | Pixel/Analytics |
| `[[PREENCHER:DOMINIO]]` | `canonical`, Open Graph, Twitter, JSON-LD (9x) | Domínio |
| `[[PREENCHER: o que o aluno pode e não pode fazer...]]` + `[[PREENCHER: resposta conforme a licença...]]` | Starter Kit e perguntas | Licença do Starter Kit |
| `[[PREENCHER: custo da IA de código]]` (2x) + `[[PREENCHER: resumo honesto do custo de ferramentas por cliente]]` | Custos e limites, perguntas | Custo de ferramentas |

### Itens que a ficha não pede, mas a página precisa

| Marcador | Por quê |
| --- | --- |
| `[[PREENCHER: tempo de acesso, ex.: vitalício ou 12 meses]]` | Informação básica da oferta; sem ela, a pessoa não sabe o que está comprando. |
| `[[PREENCHER: política de atualizações]]` (2x) | O roteiro de perguntas pede (pergunta 12). |
| `[[PREENCHER: canal para pedir reembolso...]]` (2x) | A seção de garantia precisa dizer como pedir. |
| `[[PREENCHER: se a sua garantia for maior que 7 dias...]]` | Separa o direito legal (7 dias) de uma garantia extra sua. Apague se for de 7 dias. |
| `[[PREENCHER:URL_LICAO_AMOSTRA]]` + `[[PREENCHER: link de uma lição aberta, sem cadastro]]` | Botão “Ler uma lição de amostra”. Se não for abrir uma lição, apague o botão. |
| `[[PREENCHER: troque o código abaixo por um trecho real...]]` | O SQL de exemplo está só para diagramar; troque por um trecho real de lição. |
| `[[PREENCHER: 2 ou 3 frases suas, em primeira pessoa]]` | “Por que escrevi este curso”: a motivação é sua, não dá para inventar. |

### Capturas de tela (13 espaços `[[IMAGEM]]`)

Área de membros (dobra) · funil de prospecção · gerador de proposta · mockup · simulador de objeções · calculadora · roteiro de 30 dias · entregas e certificado · Meu caderno · fluxo do cliente do kit · painel do dono do kit · lição anotada · foto do autor. Nomes de arquivo e textos `alt` sugeridos estão em `textos-de-apoio.md`, seção 5.

Para trocar um espaço por uma imagem real, substitua a `<div class="todo-img" ...>...</div>` por:

```html
<img src="img/funil.webp" width="1200" height="900" alt="(alt de textos-de-apoio.md)" loading="lazy" decoding="async">
```

Na captura da dobra (área de membros), use `fetchpriority="high"` **sem** `loading="lazy"` (há um comentário no HTML com o trecho pronto). Na lição anotada, ajuste o `top`/`left` de cada `<span class="annot">` para que os números laranja caiam sobre os pontos certos.

---

## 3. As 8 opções de título

1. **Construa sistemas de agendamento e aprenda a vendê-los para os negócios da sua cidade.** ← *escolhido*
2. Do GitHub vazio ao sistema no ar: construa e aprenda a vender sistemas de agendamento.
3. Construir o sistema é metade. O curso ensina a outra metade: achar o cliente e cobrar.
4. O passo a passo para entregar sistemas de agendamento a negócios locais, com o código pronto para partir.
5. Pare de oferecer “um site”. Ofereça a agenda que o dono do negócio entende na hora.
6. Aprenda a construir, vender e manter sistemas de agendamento para barbearias, salões e estúdios.
7. Sistema de agendamento para negócios locais: do código à conversa de venda, num só curso.
8. O dono da barbearia não quer um site. Quer parar de responder “tem horário hoje?”. Aprenda a entregar isso.

**Por que a 1:** diz o que a pessoa aprende (construir e vender), para quem (negócios da sua cidade) e o produto (agendamento), sem prometer resultado. Funciona para tráfego frio e quente, é seguro para anúncios e cabe em 4 ou 5 linhas no celular. A 3 é a mais forte para quem já constrói e não vende, e a 8 para o ângulo da dor do dono: use as duas como variações de anúncio (tabela em `textos-de-apoio.md`). Troquei “ao primeiro cliente” por “ao sistema no ar” na 2, porque “primeiro cliente” num título soa como promessa de resultado.

---

## 4. Decisões que tomei, e por quê

- **Pasta própria (`fabrica-de-clientes/`).** O repositório já tem o site da OBEMA em `obema/`; mantive os dois projetos separados.
- **Botão da dobra antes da lista “o que você leva”.** No celular, o botão aparece na primeira tela (390×844). A lista vem logo abaixo.
- **Depoimentos fora da página, e não um marcador visível.** Um bloco vazio de depoimentos para o visitante seria pior do que nada. Deixei o modelo comentado no HTML e uma frase honesta no lugar: “Ainda não há depoimentos de alunos. E não vou inventar nenhum.”
- **Caso do Zé contado pelas etapas, sem diálogo inventado.** Mostro as 9 etapas do Módulo 9 e marco como “Caso ilustrativo · personagem fictício”. Não escrevi trechos de conversa para não criar um texto que diverge do curso.
- **Conta das faltas no problema.** Marcada como “Exemplo ilustrativo · números hipotéticos” (4 faltas × R$ 40), com a ressalva de que, na vida real, se usam os números do prospect.
- **Sem âncora de preço inventada.** O roteiro permite comparar com tempo e ferramentas, mas não há valores verificáveis para isso. No lugar, a página diz: “Não vou somar um ‘valor total’ inventado nem comparar com o preço de outros cursos.”
- **SQL de amostra marcado para troca.** É um `exclude using gist` correto em PostgreSQL, mas não é o texto do curso, por isso o marcador visível pede para trocar.
- **“Não vem no kit”: e-mail de lembrete → Módulo 5; os outros três → orçar à parte.** O roteiro diz que o curso ensina o e-mail e mostra como orçar o resto; não afirmei que ensina a construir pagamento ou WhatsApp.
- **Duas perguntas a mais no FAQ** (“Isso funciona na minha cidade?” e “Vale o preço?”), porque estão na lista de objeções da seção 2 e não tinham pergunta própria.
- **Configuração em `js/config.js`, conteúdo direto no HTML.** Preço, garantia e textos ficam no HTML (para buscadores e para quem estiver sem JavaScript); só o que é comportamento (checkout e medição) fica no arquivo de configuração.
- **Botão fixo no celular** aparece quando os botões da dobra saem da tela e some na oferta, na chamada final, no rodapé e enquanto o aviso de cookies está aberto.
- **Barra superior fixa só a partir de 768 px.** No celular, a barra superior fixa e o botão fixo de baixo juntos tomariam espaço demais.
- **Modo escuro automático** (pela preferência do sistema), em grafite neutro, sem botão de troca.
- **Sem captura de e-mail.** É opcional no roteiro e acrescentaria um formulário com consentimento e política para manter. Se quiser, dá para incluir depois.
- **O título em `<title>`** é “Fábrica de Clientes: crie e venda sistemas de agendamento” (57 caracteres).

---

## 5. Riscos de reprovação em anúncios

- **Marcadores visíveis.** Publicar com `[[PREENCHER]]` na tela é o maior risco: a Meta e o Google reprovam página “incompleta” ou “em construção”, e falta de identificação do vendedor (CNPJ/CPF, contato) costuma reprovar na hora.
- **Preço e garantia faltando.** Página de venda sem preço claro ou sem política de reembolso cai em “práticas comerciais inaceitáveis” na Meta.
- **Termos e Privacidade.** Os links precisam abrir páginas reais. O Google Ads exige política de privacidade quando há coleta de dados (Pixel/GA4).
- **“Renda”, “ganhar”, “mensalidade”.** A página não promete renda, mas fala de mensalidade e de receita recorrente. O texto sempre vem acompanhado de aviso, mas o anúncio não pode usar esses termos como promessa (“tenha renda recorrente”). Use a tabela anúncio → página.
- **Conta das faltas (R$ 640).** Está marcada como hipotética. No anúncio, não use esse número como dado nem como “antes/depois”.
- **Marcas de terceiros.** A página cita os nomes em texto, sem logos, e tem aviso. Não use logos de Vercel, Supabase, Claude etc. no criativo.
- **Imagens.** Nas capturas, só dados de exemplo; nunca nome ou telefone de cliente final real. O mockup deve usar um negócio fictício (ou um real com autorização por escrito).
- **Pixel antes do consentimento.** Já está resolvido no código; não cole o snippet do Pixel ou do GA4 direto no HTML, senão ele carrega sem consentimento.
- **Coerência.** Se o anúncio usar outro ângulo (por exemplo, a dor do dono), troque o `<h1>` numa cópia da página. Anúncio e dobra com mensagens diferentes aumentam a taxa de rejeição e pioram a nota de qualidade.

---

## 6. O que testar antes de publicar

1. Busque `[[` no `index.html`: o resultado precisa ser zero (os marcadores do comentário de depoimentos só somem se você apagar ou usar o bloco). Confira também no console do navegador: o aviso de marcadores pendentes não pode aparecer.
2. Preencha `js/config.js` e clique em cada botão de compra, abrindo a página com `?utm_source=teste&utm_campaign=teste`: o checkout da Kiwify precisa abrir com os parâmetros na URL. Confira na Kiwify se a venda de teste aparece com a origem certa.
3. Faça uma compra de teste (ou use o modo de teste da Kiwify) e confira o e-mail de acesso e a entrada na área de membros, para que o texto de “Como recebo o acesso?” bata com a realidade.
4. Confira na Kiwify o prazo de garantia configurado: ele precisa ser igual ao da página.
5. Se usar Pixel/GA4: abra em aba anônima, confira que nada carrega antes do “Aceitar” (aba Rede do navegador) e que o evento de compra aparece no Gerenciador de Eventos/DebugView depois do “Aceitar”.
6. Teste no celular de verdade (Android e iPhone): botão fixo, acordeões, aviso de cookies e botão de compra.
7. Troque as capturas e rode o PageSpeed Insights (pagespeed.web.dev) no domínio final: LCP abaixo de 2,5 s no celular. As imagens precisam estar em WebP/AVIF com `width`/`height`.
8. Valide os dados estruturados no Teste de pesquisa aprimorada do Google (search.google.com/test/rich-results) depois de trocar `[[PREENCHER:DOMINIO]]` e o preço.
9. Teste o compartilhamento no WhatsApp e no Facebook (Sharing Debugger da Meta) para ver a imagem de Open Graph.
10. Peça para alguém que não conhece o curso ler a página inteira e dizer o que entendeu que vai receber; se a pessoa sair achando que tem garantia de renda, há algo para reescrever.

---

## 7. Checklist de auto-revisão

| Item | Situação |
| --- | --- |
| Nenhuma promessa de renda, prazo de ganho ou número de alunos inventado | ✅ |
| Nenhum depoimento, nota ou caso falso; casos ilustrativos marcados como tal | ✅ (Zé e a conta das faltas marcados) |
| Aviso de resultados, marcas de terceiros, identificação do vendedor, Termos e Privacidade no rodapé | ✅ estrutura pronta · ⏳ dados do vendedor e links pendentes |
| Preço, pagamento, garantia e prazo de arrependimento claros | ✅ estrutura e texto do CDC · ⏳ valores pendentes |
| “O que não vem” no Starter Kit e custos de ferramentas declarados | ✅ · ⏳ custo da IA de código pendente |
| Sem cronômetro, sem escassez falsa, sem pop-up agressivo | ✅ |
| Visual minimalista, sem cores de destaque, sem clichês de IA | ✅ (laranja só nas anotações da captura) |
| Mobile 360 px sem rolagem horizontal; contraste AA; teclado; acordeões acessíveis | ✅ testado (axe: 0 violações nos dois temas) |
| LCP e peso de página razoáveis; imagens otimizadas | ✅ LCP ~1 s em 4G lenta · ⏳ conferir de novo com as capturas reais |
| Todos os botões levam ao checkout e preservam UTMs | ✅ testado · ⏳ falta o link real |
| Pixel/analytics só após consentimento | ✅ testado |
| `title`, `description`, Open Graph e JSON-LD sem avaliação falsa | ✅ · ⏳ domínio e preço pendentes |
| Todos os `[[PREENCHER]]` visíveis e listados no relatório | ✅ (seção 2) |

## 8. Extras opcionais (não feitos, aguardando sua autorização)

Versões para tráfego frio e quente · página de obrigado · sequência de e-mails de boas-vindas · 5 textos de anúncio e 5 roteiros de criativo · lição de amostra em página única.
