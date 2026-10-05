# Reserva de mesas

Sistema de reservas para restaurante, em português, pensado primeiro para o celular:

- **Cliente** (sem login): escolhe pessoas, data e horário, deixa os dados e recebe um código. Pelo link `/r/CÓDIGO` (com o telefone) confirma presença, altera ou cancela. Dia lotado vira lista de espera. Conta opcional em "Minhas reservas".
- **Anfitrião** (`/painel`): o salão do dia em tempo real — linha do tempo, mapa de mesas com status, "chegou/sentar", faltas, walk-in com resposta na hora ("tem a mesa 7" ou "espera de ~25 min"), fila de espera, reserva por telefone e desfazer.
- **Gerente** (`/painel/gerencia`): visão geral, reservas (filtros, CSV, histórico), clientes (ficha, tags, bloqueio, anonimização LGPD), salão e mesas (editor visual do mapa), turnos e regras, relatórios, mensagens, equipe e configurações da marca com prévia ao vivo.

Mensagens (confirmação, lembretes, alteração, cancelamento, lista de espera) são **simuladas**: ficam registradas e aparecem como prévia estilo WhatsApp. O envio de verdade é fase 2 (veja o fim).

Stack: Next.js 16 (App Router) · React 19 · Tailwind CSS 3.4 · Supabase (Postgres, Auth, Realtime) · deploy na Vercel.

---

## 1. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (região São Paulo, de preferência).
2. Abra **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e rode. O arquivo pode ser rodado de novo depois (atualiza funções e permissões sem apagar dados).
3. **Só para demonstração:** rode também [`supabase/seed_demo.sql`](supabase/seed_demo.sql). Ele cria o restaurante fictício *Bistrô Alecrim* com mesas, turnos, ~300 clientes, 90 dias de histórico, 14 dias à frente e o dia de hoje "vivo". **Não rode em produção** — ele apaga os dados de operação.
4. Em **Project Settings → API**, copie a *Project URL* e a *anon public key*. Só essas duas vão para o app. A `service_role` **nunca** é usada.

### Autenticação

Em **Authentication → URL Configuration**:

- **Site URL**: o endereço final do site (ex.: `https://reservas.seurestaurante.com.br`).
- **Redirect URLs**: `https://SEU-DOMINIO/auth/callback` e, para desenvolvimento, `http://localhost:3000/auth/callback`. Se usar os links de pré-visualização da Vercel, inclua também `https://*-SEU-TIME.vercel.app/auth/callback`.

E-mails de confirmação e de recuperação de senha: no plano gratuito, o Supabase manda os e-mails em inglês com limite baixo de envios e **só permite editar o texto depois de configurar um SMTP próprio**. Para mandar em português, configure um SMTP (ex.: [Resend](https://resend.com) — crie a chave, verifique o domínio e preencha em **Authentication → SMTP Settings**) e depois traduza os modelos em **Authentication → Email Templates**.

### Primeiro gerente (produção)

O papel de uma conta **nunca** vem do cadastro. Para promover a primeira pessoa:

1. Crie a conta pelo site (`/cadastro`) e confirme o e-mail.
2. No SQL Editor:
   ```sql
   update public.profiles set role = 'manager'
   where id = (select id from auth.users where email = 'voce@seurestaurante.com.br');
   ```
3. Os demais entram por **Gerência → Equipe → Convidar pessoa** (anfitrião ou gerente). A pessoa cria a conta com o e-mail convidado e, ao confirmar o e-mail, já entra com o papel certo.

Depois, ajuste nome, cor, contatos e endereço do site em **Gerência → Configurações**, as mesas em **Salão e mesas** e os horários em **Turnos e regras**.

## 2. Contas de demonstração

As contas e senhas da demo **não ficam no código**. Para criá-las:

1. Em **Authentication → Users → Add user → Create new user**, crie três contas com **Auto Confirm User** marcado e senhas exclusivas da demo (não reaproveite senhas):
   - gerente (ex.: `gerente@seudominio.com`)
   - anfitrião (ex.: `anfitriao@seudominio.com`)
   - cliente (ex.: `cliente@seudominio.com`)
2. No SQL Editor (depois do `seed_demo.sql`):
   ```sql
   select public.demo_setup_accounts('gerente@seudominio.com', 'anfitriao@seudominio.com', 'cliente@seudominio.com');
   ```
   Isso define os papéis, liga o modo demonstração no banco, liga a conta de cliente a um histórico de reservas e recria os dados.
3. Coloque os e-mails e senhas nas variáveis `DEMO_*` (abaixo). Elas são lidas **só no servidor**: os botões "Entrar como Gerente / Anfitrião / Cliente" chamam uma *server action* que faz o login — nada aparece no navegador.

Para apresentar, siga o [`ROTEIRO_DEMO.md`](ROTEIRO_DEMO.md).

## 3. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` (que fica fora do git) e preencha:

| Variável | Onde é usada | Valor |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navegador e servidor | Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | navegador e servidor | anon public key (é pública por natureza; a proteção é o RLS) |
| `NEXT_PUBLIC_DEMO_MODE` | servidor | `true` só no ambiente de demonstração. Mostra os botões de entrada rápida e libera "Resetar demonstração" (que também exige o modo demo ligado no banco). Em produção, `false`. |
| `DEMO_MANAGER_EMAIL` / `DEMO_MANAGER_PASSWORD` | só servidor | conta de gerente da demo |
| `DEMO_HOST_EMAIL` / `DEMO_HOST_PASSWORD` | só servidor | conta de anfitrião da demo |
| `DEMO_CLIENT_EMAIL` / `DEMO_CLIENT_PASSWORD` | só servidor | conta de cliente da demo |

## 4. Rodar localmente

Requisitos: Node.js 20 ou mais novo.

```bash
npm install
cp .env.local.example .env.local   # e preencha
npm run dev                        # http://localhost:3000
```

Verificações (as mesmas usadas durante o desenvolvimento):

```bash
npm run typecheck   # next typegen + tsc
npm run lint
npm run build       # pare o "npm run dev" antes: os dois usam a pasta .next
```

> Dica: também dá para usar o Supabase local (`supabase start`, via Supabase CLI) e rodar os dois arquivos SQL no banco local.

## 5. Deploy na Vercel

1. Na Vercel, **Add New → Project** e importe o repositório. Se o projeto estiver numa subpasta, aponte o **Root Directory** para ela (aqui, `reserva-mesas`).
2. Em **Environment Variables**, cadastre as variáveis da seção 3 (em produção, `NEXT_PUBLIC_DEMO_MODE=false` e sem as `DEMO_*`).
3. Faça o deploy e coloque o endereço final em **Site URL** e **Redirect URLs** do Supabase (seção 1).
4. Em **Gerência → Configurações**, preencha "Endereço do site de reservas" (é o link que vai nas mensagens).

Atenção aos commits: a Vercel pode recusar deploy de commits cujo autor não é uma conta do GitHub. Use o e-mail *noreply* da sua conta (`usuario@users.noreply.github.com`) no `git config user.email`.

## 6. Segurança (resumo)

- **RLS em todas as tabelas.** O público (anon) não lê nenhuma tabela: só chama funções públicas específicas, que sempre pedem código **e** telefone juntos (sem enumeração de reservas).
- **Escrita por função.** Reservas, mesas da reserva, fila e mensagens só mudam por funções `security definer` com `set search_path = public`. As permissões começam zeradas e cada função recebe `grant execute` explícito (anon só nas públicas). O UPDATE direto vale só para as colunas que as telas editam; bloqueio de cliente, anonimização e modo demo passam pelas funções.
- **Mesa disputada:** uma constraint de exclusão (`btree_gist`) impede a mesma mesa em horários sobrepostos — se dois clientes reservam ao mesmo tempo, um consegue e o outro é avisado para escolher outro horário.
- **Rotas protegidas no servidor** (layouts): `/painel` exige equipe ativa, `/painel/gerencia` exige gerente, a área do cliente exige login. O `proxy.ts` só renova a sessão.
- **Cabeçalhos:** CSP restritiva (com `connect-src` liberando `https://*.supabase.co` e `wss://*.supabase.co` para o Realtime), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e HSTS — ver `next.config.mjs`.
- `/auth/callback` aceita só uma lista fixa de destinos no parâmetro `next` (sem open redirect). Mensagens de login e de recuperação de senha não revelam se o e-mail existe. Trocar a senha logado exige a senha atual.
- Sem `dangerouslySetInnerHTML` nem `eval`. CSV exportado neutraliza fórmulas (`=`, `+`, `-`, `@`).
- **LGPD:** consentimento obrigatório na reserva, aceite opcional de novidades, Política de Privacidade e Termos, e anonimização de cliente pela ficha.
- **Dependências:** `npm audit --omit=dev` sem vulnerabilidades. O `npm audit` completo aponta o pacote `braces` (GHSA-vfj7-8cjw-p6xm) dentro de ferramentas de **desenvolvimento** (Tailwind 3 e eslint-config-next). Não existe versão corrigida e ele não vai para o site publicado; a única saída seria migrar para o Tailwind 4.

## 7. Estrutura

```
src/
  proxy.ts                  # renova a sessão do Supabase (Next 16)
  app/
    page.tsx, reservar/     # reserva pública
    r/, r/[code]/           # encontrar / gerenciar a reserva (código + telefone)
    (auth)/                 # entrar, cadastro, recuperar e atualizar senha
    (client)/               # minhas reservas, perfil
    painel/entrar/          # login da equipe
    painel/(app)/           # salão (anfitrião) e gerencia/* (gerente)
    auth/callback/          # retorno dos e-mails do Supabase
    privacidade/, termos/
  components/ui/            # botões, campos, modal/bottom-sheet, etc.
  components/salao/         # linha do tempo, mapa, fila, walk-in...
  components/charts/        # gráficos e indicadores dos relatórios
  lib/                      # datas (fuso de SP), formatação, regras, tipos, supabase/*
supabase/
  schema.sql                # tabelas, funções, RLS, permissões, realtime
  seed_demo.sql             # restaurante fictício + demo_reset() + demo_setup_accounts()
```

## 8. O que fica para a fase 2

- **WhatsApp de verdade** (WhatsApp Cloud API, Z-API ou Twilio): trocar o registro simulado em `log_message` por um envio (fila + Edge Function), com opt-out.
- **E-mail transacional** (Resend + SMTP próprio) para confirmação e lembretes.
- **Lembretes agendados no servidor** (pg_cron ou Edge Function agendada). Hoje os lembretes são gerados enquanto o painel do salão está aberto e pelo botão em Mensagens.
- **Pagamento real do sinal** (PIX via Mercado Pago, Pagar.me ou Asaas), com reembolso.
- **Upload de logo** (Supabase Storage); hoje a logo é um endereço de imagem.
- Turnos que passam da meia-noite, vários restaurantes por instalação, integrações com cardápio/PDV, programa de fidelidade e avaliações — fora do escopo desta versão.
