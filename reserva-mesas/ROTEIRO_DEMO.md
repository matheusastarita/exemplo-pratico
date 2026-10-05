# Roteiro da demonstração (5 minutos)

História: um cliente reserva pelo celular → o restaurante vê chegar na hora → o salão funciona com mapa e walk-in → o dono enxerga as faltas → a marca vira a do restaurante de quem está assistindo.

Ensaiado de ponta a ponta (passos e cliques abaixo são os que funcionam no sistema).

---

## Antes de começar (2 minutos, sem plateia)

1. **Horário:** apresente com o restaurante aberto (entre 12h e 22h). O dia de hoje da demo é montado em volta do relógio real: quem está sentado agora, quem está atrasado, quem chega daqui a pouco.
2. **Duas telas:**
   - **Notebook ou tablet** com o painel: abra `/painel/entrar` e toque em **Entrar como Gerente**.
   - **Celular** (ou uma janela estreita do navegador) com a página inicial do site.
3. **Reset:** no notebook, vá em **Configurações → Resetar demonstração → Resetar**. Leva alguns segundos e volta para o **Salão** com o dia cheio e coerente.
4. Deixe o notebook no **Salão** (dia de hoje) e o celular na página inicial.

> Se for apresentar fora do horário, veja o "Plano B" no fim.

---

## 1. O cliente reserva pelo celular (0:00 – 1:15)

**No celular:**
1. Em "Quantas pessoas?", toque em **2**.
2. Escolha **hoje** na faixa de dias.
3. Toque no primeiro horário livre (eles vêm agrupados em Almoço e Jantar; "últimas mesas" aparece quando sobram poucas).
4. Preencha nome e celular, marque o aceite da Política de Privacidade e toque em **Revisar reserva → Confirmar reserva**.

**O que falar:**
- "Sem cadastro, sem senha: em poucos toques a pessoa tem a reserva e um código."
- Mostre na tela de sucesso: **código**, **Adicionar ao calendário**, **compartilhar no WhatsApp** e a prévia da confirmação que o cliente receberia ("simulada na demonstração").
- "Pelo link, o cliente confirma presença, muda o horário ou cancela sozinho — respeitando o prazo que o restaurante definir."

## 2. O restaurante vê chegar na hora (1:15 – 2:00)

**No notebook (Salão):** em cerca de 1 segundo aparece o aviso **"Nova reserva pelo site: … · horário · 2 pessoas"**. Toque em **Ver**: a linha do tempo mostra o cartão da reserva.

**O que falar:**
- "Ninguém atualizou a página: chegou sozinho, em tempo real."
- "A linha do tempo separa quem está atrasado, quem chega na próxima hora, quem está na mesa e o resto do dia. Alergia aparece em destaque, aniversário e VIP também."
- Limpe a busca (o "x" do campo) para voltar à lista completa.

## 3. Mapa de mesas e "chegou sem reserva" (2:00 – 3:00)

**No notebook:**
1. Mostre o **Mapa do salão** (no celular/tablet, aba **Mapa**): cada mesa tem cor, ícone e texto — livre, reservada em breve, atrasada, ocupada (há quanto tempo), pediu a conta, a limpar, bloqueada. Troque de área (Salão, Varanda, Bar).
2. Toque em **Chegou sem reserva**, escolha **4** pessoas.
3. O sistema responde na hora: **"Tem mesa agora: mesa X"** → **Sentar na mesa X**. (Se estiver lotado, ele mostra a espera estimada e coloca na fila.)

**O que falar:**
- "O anfitrião não faz conta de cabeça: o sistema já sabe que mesa serve agora, considerando as reservas que vão chegar."
- "Duas pessoas reservando a mesma mesa ao mesmo tempo? O banco de dados não deixa: uma consegue, a outra escolhe outro horário."
- Opcional: arraste um cartão da linha do tempo até uma mesa do mapa para trocar a mesa (o aviso traz **Desfazer**).

## 4. O dono enxerga as faltas (3:00 – 4:00)

**No notebook**, menu lateral:
1. **Relatórios** (abre em 30 dias): mostre **Taxa de faltas**, **Ocupação das mesas**, reservas por dia, ocupação por dia da semana (sexta e sábado mais cheios) e horários de pico.
2. **Clientes → filtro "Com faltas"** → abra um cliente: histórico de reservas, faltas, observações, tags. Comente o **bloqueio automático** depois de 3 faltas (regra ajustável em **Turnos e regras → Regras**).

**O que falar:**
- "Os números vêm só das reservas: não inventamos faturamento, porque o sistema não tem comanda."
- "Dá para escolher um dia específico e ver tudo dele, e exportar em planilha."

## 5. A cara do seu restaurante (4:00 – 4:45)

**No notebook:** **Configurações**
1. Troque o **Nome do restaurante** pelo nome do restaurante de quem está assistindo.
2. Toque numa cor (ex.: **Vinho**) — a pré-visualização ao lado muda na hora.
3. **Salvar marca**: o painel inteiro muda de cor na hora.

**No celular:** recarregue a página inicial — o site de reservas já está com o novo nome e a nova cor.

**O que falar:** "Nome, cor, logo, contatos e horários são do restaurante. Em minutos o sistema fica com a sua cara."

## 6. Fechamento (4:45 – 5:00)

"O cliente reserva sozinho, o salão trabalha em tempo real e o dono acompanha tudo." Depois da apresentação, rode **Configurações → Resetar demonstração** para deixar tudo pronto para a próxima.

---

## Plano B

- **Fora do horário de funcionamento:** no passo 1, reserve para **amanhã**. Antes, deixe o Salão do notebook em amanhã (seta **›** ao lado da data) — o aviso de "Nova reserva" aparece para o dia que está na tela. O resto do roteiro funciona igual.
- **Hoje sem horários livres:** escolha outro dia (as datas lotadas aparecem marcadas) ou mostre a **lista de espera**, que é oferecida quando o dia está cheio.
- **A internet caiu no meio:** as telas mostram uma mensagem em português com "Tentar novamente"; recarregue quando voltar. O reset deixa tudo como no início.
- **Alguém pergunta "e o WhatsApp de verdade?":** "Na demonstração as mensagens são simuladas — a tela de Mensagens mostra exatamente o que o cliente receberia. A integração com WhatsApp e e-mail é a próxima etapa." (Veja a fase 2 no README.)

## Contas

Os botões **Entrar como Gerente / Anfitrião / Cliente** (em `/painel/entrar` e `/login`) só aparecem com o modo demonstração ligado. As contas e senhas ficam em variáveis de ambiente do servidor — como configurar está no README, seção 2.
