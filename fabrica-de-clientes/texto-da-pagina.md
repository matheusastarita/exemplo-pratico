# Texto completo da página: Fábrica de Clientes

Texto exportado do `index.html`, na ordem em que aparece, para revisar sem abrir o código. Se você mudar a página, mude o `index.html` (este arquivo é só leitura de apoio). Os marcadores `[[PREENCHER]]` e `[[IMAGEM]]` são o que falta.

---

<!-- seção: Barra superior -->

**Fábrica de Clientes**

[Botão] Quero entrar

---

<!-- seção: Dobra principal -->

Curso em texto · 12 módulos · 104 lições · Starter Kit

# Construa sistemas de agendamento e aprenda a vendê-los para os negócios da sua cidade.

Um curso em texto, com o código pronto para partir (o Starter Kit) e as ferramentas para prospectar, montar a proposta e acompanhar cada cliente. Para quem quer construir o sistema e também saber quem procurar, o que dizer e quanto cobrar.

[Botão] Quero entrar no curso

[Botão] Ver o conteúdo completo

R$ [[PREENCHER: preço à vista]] à vista ou [[PREENCHER: parcelamento]] · Garantia de [[PREENCHER: dias de garantia]] dias · Pagamento pela Kiwify

Curso em texto. Não garantimos resultados.

- 12 módulos e 104 lições, do GitHub vazio ao sistema no ar com domínio próprio.
- Starter Kit: um sistema de agendamento completo em Next.js e Supabase, para adaptar a cada cliente.
- O lado comercial: quem abordar, o que dizer, como montar preço com mensalidade.
- Ferramentas de trabalho: funil de prospecção, gerador de proposta, mockup para o prospect.

> [[IMAGEM: captura real da área de membros: página inicial com a lista de módulos e o progresso salvo]]

Área de membros: progresso salvo, busca e tema claro ou escuro.

---

<!-- seção: O problema -->

01 O problema

## O problema tem duas pontas.

### Do lado do dono do negócio

A agenda mora no WhatsApp, no Direct e num caderno no balcão. O dono atende com o celular vibrando: “tem horário hoje?”, “dá pra trocar pra amanhã?”, “ainda tem vaga às 18h?”. Quando alguém esquece e não aparece, a cadeira fica vazia, e aquele horário não volta.

Exemplo ilustrativo · números hipotéticos

*Barbearia do Zé (personagem fictício): quanto custam as faltas*

|   |   |
| --- | --- |
| Faltas por semana | 4 |
| Preço médio do corte | R$ 40 |
| Perdido por semana | R$ 160 |
| Perdido em 4 semanas | R$ 640 |

A conta só mostra o raciocínio. Com um prospect de verdade, você usa os números dele; a área de membros tem uma Calculadora de ROI para isso.

### Do lado de quem quer vender

Você sabe fazer o sistema, ou consegue aprender. O que trava é o resto:

- “Sei fazer, mas não sei vender.”
- “Já tentei prospectar e ninguém respondeu.”
- “Não sei quanto cobrar nem como cobrar mensalidade.”
- “Tenho medo de entregar algo que quebra com cliente de verdade.”

Tutorial de programação para no deploy. A conversa com o dono da barbearia fica por sua conta.

O sistema que você constrói é só metade. A outra metade é saber quem procurar, o que dizer e quanto cobrar. A Fábrica de Clientes ensina as duas, com as ferramentas para fazer no dia a dia.

---

<!-- seção: O caminho -->

02 O caminho

## Três etapas: construir, vender, operar e crescer.

Você pode construir do zero, lição por lição, ou partir do Starter Kit e adaptar. Nos dois casos, o caminho é o mesmo.

- Etapa 1 · Módulos 1 a 6 · 52 lições Construir Ao fim, você tem um sistema de agendamento no ar, com domínio, área do cliente, painel do dono e e-mails automáticos, depois de passar por um roteiro de 15 testes antes de entregar.
- Etapa 2 · Módulos 7 a 9 · 29 lições Vender Ao fim, você tem critérios para escolher quem abordar, mensagens por canal, uma oferta de entrada, uma tabela de preço com mensalidade e uma proposta pronta para enviar. E uma venda inteira, conversa por conversa, para consultar.
- Etapa 3 · Módulos 10 a 12 · 23 lições Operar e crescer Ao fim, você tem uma rotina semanal de manutenção, backup e suporte, um plano para incidentes, o relatório mensal do cliente e um playbook para o nicho que escolher.

A stack, em uma linha

- Seu computadorvocê e o Claude Code escrevem o código
- GitHubguarda o código e o histórico
- Vercel · Next.jspublica o site do cliente
- Supabasebanco de dados e login
- + Resend: envia os e-mails de confirmação e lembrete

Você escreve o código com ajuda do Claude Code e guarda no GitHub. A Vercel publica o site feito em Next.js, o Supabase guarda os dados e o login, e o Resend envia os e-mails.

---

<!-- seção: O conteúdo -->

03 O conteúdo

## O que tem dentro: 12 módulos, 104 lições.

Tudo em texto, com imagens, tabelas e código pronto para copiar. Cada módulo tem entregas concretas para você conferir o que fez.

### Etapa 1 · Construir

**01 · Fundação da stack · 11 lições**

Você cria e protege as contas que vai usar, instala Node e Git, aprende o básico do terminal e põe o projeto para rodar no seu computador. Sobe o código para o GitHub, guarda as chaves em variáveis de ambiente e monta um fluxo de trabalho com o Claude Code que dá para revisar.

**02 · Banco de dados · 9 lições**

Você modela as tabelas do agendamento e escolhe os tipos de dado. Cria no próprio banco a trava que impede dois clientes no mesmo horário e as regras que não podem depender da tela. Testa, aprende consultas úteis e a ler as mensagens de erro.

**03 · Interface do cliente · 8 lições**

Você monta o fluxo de agendamento: calcula os horários livres, trata o conflito quando duas pessoas tentam o mesmo horário e faz o formulário. Cuida dos estados de tela (carregando, vazio, erro), pensando primeiro no celular e em acessibilidade.

**04 · Painel do dono · 9 lições**

Você faz o login e os papéis, liga o RLS (Row Level Security) para cada pessoa ver só o que é dela e monta o painel: cancelar, remarcar, marcar falta, serviços, horários, clientes e faturamento. Termina com um roteiro de teste de segurança usando duas contas.

**05 · E-mails automáticos · 7 lições**

Você configura o Resend com domínio verificado, entende onde o código de envio roda e escreve os e-mails de confirmação, lembrete e cancelamento. Agenda o envio dos lembretes e testa a entrega para não cair no spam.

**06 · Deploy e produção · 8 lições**

Você faz o primeiro deploy, configura as variáveis, prepara o Supabase de produção e liga o domínio. Passa pelo checklist de entrega e por um roteiro de 15 testes, monitora o sistema e aprende a voltar atrás quando uma atualização dá errado.

### Etapa 2 · Vender

**07 · Primeiro cliente · 9 lições**

Você confere se está pronto para vender, define quem vale a pena abordar e faz uma pesquisa de 10 minutos antes de cada contato. Tem abordagens por canal, uma rotina com números para acompanhar, uma oferta de entrada, o roteiro de entrega, como pedir prova social e um plano para quando ninguém fecha.

**08 · Preço e escala · 10 lições**

Você monta uma tabela de referência, entende mensalidade e receita recorrente e faz a conta dos custos reais e da margem. Define os pacotes Essencial e Completo, aprende a negociar e a cobrar, a oferecer upsells, a padronizar e a decidir quando subir o preço, com cenários para comparar.

**09 · Caso completo · 10 lições**

Você acompanha uma venda inteira, com as conversas escritas: primeira mensagem, descoberta, demonstração de 10 minutos, objeções, proposta, termo, entrega, primeira semana e pós-venda. É um caso ilustrativo, marcado como fictício no curso.

### Etapa 3 · Operar e crescer

**10 · Operação e suporte · 7 lições**

Você monta a rotina semanal, o backup e o atendimento de suporte, vê a LGPD na prática (como orientação geral), sabe o que fazer num incidente e como atualizar o sistema. Fecha com o relatório mensal para o cliente e o que fazer num cancelamento.

**11 · Escala e nichos · 7 lições**

Você escolhe um nicho, padroniza a entrega, junta prova social e testa canais de captação, incluindo anúncios sem promessa exagerada. Entende o que é multi-tenant, quando não fazer e quais são os limites desse modelo de negócio.

**12 · Playbooks por nicho · 9 lições**

Você vê o que muda para barbearia, salão, estúdio de tatuagem, clínica de estética, pet shop, personal e estúdios, e quadras. Fecha com um método de entrevistas para validar o seu nicho antes de investir tempo nele.

### Três coisas que costumam ficar de fora e aqui têm lição própria

Roteiro de testes

15 testes antes de entregar e um teste de segurança com duas contas, para conferir que um cliente não enxerga os dados de outro.

Custos reais

Quanto custa hospedar cada cliente (a Vercel Hobby não é para uso comercial; o Supabase gratuito tem limites) e como isso entra no seu preço.

O que o kit não faz

A lista do que ficou de fora do Starter Kit e como orçar à parte, em vez de prometer ao cliente o que não existe.

---

<!-- seção: As ferramentas -->

04 As ferramentas

## As ferramentas que você usa no dia a dia da prospecção.

A área de membros não é só leitura. São 15 ferramentas e páginas de apoio; estas são as oito que você mais vai abrir. Nas imagens, os dados são de exemplo.

- [[IMAGEM: funil de prospecção preenchido com dados de exemplo, com a palavra “exemplo” visível na captura]] Funil de prospecção Você cadastra cada prospect, vê a taxa de cada etapa e descobre onde a conversa trava. Todo dia, ele lembra quem você precisa retomar.
- [[IMAGEM: gerador de proposta com dados de um negócio de exemplo]] Gerador de proposta, termo e relatório Preenche a proposta, o termo de aceite e o relatório mensal com os dados do cliente, para você não montar documento do zero toda vez.
- [[IMAGEM: mockup gerado para um negócio de exemplo, sem marca real]] Mockup para o prospect Gera uma imagem do agendamento com a cara do negócio do prospect. Ele vê como ficaria antes de você construir qualquer coisa.
- [[IMAGEM: simulador de objeções mostrando uma situação e o feedback de uma resposta]] Simulador de objeções Dez situações de objeção, com feedback para cada resposta que você escolher. Dá para errar aqui antes de errar na conversa de verdade.
- [[IMAGEM: calculadora de preço com custos fixos e variáveis de exemplo]] Calculadoras de ROI e de preço Uma faz a conta do lado do dono do negócio. A outra parte dos seus custos fixos e variáveis para chegar ao seu preço.
- [[IMAGEM: roteiro de 30 dias com alguns dias marcados como feitos]] Roteiro de 30 dias O que fazer em cada dia, com progresso salvo. É um ritmo de trabalho, não um prazo garantido.
- [[IMAGEM: lista de entregas por módulo e a tela do certificado]] Entregas e certificado 47 entregas, módulo a módulo, para você conferir o que fez, e não só o que leu. O certificado é liberado com 100% das lições.
- [[IMAGEM: Meu caderno, com anotações e favoritos de uma lição]] Meu caderno Anotações e favoritos em cada lição, com cópia de segurança para você não perder o que escreveu.

### Também na área de membros

- Templates e scripts que se preenchem com os dados do prospect: mensagens, proposta, termo, relatório, cobrança, pedido de depoimento e ficha de prospect.
- Biblioteca de prompts para o Claude Code.
- Solução de problemas para os erros mais comuns.
- Glossário, com explicação ao passar o mouse nos termos técnicos das lições.
- Perguntas frequentes e checklist de lançamento.

---

<!-- seção: Starter Kit -->

05 Starter Kit

## O Starter Kit: um sistema que já funciona, para você partir dele.

Um sistema de agendamento completo e verificado (compila, tipos e lint passam), em Next.js 16, React 19, Supabase e Tailwind. Você baixa, configura e adapta ao negócio do cliente.

### Área do cliente

- Cadastro e login
- Agendamento em passos
- Meus agendamentos
- Remarcar e cancelar, com regra de 90 minutos de antecedência
- Arquivo para adicionar ao calendário

### Painel do dono

- Agenda por dia, semana e mês, em tempo real
- Marcar compareceu ou faltou
- Lançar agendamento pelo balcão
- Clientes, serviços, horários e bloqueios
- Faturamento

### Segurança

- Regras no banco, em funções SQL
- Constraint de exclusão contra horário duplicado
- RLS em todas as tabelas
- Cabeçalhos de segurança

> [[IMAGEM: fluxo de agendamento do cliente no celular, em 3 telas: serviço, horário e confirmação]]

Fluxo do cliente no celular. Captura ilustrativa do Starter Kit, com dados de exemplo.

> [[IMAGEM: painel do dono com a agenda da semana preenchida com dados de exemplo]]

Painel do dono, agenda da semana. Captura ilustrativa, com dados de exemplo.

### O que não vem no kit

| Não vem | O que fazer |
| --- | --- |
| E-mail de lembrete | O Módulo 5 ensina a acrescentar. |
| Vários profissionais na mesma agenda | Orçar à parte. O curso mostra como apresentar isso ao cliente. |
| Pagamento online | Orçar à parte, com os cuidados que o curso aponta. |
| WhatsApp automático | Orçar à parte, com os limites que o curso aponta. |

Caminho A

### Do zero

Você constrói lição por lição. Leva mais tempo, e você entende cada peça do sistema. Bom para quem quer aprender a fundo.

Caminho B

### A partir do kit

Você parte do sistema pronto e usa as lições para entender, configurar e adaptar. Chega antes à primeira demonstração.

Licença do Starter Kit: [[PREENCHER: o que o aluno pode e não pode fazer (usar em clientes? revender?)]]

---

<!-- seção: Uma lição por dentro -->

06 Uma lição por dentro

## Como é uma lição por dentro.

Antes de comprar, veja o nível de detalhe: texto direto, capturas anotadas, código pronto para copiar e tabelas. Os termos técnicos têm explicação ao passar o mouse.

> [[IMAGEM: print de uma lição real, com 3 anotações em laranja nos pontos 1, 2 e 3 descritos na legenda]]

- Progresso salvo e busca em todas as lições.
- Termo técnico com explicação ao passar o mouse.
- Bloco de código pronto para copiar.

Trecho de amostra

[[PREENCHER: troque o código abaixo por um trecho real de uma lição do Módulo 2. Este SQL está aqui só para mostrar o formato.]]

```sql
-- Impede dois agendamentos no mesmo horário, direto no banco
create extension if not exists btree_gist;

alter table agendamentos
  add constraint sem_horario_duplicado
  exclude using gist (
    negocio_id with =,
    tstzrange(inicio, fim, '[)') with &&
  )
  where (status <> 'cancelado');
```

[Botão] Ler uma lição de amostra

[[PREENCHER: link de uma lição aberta, sem cadastro]]

---

<!-- seção: Para quem é -->

07 Para quem é

## Para quem é, e para quem não é.

### É para você se

- Você quer uma fonte de renda com projetos para pequenos negócios e topa conversar com gente de verdade.
- Você tem disposição para aprender fazendo, mesmo sem experiência em programação.
- Você aceita que o resultado depende do seu esforço e do seu mercado.
- Você prefere método, checklist e ferramentas a conselhos soltos.

### Não é para você se

- Você procura renda garantida ou sem prospecção.
- Você não quer falar com clientes nem fazer demonstrações.
- Você quer um produto de prateleira, sem personalização nem manutenção.
- Você espera aulas em vídeo.

---

<!-- seção: Caso e prova -->

08 Caso e prova

## Ainda não há depoimentos de alunos. E não vou inventar nenhum.

Este é um curso novo; ainda estamos juntando relatos de alunos. Quando houver depoimentos e resultados reais, com autorização, eles entram aqui.

[[PREENCHER: caso real com números (antes, depois, número do painel, autorização por escrito). Se ainda não tiver, apague esta linha.]]

Caso ilustrativo · personagem fictício

### A venda para a Barbearia do Zé, do Módulo 9

No Módulo 9 você acompanha uma venda inteira, do primeiro contato ao pós-venda, com as conversas escritas. O Zé não existe: o caso foi escrito para ensinar, e está marcado assim no curso.

- 01Primeira mensagem
- 02Descoberta
- 03Demonstração de 10 minutos
- 04Objeções
- 05Proposta
- 06Termo de aceite
- 07Entrega
- 08Primeira semana
- 09Pós-venda

---

<!-- seção: Sobre o autor -->

09 Quem escreveu

## Quem escreveu o curso.

> [[IMAGEM: foto do autor, quadrada]]

### [[PREENCHER: nome do autor]]

[[PREENCHER: mini-biografia real, 3 a 5 frases, só fatos verificáveis: tempo de experiência, número aproximado de projetos, tipo de cliente]]

Sistema em produção: [[PREENCHER: sistema que você pode citar. Nome do negócio só com autorização por escrito do dono; senão, descreva sem nome.]]

Por que escrevi este curso: [[PREENCHER: 2 ou 3 frases suas, em primeira pessoa]]

---

<!-- seção: Custos e limites -->

10 Custos e limites

## Antes de comprar: custos, tempo e limites.

Melhor você saber agora do que descobrir no meio do caminho.

**Ferramentas para estudar**
Os planos gratuitos de GitHub, Vercel, Supabase e Resend costumam bastar para aprender. A IA de código tem custo próprio: [[PREENCHER: custo da IA de código]]

**Ferramentas para atender clientes**
Cliente pagante pede plano pago. A Vercel Hobby é restrita a uso pessoal e não comercial, e o Supabase gratuito tem limite de projetos e pausa por inatividade. O curso faz a conta e mostra como esse custo entra na mensalidade. [[PREENCHER: resumo honesto do custo de ferramentas por cliente]]

**Tempo**
Depende de você. Quem nunca programou leva mais tempo nos módulos de banco e interface; o Starter Kit encurta esse trecho. O roteiro de 30 dias é um ritmo de trabalho, não um prazo garantido.

**O que depende de você**
Abordar negócios, fazer demonstrações, ouvir não, ajustar e abordar de novo. O resultado também depende da sua cidade, do nicho que escolher e do preço que cobrar.

**O que não está incluído**
Aulas em vídeo. No Starter Kit: e-mail de lembrete (ensinado no Módulo 5), vários profissionais, pagamento online e WhatsApp automático. Aconselhamento jurídico, fiscal ou contábil: o termo, a proposta e as orientações de LGPD e impostos são modelos e orientação geral, e não substituem advogado ou contador.

**Suporte**
[[PREENCHER: suporte incluído (e-mail, WhatsApp, comunidade, chamadas). Descreva só o que vai cumprir, ou “sem suporte além da área de membros”.]]

---

<!-- seção: A oferta -->

11 A oferta

## O que você recebe ao entrar.

- 12 módulos e 104 lições em texto, na área de membros, com progresso salvo, busca e tema claro ou escuro.
- Starter Kit para download: sistema de agendamento em Next.js 16, React 19, Supabase e Tailwind.
- 15 ferramentas e páginas de apoio: funil de prospecção, gerador de proposta, mockup, simulador de objeções, calculadoras, roteiro de 30 dias e mais.
- Templates e scripts que se preenchem com os dados do prospect.
- Biblioteca de prompts para o Claude Code, solução de problemas e glossário.
- Certificado de conclusão, liberado com 100% das lições.
- Suporte: [[PREENCHER: suporte incluído]]
- Acesso: [[PREENCHER: tempo de acesso, ex.: vitalício ou 12 meses]]. Atualizações: [[PREENCHER: política de atualizações]]

Não vou somar um “valor total” inventado nem comparar com o preço de outros cursos. O que está nesta lista é tudo o que você recebe.

Investimento

R$ [[PREENCHER: preço à vista]]

à vista, ou [[PREENCHER: parcelamento]]

[Botão] Quero entrar no curso

[[PREENCHER: link do checkout em js/config.js]]

Pagamento seguro pela Kiwify (Pix, cartão e boleto, conforme disponibilidade). Acesso por e-mail logo após a confirmação.

Garantia de [[PREENCHER: dias de garantia]] dias, com devolução do valor pago.

Não garantimos clientes, renda nem prazo. Os resultados dependem de dedicação, cidade, nicho, preço e execução.

---

<!-- seção: Garantia -->

12 Garantia

## Garantia de [[PREENCHER: dias de garantia]] dias.

Se você entrar e perceber que o curso não é para você, peça o reembolso em até [[PREENCHER: dias de garantia]] dias a partir da compra, sem precisar explicar o motivo. O valor pago é devolvido integralmente.

Como pedir: [[PREENCHER: canal para pedir reembolso, ex.: pela página da compra na Kiwify ou pelo e-mail de contato]]

Isso é o seu direito de arrependimento: o Código de Defesa do Consumidor (art. 49) garante 7 dias para desistir de compras feitas pela internet. [[PREENCHER: se a sua garantia for maior que 7 dias, diga aqui que os dias a mais são uma garantia extra sua. Se for de 7 dias, apague esta frase.]]

---

<!-- seção: Perguntas frequentes -->

13 Perguntas

## Perguntas frequentes.

**Preciso saber programar?**

Não é pré-requisito. O curso usa o Claude Code para escrever grande parte do código; o seu papel é entender, testar e ajustar. Quem nunca programou leva mais tempo nos módulos de banco e interface. O Starter Kit encurta o caminho.

**Quanto vou ganhar?**

Não sabemos e não prometemos. O curso mostra a conta (preço, custos e cenários, como exercício) para você decidir. O resultado depende de quantos negócios você consegue abordar, converter e atender.

**Quanto tempo até o primeiro cliente?**

Depende. O curso traz um roteiro de 30 dias como ritmo de trabalho, não como prazo garantido.

**E se ninguém comprar de mim?**

Há uma lição inteira sobre diagnosticar onde o funil trava e um plano de 14 dias para recomeçar, e a ferramenta de funil mostra os seus números. Existem cidades e nichos mais difíceis, e algumas pessoas descobrem que não gostam de vender: o curso diz isso abertamente.

**Isso funciona na minha cidade?**

Não dá para garantir. Cidade, nicho e concorrência mudam muito o resultado. O Módulo 12 traz um método de entrevistas para validar o nicho antes de investir tempo, e o funil de prospecção mostra, com os seus números, se a abordagem está funcionando.

**Quais ferramentas vou usar e quanto vou gastar?**

Para estudar, os planos gratuitos costumam bastar. Para hospedar clientes que pagam, há custos: a Vercel Hobby é restrita a uso pessoal e não comercial (cliente pagante pede plano pago), e o Supabase gratuito tem limite de projetos e pausa por inatividade. O curso traz a conta completa. [[PREENCHER: custo da IA de código]]

**A IA não faz tudo sozinha?**

Não. Ela acelera, mas erra. O curso ensina a revisar, testar e não confiar às cegas, principalmente em segurança.

**O curso garante que meu sistema vai funcionar sem erros?**

Não. Software exige testes. Por isso há roteiros de teste, checklist de entrega e uma página de solução de problemas.

**Preciso de CNPJ?**

Depende do seu caso. O curso orienta a conversar com um contador cedo e não dá aconselhamento fiscal.

**É só texto? Onde estão as aulas?**

Sim, é texto, com imagens, tabelas, códigos prontos e ferramentas interativas. Foi pensado para ser consultado enquanto você faz. Se você só aprende com vídeo, este curso não é para você.

**Tem suporte?**

[[PREENCHER: suporte incluído, descrevendo só o que será entregue]]

**Posso usar o Starter Kit com meus clientes? Posso revender?**

[[PREENCHER: resposta conforme a licença do Starter Kit]]

**Funciona para outros negócios além de barbearia?**

Sim, com adaptações. O Módulo 12 mostra o que muda em cada tipo de negócio e o que o kit não cobre, por exemplo aulas coletivas com vagas ou vários profissionais.

**E a LGPD?**

Há uma lição de LGPD em linguagem simples, com avisos claros de que é orientação geral e não substitui um advogado.

**Quanto de atualização eu recebo?**

[[PREENCHER: política de atualizações]]

**Como recebo o acesso?**

O pagamento é feito pela Kiwify. [[PREENCHER: como o aluno recebe o acesso (área de membros da Kiwify, link, e-mail de acesso)]]

**E se eu não gostar?**

Você tem garantia de [[PREENCHER: dias de garantia]] dias, com devolução do valor pelo canal [[PREENCHER: canal para pedir reembolso]]. O direito de arrependimento de 7 dias em compras pela internet é previsto em lei (CDC, art. 49).

**Vale o preço?**

Só você pode responder. Veja a lista do que está incluído, leia a lição de amostra e compare com o tempo que levaria para juntar tudo isso sozinho. Se entrar e achar que não valeu, a garantia está aí.

---

<!-- seção: Chamada final -->

## Em resumo.

- Você aprende a construir um sistema de agendamento e a colocá-lo no ar.
- Aprende a encontrar negócios, conversar, propor e cobrar mensalidade.
- E leva o Starter Kit e as ferramentas para fazer isso no dia a dia.

[Botão] Quero entrar no curso

O curso dá o caminho e as ferramentas. Abordar, demonstrar e entregar continua sendo com você.

---

<!-- seção: Rodapé -->

Fábrica de Clientes

Vendido por [[PREENCHER: razão social ou nome completo]] · CNPJ/CPF [[PREENCHER: CNPJ ou CPF]]

Contato: [[PREENCHER: e-mail de contato]] · WhatsApp [[PREENCHER: WhatsApp de contato]]

- Termos de Uso
- Política de Privacidade
[[PREENCHER: links de Termos e Privacidade]]

Aviso de resultados. Este curso ensina um método e fornece ferramentas. Não garantimos que você terá clientes, nem quanto vai ganhar, nem em quanto tempo. Os resultados dependem de fatores como dedicação, cidade, nicho, preço e execução, e variam de pessoa para pessoa. Os valores, conversas e casos apresentados no curso são exemplos para ensinar, e não resultados de alunos, salvo quando indicado. Impostos, contratos e proteção de dados são tratados como orientação geral e não substituem advogado ou contador.

Marcas de terceiros. GitHub, Vercel, Supabase, Resend, Next.js, Claude e Kiwify são marcas de seus respectivos titulares, citadas apenas para identificar as tecnologias ensinadas. Esta página não tem vínculo, patrocínio ou endosso dessas empresas. Esta página não é afiliada ao Facebook, Instagram, Google ou outras plataformas de anúncio.

© 2026 Fábrica de Clientes.

---

<!-- seção: Botão fixo no celular -->

R$ [[PREENCHER: preço à vista]]Garantia de [[PREENCHER: dias de garantia]] dias

[Botão] Quero entrar

---

<!-- seção: Aviso de cookies (só com pixel/analytics configurado) -->

Cookies de medição

Se você permitir, usamos cookies de medição para saber quais anúncios trazem visitas. Se recusar, nada disso é carregado. Política de Privacidade

[Botão] Recusar
[Botão] Aceitar
