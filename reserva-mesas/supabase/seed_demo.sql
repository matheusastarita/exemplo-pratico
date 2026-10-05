-- ============================================================================
-- Seed da DEMONSTRAÇÃO — restaurante fictício "Bistrô Alecrim"
-- Rode DEPOIS do schema.sql. É idempotente: apaga os dados de operação e recria
-- tudo com datas relativas a hoje (fuso de São Paulo).
--
-- O mesmo código fica disponível como função demo_reset(), que o gerente aciona
-- no painel ("Resetar demonstração") quando restaurant_settings.demo_mode = true.
--
-- O que é gerado:
--   * 3 áreas (Salão, Varanda, Bar) e 20 mesas com o mapa já posicionado
--   * Almoço 12:00–15:00 e Jantar 19:00–23:00, fechado às segundas (se a demo for resetada
--     numa segunda, fecha às terças — o dia de hoje sempre precisa estar aberto e cheio)
--   * 40 clientes "personagem" (VIP, alergia, aniversário, faltas, sumidos) + ~260 clientes comuns
--   * 90 dias de histórico + 14 dias à frente, com sexta/sábado mais cheios e pico às 20h
--   * Hoje "vivo": já atendidos, sentados agora, 2 atrasados, próximos, 2 na fila,
--     1 aniversário, 1 VIP, 1 alergia grave, 1 mesa bloqueada, 1 a limpar
--   * Mensagens simuladas (confirmação, lembretes, cancelamento) e histórico de mudanças
-- ============================================================================

create or replace function public.demo_reset(p_site_url text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.sp_today();
  v_now timestamp := public.sp_now();
  v_anchor timestamp;
  v_site text;
  v_client_email text;
  v_uid uuid;
  a_salao uuid;
  a_varanda uuid;
  a_bar uuid;
  c_mariana uuid;
  d date;
  wd int;
  sh record;
  v_n int;
  v_base numeric;
  v_factor numeric;
  v_curve numeric;
  v_t time;
  v_party int;
  v_status text;
  v_source text;
  v_starts timestamp;
  v_created timestamp;
  v_seated timestamp;
  v_dur int;
  v_r numeric;
  v_cust uuid;
  f_ids uuid[];
  g_ids uuid[];
  lunch_slots time[] := array['12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45','14:00']::time[];
  lunch_w int[] := array[5, 8, 12, 13, 12, 9, 6, 4, 2];
  dinner_slots time[] := array['19:00','19:15','19:30','19:45','20:00','20:15','20:30','20:45','21:00','21:15','21:30']::time[];
  dinner_w int[] := array[3, 5, 7, 10, 14, 14, 12, 9, 6, 4, 2];
  slots time[];
  weights int[];
  v_total int;
  v_pick int;
  v_acc int;
  notes_pool text[] := array[
    'Mesa perto da janela, se possível.',
    'Vamos com um bebê — precisamos de cadeirinha.',
    'Podemos chegar uns 10 minutos atrasados.',
    'Preferimos um lugar mais tranquilo.',
    'Primeira vez no restaurante!',
    'Um dos convidados usa cadeira de rodas.',
    'Gostaríamos de ficar na área externa.',
    'Vamos comemorar uma promoção no trabalho.'];
  diet_pool text[] := array[
    'Um vegetariano no grupo.',
    'Sem glúten para 1 pessoa.',
    'Intolerância à lactose.',
    'Uma pessoa vegana.'];
  -- alocação de mesas em memória
  t_id uuid[];
  t_max int[];
  t_min int[];
  t_area uuid[];
  t_blocked boolean[];
  t_online boolean[];
  p_i int[];
  p_j int[];
  busy timestamp[];
  n_t int;
  cur_date date;
  r record;
  chosen int[];
  v_end timestamp;
  v_hold timestamp;
  i int;
  j int;
  k int;
  v_code text;
  v_close1 date;
  v_close2 date;
  v_closed_wd int;
begin
  -- Pelo painel: só gerente e só com o modo demonstração ligado.
  -- Pelo SQL Editor (sem usuário logado) também funciona.
  if auth.uid() is not null then
    if not public.is_manager()
       or not coalesce((select s.demo_mode from public.restaurant_settings s where s.id = 1), false) then
      raise exception 'not_allowed';
    end if;
  end if;

  perform set_config('app.seeding', 'on', true);
  perform setseed(0.4242);

  -- Dia de folga: segunda. Se hoje for segunda, a folga passa para terça.
  v_closed_wd := case when extract(dow from v_today)::int = 1 then 2 else 1 end;

  select coalesce(nullif(btrim(coalesce(p_site_url, '')), ''), s.public_url), s.demo_client_email
    into v_site, v_client_email
  from public.restaurant_settings s where s.id = 1;

  -- "agora" da demo = horário real arredondado para 5 min. Os status de hoje (sentado,
  -- atrasado, próximo) ficam sempre coerentes com o relógio — por isso o ideal é
  -- apresentar em horário de funcionamento e resetar logo antes (ver ROTEIRO_DEMO.md).
  v_anchor := v_today + make_interval(mins => (floor(extract(epoch from v_now::time) / 60 / 5) * 5)::int);

  truncate public.message_log, public.audit_log, public.waitlist, public.reservation_tables,
           public.reservations, public.customers, public.closures, public.dining_tables,
           public.areas, public.shifts, public.turn_times
    restart identity cascade;

  -- --------------------------------------------------------------------------
  -- Restaurante
  -- --------------------------------------------------------------------------
  insert into public.restaurant_settings (
    id, name, tagline, address, phone, whatsapp, instagram, primary_color, logo_url, public_url,
    slot_step_minutes, min_notice_minutes, max_advance_days, max_party_online, cancel_deadline_hours,
    grace_minutes, no_show_block_after, waitlist_enabled, deposit_enabled, deposit_min_party,
    deposit_per_person, demo_mode, demo_client_email
  ) values (
    1, 'Bistrô Alecrim', 'Cozinha de bistrô, sem pressa.',
    'Rua das Acácias, 214 — Jardim Paulista, São Paulo – SP',
    '(11) 3456-0214', '5511934560214', 'bistroalecrim.demo', '#2F4A3A', null, v_site,
    15, 60, 60, 10, 4, 15, 3, true, true, 8, 50.00, true, v_client_email
  )
  on conflict (id) do update set
    name = excluded.name, tagline = excluded.tagline, address = excluded.address,
    phone = excluded.phone, whatsapp = excluded.whatsapp, instagram = excluded.instagram,
    primary_color = excluded.primary_color, logo_url = excluded.logo_url,
    public_url = excluded.public_url, slot_step_minutes = excluded.slot_step_minutes,
    min_notice_minutes = excluded.min_notice_minutes, max_advance_days = excluded.max_advance_days,
    max_party_online = excluded.max_party_online, cancel_deadline_hours = excluded.cancel_deadline_hours,
    grace_minutes = excluded.grace_minutes, no_show_block_after = excluded.no_show_block_after,
    waitlist_enabled = excluded.waitlist_enabled, deposit_enabled = excluded.deposit_enabled,
    deposit_min_party = excluded.deposit_min_party, deposit_per_person = excluded.deposit_per_person,
    demo_mode = true, demo_client_email = excluded.demo_client_email;

  insert into public.turn_times (party_min, party_max, minutes) values
    (1, 2, 90), (3, 4, 105), (5, 6, 120), (7, 10, 150), (11, 60, 180);

  -- Seis dias por semana; o dia de folga não tem turno
  insert into public.shifts (weekday, name, open_time, last_seating_time, close_time, max_covers)
  select w, x.name, x.o, x.l, x.c, x.m
  from generate_series(0, 6) w
  cross join (values
    ('Almoço', time '12:00', time '14:00', time '15:00', 60),
    ('Jantar', time '19:00', time '21:30', time '23:00', 70)
  ) as x(name, o, l, c, m)
  where w <> v_closed_wd;

  -- Modelos de mensagem padrão (restaura se alguém editou durante a demo)
  insert into public.message_templates (kind, body, active) values
    ('confirmacao', 'Olá, {nome}! Sua reserva no {restaurante} está confirmada para {data} às {hora}, {pessoas}. Código: {codigo}. Para ver, alterar ou cancelar: {link}', true),
    ('lembrete_24h', 'Oi, {nome}! Passando para lembrar: amanhã, {data} às {hora}, tem mesa para {pessoas} esperando por você no {restaurante}. Confirme sua presença: {link}', true),
    ('lembrete_2h', '{nome}, sua reserva é hoje às {hora}. Até daqui a pouco! Endereço: {endereco}. Se precisar mudar algo: {link}', true),
    ('alteracao', '{nome}, sua reserva foi alterada: {data} às {hora}, {pessoas}. Código: {codigo}. Detalhes: {link}', true),
    ('cancelamento', '{nome}, sua reserva de {data} às {hora} foi cancelada. Esperamos receber você em breve no {restaurante}.', true),
    ('lista_espera', 'Boa notícia, {nome}! Abriu uma mesa para {pessoas} no {restaurante} em {data}. Responda esta mensagem ou fale com a recepção para garantir o seu lugar.', true)
  on conflict (kind) do update set body = excluded.body, active = true, updated_at = now();

  -- --------------------------------------------------------------------------
  -- Salão e mesas (posições em % do mapa de cada área)
  -- --------------------------------------------------------------------------
  insert into public.areas (name, sort_order, bookable_online) values ('Salão', 1, true) returning id into a_salao;
  insert into public.areas (name, sort_order, bookable_online) values ('Varanda', 2, true) returning id into a_varanda;
  insert into public.areas (name, sort_order, bookable_online) values ('Bar', 3, false) returning id into a_bar;

  insert into public.dining_tables (area_id, label, min_seats, max_seats, combinable, shape, pos_x, pos_y, width, height) values
    (a_salao, '1', 1, 2, true, 'square', 6, 8, 10, 13),
    (a_salao, '2', 1, 2, true, 'square', 19, 8, 10, 13),
    (a_salao, '3', 2, 4, true, 'square', 34, 7, 12, 15),
    (a_salao, '4', 2, 4, true, 'square', 49, 7, 12, 15),
    (a_salao, '5', 2, 4, false, 'round', 7, 38, 12, 16),
    (a_salao, '6', 2, 4, false, 'round', 25, 38, 12, 16),
    (a_salao, '7', 4, 6, false, 'rect', 42, 39, 20, 14),
    (a_salao, '8', 1, 2, true, 'square', 6, 72, 10, 13),
    (a_salao, '9', 1, 2, true, 'square', 19, 72, 10, 13),
    (a_salao, '10', 2, 4, true, 'square', 34, 71, 12, 15),
    (a_salao, '11', 2, 4, true, 'square', 49, 71, 12, 15),
    (a_salao, '12', 6, 10, false, 'rect', 72, 30, 22, 30),
    (a_varanda, 'V1', 2, 4, false, 'round', 8, 12, 14, 19),
    (a_varanda, 'V2', 2, 4, false, 'round', 30, 12, 14, 19),
    (a_varanda, 'V3', 1, 2, true, 'square', 54, 14, 11, 15),
    (a_varanda, 'V4', 1, 2, true, 'square', 69, 14, 11, 15),
    (a_varanda, 'V5', 4, 6, false, 'rect', 30, 58, 26, 18),
    (a_bar, 'B1', 1, 2, false, 'square', 10, 30, 12, 16),
    (a_bar, 'B2', 1, 2, false, 'square', 30, 30, 12, 16),
    (a_bar, 'B3', 2, 4, false, 'round', 55, 28, 15, 20);

  update public.dining_tables set blocked = true, blocked_reason = 'Banqueta com defeito, aguardando reparo'
   where label = 'B2';

  -- Fechamentos: um jantar fechado para evento e um dia inteiro de manutenção
  v_close1 := v_today + 8;
  while extract(dow from v_close1)::int <> 4 loop v_close1 := v_close1 + 1; end loop;
  v_close2 := v_today + 17;
  if extract(dow from v_close2)::int = v_closed_wd then v_close2 := v_close2 + 1; end if;
  insert into public.closures (date, shift_id, reason)
  select v_close1, s.id, 'Evento fechado — jantar de empresa'
  from public.shifts s where s.weekday = 4 and s.name = 'Jantar';
  insert into public.closures (date, shift_id, reason) values (v_close2, null, 'Fechado para manutenção da cozinha');

  -- --------------------------------------------------------------------------
  -- Clientes: 40 "personagens" + clientes comuns
  -- --------------------------------------------------------------------------
  drop table if exists seed_cust;
  create temp table seed_cust (
    key text primary key, id uuid not null default gen_random_uuid(), full_name text, phone text,
    email text, tags text[], notes text, allergies text, birthday date, marketing boolean,
    kind text, weight int
  ) on commit drop;

  insert into seed_cust (key, full_name, phone, email, tags, notes, allergies, birthday, marketing, kind, weight) values
    ('mariana', 'Mariana Costa', '5511987650101', 'mariana.costa@email.com', '{Frequente}', 'Prefere a varanda.', null, (v_today - interval '33 years' + interval '41 days')::date, true, 'frequent', 0),
    ('rafael', 'Rafael Oliveira', '5511987650102', 'rafael.oliveira@email.com', '{Frequente}', null, null, '1987-03-14', true, 'frequent', 6),
    ('juliana', 'Juliana Santos', '5511987650103', 'ju.santos@email.com', '{VIP}', 'Sempre pede o vinho da casa. Gosta da mesa 6.', null, '1984-07-02', true, 'frequent', 5),
    ('pedro', 'Pedro Henrique Almeida', '5521987650104', null, '{}', null, null, null, false, 'regular', 2),
    ('camila', 'Camila Ferreira', '5511987650105', 'camila.ferreira@email.com', '{Alergia}', null, 'Alergia GRAVE a frutos do mar (camarão, lula, mariscos). Avisar a cozinha.', '1992-11-23', true, 'regular', 2),
    ('lucas', 'Lucas Martins', '5531987650106', null, '{}', null, null, null, false, 'regular', 2),
    ('beatriz', 'Beatriz Rocha', '5511987650107', 'bia.rocha@email.com', '{}', null, null, (date_trunc('month', v_today) + interval '9 days' - interval '29 years')::date, true, 'regular', 2),
    ('gustavo', 'Gustavo Lima', '5541987650108', null, '{}', null, null, null, false, 'regular', 2),
    ('fernanda', 'Fernanda Ribeiro', '5511987650109', 'fe.ribeiro@email.com', '{VIP,Imprensa}', 'Crítica gastronômica. Atendimento impecável.', null, '1979-05-30', true, 'frequent', 3),
    ('thiago', 'Thiago Carvalho', '5511987650110', 'thiago.c@email.com', '{Frequente}', null, null, '1990-01-18', false, 'frequent', 5),
    ('larissa', 'Larissa Gomes', '5519987650111', null, '{}', null, null, null, true, 'regular', 2),
    ('bruno', 'Bruno Teixeira', '5511987650112', null, '{}', null, null, null, false, 'regular', 2),
    ('aline', 'Aline Barbosa', '5511987650113', null, '{}', null, null, null, false, 'blocked', 0),
    ('rodrigo', 'Rodrigo Pereira', '5521987650114', null, '{}', null, null, null, false, 'regular', 2),
    ('patricia', 'Patrícia Mendes', '5511987650115', 'patricia.mendes@email.com', '{Frequente}', null, null, (date_trunc('month', v_today) + interval '22 days' - interval '45 years')::date, true, 'frequent', 5),
    ('felipe', 'Felipe Araújo', '5511987650116', null, '{}', null, 'Intolerância à lactose.', null, false, 'regular', 2),
    ('renata', 'Renata Correia', '5513987650117', null, '{}', null, null, null, true, 'regular', 2),
    ('diego', 'Diego Nascimento', '5511987650118', null, '{}', null, null, null, false, 'regular', 2),
    ('vanessa', 'Vanessa Cardoso', '5511987650119', 'vanessa.cardoso@email.com', '{}', null, null, null, true, 'regular', 2),
    ('marcelo', 'Marcelo Dias', '5561987650120', null, '{}', 'Vem a negócios, costuma reservar para 4.', null, null, false, 'regular', 2),
    ('carolina', 'Carolina Moreira', '5511987650121', 'carol.moreira@email.com', '{Aniversariante}', null, null, (v_today - interval '36 years')::date, true, 'regular', 1),
    ('andre', 'André Souza', '5511987650122', null, '{}', null, null, null, false, 'regular', 2),
    ('leticia', 'Letícia Freitas', '5551987650123', null, '{}', null, null, null, true, 'regular', 2),
    ('ricardo', 'Ricardo Monteiro', '5511987650124', 'ricardo.monteiro@email.com', '{VIP}', 'Sócio de escritório na região. Oferecer a carta de vinhos.', null, '1975-09-12', true, 'frequent', 4),
    ('natalia', 'Natália Pinto', '5511987650125', null, '{}', null, null, null, false, 'regular', 2),
    ('eduardo', 'Eduardo Ramos', '5511987650126', null, '{}', null, null, null, false, 'regular', 2),
    ('gabriela', 'Gabriela Nunes', '5571987650127', 'gabi.nunes@email.com', '{}', null, 'Vegetariana.', null, true, 'regular', 2),
    ('leonardo', 'Leonardo Castro', '5511987650128', null, '{}', null, null, null, false, 'regular', 2),
    ('isabela', 'Isabela Duarte', '5511987650129', null, '{}', null, null, null, true, 'regular', 2),
    ('vinicius', 'Vinícius Barros', '5581987650130', null, '{}', null, null, null, false, 'regular', 2),
    ('tatiane', 'Tatiane Moura', '5511987650131', null, '{}', null, null, null, false, 'regular', 2),
    ('henrique', 'Henrique Farias', '5511987650132', null, '{}', null, null, null, false, 'regular', 2),
    ('priscila', 'Priscila Lopes', '5585987650133', null, '{}', null, null, null, true, 'regular', 2),
    ('daniel', 'Daniel Batista', '5511987650134', null, '{}', null, null, null, false, 'regular', 2),
    ('amanda', 'Amanda Vieira', '5511987650135', 'amanda.vieira@email.com', '{}', null, 'Sem glúten (doença celíaca).', null, true, 'regular', 2),
    ('fabio', 'Fábio Rezende', '5511987650136', null, '{}', null, null, null, false, 'sumido', 0),
    ('sabrina', 'Sabrina Campos', '5511987650137', 'sabrina.campos@email.com', '{}', null, null, null, true, 'sumido', 0),
    ('otavio', 'Otávio Guerra', '5511987650138', null, '{Frequente}', 'Era cliente fiel de sexta à noite.', null, null, false, 'sumido', 0),
    ('elaine', 'Elaine Machado', '5548987650139', null, '{}', null, null, null, false, 'sumido', 0),
    ('roberto', 'Roberto Siqueira', '5511987650140', null, '{Acessibilidade}', 'Cadeirante — reservar mesa de fácil acesso (5, 6 ou 7).', null, null, false, 'regular', 2);

  insert into public.customers (id, full_name, phone, email, tags, notes, allergies, birthday, marketing_consent,
                                privacy_consent_at, created_at)
  select id, full_name, phone, email, tags, notes, allergies, birthday, marketing,
         now() - interval '200 days', now() - make_interval(days => 120 + (random() * 300)::int)
  from seed_cust;

  update public.customers set blocked = true, blocked_reason = 'Bloqueio automático: 3 faltas'
   where id = (select id from seed_cust where key = 'aline');

  select id into c_mariana from seed_cust where key = 'mariana';

  -- clientes comuns (nomes combinados, DDD variados — maioria de São Paulo)
  with fn as (select array[
      'Ana','João','Maria','José','Paula','Carlos','Luiza','Paulo','Clara','Marcos','Júlia','Lucas',
      'Helena','Gabriel','Laura','Mateus','Alice','Rafaela','Bruna','Igor','Sofia','Caio','Lívia','Arthur',
      'Manuela','Davi','Valentina','Heitor','Yasmin','Samuel','Cecília','Murilo','Lorena','Enzo','Bianca',
      'Raul','Elisa','Otávio','Jéssica','Victor','Débora','Sérgio','Cláudia','Wagner','Simone','Nelson',
      'Regina','Fábio','Mônica','Alexandre','Viviane','Hugo'] a),
  ln as (select array[
      'Silva','Souza','Oliveira','Pereira','Lima','Ferreira','Costa','Rodrigues','Almeida','Nascimento',
      'Araújo','Melo','Barbosa','Ribeiro','Martins','Carvalho','Rocha','Gomes','Moura','Dias','Teixeira',
      'Cardoso','Correia','Mendes','Freitas','Vieira','Castro','Pinto','Ramos','Nunes','Duarte','Batista',
      'Lopes','Machado','Campos','Monteiro','Tavares','Andrade','Prado','Fonseca','Queiroz','Sales',
      'Azevedo','Brandão','Coelho'] a),
  ddd as (select array['11','11','11','11','11','11','11','11','21','31','41','19','13','12','61','51','71','47'] a)
  insert into public.customers (full_name, phone, email, marketing_consent, privacy_consent_at, created_at)
  select fn.a[1 + (gi % 52)] || ' ' || ln.a[1 + ((gi * 7) % 45)],
         '55' || ddd.a[1 + ((gi * 5) % 18)] || '97' || lpad((100000 + gi * 137)::text, 7, '0'),
         case when gi % 3 = 0 then lower(translate(fn.a[1 + (gi % 52)], 'áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ', 'aeiouaeoaocAEIOUAEOAOC'))
                                   || '.' || lower(translate(ln.a[1 + ((gi * 7) % 45)], 'áéíóúâêôãõç', 'aeiouaeoaoc')) || '@email.com' end,
         random() < 0.35,
         now() - make_interval(days => (random() * 150)::int),
         now() - make_interval(days => 10 + (random() * 400)::int)
  from generate_series(1, 260) gi, fn, ln, ddd;

  select array_agg(sc.id) into f_ids
  from seed_cust sc cross join lateral generate_series(1, sc.weight) g
  where sc.kind in ('regular', 'frequent');

  select array_agg(c.id) into g_ids
  from public.customers c where c.id not in (select id from seed_cust);

  -- --------------------------------------------------------------------------
  -- Reservas (primeiro numa tabela temporária; mesas atribuídas depois, em ordem)
  -- --------------------------------------------------------------------------
  drop table if exists seed_res;
  create temp table seed_res (
    seq serial primary key, id uuid not null default gen_random_uuid(), code text,
    customer_id uuid not null, date date not null, start_time time not null, party int not null,
    duration int not null, status text not null, source text not null, occasion text, notes text,
    dietary text, internal text, area_pref uuid, created_at timestamp not null, seated_at timestamp,
    completed_at timestamp, cancelled_at timestamp, cancel_reason text, check_req timestamp,
    confirmed_cust timestamp, deposit_status text not null default 'none', deposit_amount numeric(10, 2),
    table_ids uuid[], skip boolean not null default false
  ) on commit drop;

  for d in select g::date from generate_series((v_today - 90)::timestamp, (v_today + 14)::timestamp, interval '1 day') g loop
    wd := extract(dow from d)::int;
    continue when wd = v_closed_wd;

    for sh in
      select s.* from public.shifts s
      where s.weekday = wd and s.is_open
        and not exists (select 1 from public.closures c where c.date = d and (c.shift_id is null or c.shift_id = s.id))
      order by s.open_time
    loop
      if sh.name = 'Almoço' then
        v_base := 11; slots := lunch_slots; weights := lunch_w;
        v_factor := case wd when 2 then 0.55 when 3 then 0.65 when 4 then 0.7 when 5 then 0.85 when 6 then 1.0 else 1.25 end;
      else
        v_base := 15; slots := dinner_slots; weights := dinner_w;
        v_factor := case wd when 2 then 0.5 when 3 then 0.6 when 4 then 0.75 when 5 then 1.15 when 6 then 1.25 else 0.7 end;
      end if;

      -- curva de antecedência: quanto mais longe, menos reservas já feitas
      v_curve := case
        when d <= v_today then 1
        when d <= v_today + 2 then 0.9
        when d <= v_today + 7 then 0.62
        else 0.32 end;

      v_n := round(v_base * v_factor * v_curve * (0.85 + random() * 0.3));
      select sum(x) into v_total from unnest(weights) x;

      for k in 1 .. v_n loop
        -- horário sorteado pelos pesos (pico às 12:45 e às 20:00)
        v_pick := 1 + floor(random() * v_total)::int;
        v_acc := 0;
        for i in 1 .. array_length(slots, 1) loop
          v_acc := v_acc + weights[i];
          if v_pick <= v_acc then v_t := slots[i]; exit; end if;
        end loop;
        v_starts := d + v_t;

        -- hoje, a janela em torno do "agora" é montada à mão (mais abaixo)
        continue when d = v_today and v_starts between v_anchor - interval '210 minutes' and v_anchor + interval '180 minutes';

        v_r := random();
        v_party := case
          when v_r < 0.03 then 1 when v_r < 0.45 then 2 when v_r < 0.55 then 3 when v_r < 0.79 then 4
          when v_r < 0.85 then 5 when v_r < 0.93 then 6 when v_r < 0.95 then 7 when v_r < 0.97 then 8
          when v_r < 0.99 then 9 else 10 end;
        v_dur := public.turn_minutes(v_party);

        v_r := random();
        v_source := case when v_r < 0.55 then 'site' when v_r < 0.74 then 'telefone'
                         when v_r < 0.91 then 'whatsapp' else 'instagram' end;

        v_cust := case when random() < 0.36 then f_ids[1 + floor(random() * array_length(f_ids, 1))::int]
                       else g_ids[1 + floor(random() * array_length(g_ids, 1))::int] end;

        if v_starts < v_now then
          v_r := random();
          v_status := case when v_r < 0.085 then 'cancelled' when v_r < 0.13 then 'no_show' else 'completed' end;
          v_created := v_starts - make_interval(mins => (60 + random() * 60 * 24 * 9)::int);
        else
          v_status := case when random() < 0.06 then 'cancelled' else 'confirmed' end;
          v_created := v_now - make_interval(mins => (5 + random() * least(60 * 24 * 10, extract(epoch from (v_starts - v_now)) / 60 + 60 * 24 * 3))::int);
          if v_created > v_now - interval '5 minutes' then v_created := v_now - interval '5 minutes'; end if;
        end if;

        v_seated := case when v_status = 'completed'
                         then v_starts + make_interval(mins => (random() * 22 - 6)::int) end;

        insert into seed_res (customer_id, date, start_time, party, duration, status, source, occasion, notes,
                              dietary, area_pref, created_at, seated_at, completed_at, cancelled_at, cancel_reason,
                              confirmed_cust, deposit_status, deposit_amount)
        values (
          v_cust, d, v_t, v_party, v_dur, v_status, v_source,
          case when random() < 0.06 then 'aniversario' when random() < 0.05 then 'casal'
               when random() < 0.04 then 'negocios' when random() < 0.03 then 'familia' end,
          case when random() < 0.1 then notes_pool[1 + floor(random() * array_length(notes_pool, 1))::int] end,
          case when random() < 0.05 then diet_pool[1 + floor(random() * array_length(diet_pool, 1))::int] end,
          case when random() < 0.15 then (case when random() < 0.6 then a_varanda else a_salao end) end,
          v_created,
          v_seated,
          case when v_status = 'completed'
               then v_seated + make_interval(mins => (v_dur * (0.78 + random() * 0.32))::int) end,
          case when v_status = 'cancelled'
               then least(v_now - interval '10 minutes', v_starts - make_interval(mins => (30 + random() * 60 * 48)::int)) end,
          case when v_status = 'cancelled'
               then (array['Cancelada pelo cliente', 'Mudança de planos', 'Imprevisto no trabalho', 'Cancelada pelo cliente'])[1 + floor(random() * 4)::int] end,
          case when v_source = 'site' and random() < 0.4 and v_starts - interval '20 hours' < v_now
               then greatest(v_created, v_starts - interval '20 hours') end,
          case when v_party >= 8 then (case when v_status = 'cancelled' then 'refunded' when random() < 0.75 then 'paid' else 'pending' end) else 'none' end,
          case when v_party >= 8 then v_party * 50.00 end
        );
      end loop;

      -- clientes sem reserva (walk-in) nos turnos já passados
      if d < v_today or (d = v_today and d + sh.close_time < v_anchor - interval '210 minutes') then
        for k in 1 .. round(v_factor * 2.2 * random())::int loop
          v_t := slots[1 + floor(random() * array_length(slots, 1))::int] + interval '10 minutes';
          v_starts := d + v_t;
          v_party := (array[1, 2, 2, 2, 3, 4])[1 + floor(random() * 6)::int];
          v_dur := public.turn_minutes(v_party);
          v_seated := v_starts;
          insert into seed_res (customer_id, date, start_time, party, duration, status, source, created_at, seated_at, completed_at)
          values (g_ids[1 + floor(random() * array_length(g_ids, 1))::int], d, v_t, v_party, v_dur, 'completed', 'walk_in',
                  v_starts, v_seated, v_seated + make_interval(mins => (v_dur * (0.7 + random() * 0.3))::int));
        end loop;
      end if;
    end loop;
  end loop;

  -- Pending sem sinal pago só faz sentido no futuro; no passado vira pago.
  update seed_res set deposit_status = 'paid'
   where deposit_status = 'pending' and date + start_time < v_now;
  update seed_res set status = 'pending'
   where deposit_status = 'pending' and status = 'confirmed';

  -- Faltas só de clientes comuns (os "personagens" têm histórico controlado)
  update seed_res set status = 'completed',
         seated_at = date + start_time + interval '5 minutes',
         completed_at = date + start_time + make_interval(mins => duration)
   where status = 'no_show' and customer_id = any (f_ids);
  -- ...e no máximo 2 faltas por cliente comum (3 bloqueia automaticamente)
  update seed_res s set status = 'completed',
         seated_at = s.date + s.start_time + interval '5 minutes',
         completed_at = s.date + s.start_time + make_interval(mins => s.duration)
  from (select seq, row_number() over (partition by customer_id order by date) rn
        from seed_res where status = 'no_show') x
  where x.seq = s.seq and x.rn > 2;

  -- Histórico controlado dos "personagens"
  -- Mariana (conta de cliente da demo): visitas frequentes, 1 cancelada e 2 próximas
  insert into seed_res (customer_id, date, start_time, party, duration, status, source, occasion, notes, area_pref,
                        created_at, seated_at, completed_at, cancelled_at, cancel_reason)
  select c_mariana, x.d, x.t, x.p, public.turn_minutes(x.p), x.s, 'site', x.o, x.n, a_varanda,
         (x.d + x.t) - interval '3 days',
         case when x.s = 'completed' then x.d + x.t + interval '4 minutes' end,
         case when x.s = 'completed' then x.d + x.t + interval '95 minutes' end,
         case when x.s = 'cancelled' then (x.d + x.t) - interval '1 day' end,
         case when x.s = 'cancelled' then 'Mudança de planos' end
  from (values
    (v_today - 82, time '20:00', 2, 'completed', 'casal', null),
    (v_today - 60, time '13:00', 4, 'completed', 'familia', 'Vamos com minha mãe.'),
    (v_today - 45, time '20:30', 2, 'completed', null, null),
    (v_today - 33, time '20:00', 2, 'cancelled', null, null),
    (v_today - 23, time '12:45', 3, 'completed', null, null),
    (v_today - 9, time '20:15', 2, 'completed', 'casal', 'Mesa na varanda, se possível.'),
    (v_today + 3, time '20:00', 2, 'confirmed', 'casal', 'Mesa na varanda, se possível.'),
    (v_today + 11, time '13:00', 5, 'confirmed', 'familia', 'Almoço de família — uma cadeirinha de bebê.')
  ) as x(d, t, p, s, o, n)
  where extract(dow from x.d)::int <> v_closed_wd
    and not exists (select 1 from public.closures c where c.date = x.d and c.shift_id is null);

  -- Clientes "sumidos": última visita há mais de 60 dias
  insert into seed_res (customer_id, date, start_time, party, duration, status, source, created_at, seated_at, completed_at)
  select sc.id, x.d, x.t, x.p, public.turn_minutes(x.p), 'completed', x.src,
         (x.d + x.t) - interval '2 days', x.d + x.t + interval '5 minutes', x.d + x.t + interval '100 minutes'
  from seed_cust sc
  join (values
    ('fabio', v_today - 112, time '20:00', 2, 'telefone'), ('fabio', v_today - 96, time '20:30', 2, 'site'),
    ('fabio', v_today - 75, time '13:00', 3, 'site'),
    ('sabrina', v_today - 101, time '12:30', 2, 'site'), ('sabrina', v_today - 69, time '19:45', 4, 'whatsapp'),
    ('otavio', v_today - 118, time '20:00', 4, 'telefone'), ('otavio', v_today - 104, time '20:00', 4, 'telefone'),
    ('otavio', v_today - 90, time '20:15', 2, 'telefone'), ('otavio', v_today - 64, time '20:00', 4, 'telefone'),
    ('elaine', v_today - 93, time '13:15', 2, 'instagram'), ('elaine', v_today - 66, time '20:00', 2, 'site')
  ) as x(key, d, t, p, src) on x.key = sc.key
  where extract(dow from x.d)::int <> v_closed_wd;

  -- Aline: 3 faltas -> bloqueada automaticamente
  insert into seed_res (customer_id, date, start_time, party, duration, status, source, created_at, seated_at, completed_at)
  select (select id from seed_cust where key = 'aline'), x.d, x.t, x.p, public.turn_minutes(x.p), x.s, 'site',
         (x.d + x.t) - interval '2 days',
         case when x.s = 'completed' then x.d + x.t + interval '5 minutes' end,
         case when x.s = 'completed' then x.d + x.t + interval '90 minutes' end
  from (values
    (v_today - 85, time '20:00', 2, 'completed'), (v_today - 52, time '20:30', 4, 'no_show'),
    (v_today - 31, time '20:00', 2, 'no_show'), (v_today - 13, time '19:45', 2, 'no_show')
  ) as x(d, t, p, s)
  where extract(dow from x.d)::int <> v_closed_wd;

  -- --------------------------------------------------------------------------
  -- Hoje, em torno de "agora" (montado à mão para a demonstração ficar viva)
  -- --------------------------------------------------------------------------
  insert into seed_res (customer_id, date, start_time, party, duration, status, source, occasion, notes, dietary,
                        internal, created_at, seated_at, completed_at, cancelled_at, cancel_reason, check_req,
                        confirmed_cust, deposit_status, deposit_amount)
  select coalesce(sc.id, g_ids[1 + floor(random() * array_length(g_ids, 1))::int]),
         (v_anchor + make_interval(mins => x.off))::date,
         (v_anchor + make_interval(mins => x.off))::time,
         x.p, public.turn_minutes(x.p), x.s, x.src, x.occ, x.notes, x.diet, x.internal,
         case when x.src = 'walk_in' then v_anchor + make_interval(mins => x.off)
              else v_anchor + make_interval(mins => x.off) - interval '2 days' end,
         case when x.s in ('seated', 'completed') then v_anchor + make_interval(mins => x.off + 3) end,
         case when x.s = 'completed' then v_anchor + make_interval(mins => x.off + 3 + public.turn_minutes(x.p) - 10) end,
         case when x.s = 'cancelled' then v_now - interval '3 hours' end,
         case when x.s = 'cancelled' then 'Cancelada pelo cliente' end,
         case when x.chk then v_now - interval '4 minutes' end,
         case when x.confirmed then v_anchor + make_interval(mins => x.off) - interval '5 hours' end,
         case when x.p >= 8 then 'paid' else 'none' end,
         case when x.p >= 8 then x.p * 50.00 end
  from (values
    -- já atendidos hoje
    (-210, 'rafael', 2, 'completed', 'site', null, null, null, null, false, false),
    (-195, null, 4, 'completed', 'telefone', null, null, null, null, false, false),
    (-180, 'patricia', 2, 'completed', 'site', null, null, null, null, false, true),
    (-165, null, 3, 'completed', 'whatsapp', null, null, null, null, false, false),
    (-150, 'thiago', 4, 'completed', 'site', 'negocios', null, null, null, false, true),
    (-135, null, 2, 'completed', 'walk_in', null, null, null, null, false, false),
    (-120, 'diego', 2, 'no_show', 'site', null, null, null, null, false, false),
    -- sentados agora
    (-80, null, 4, 'seated', 'site', null, null, null, null, true, false),
    (-65, 'fernanda', 2, 'seated', 'telefone', null, null, null, 'Crítica gastronômica — atenção redobrada.', false, true),
    (-50, null, 6, 'seated', 'whatsapp', 'comemoracao', null, null, null, false, false),
    (-40, null, 2, 'seated', 'site', 'casal', null, null, null, false, true),
    (-30, null, 3, 'seated', 'walk_in', null, null, null, null, false, false),
    (-15, 'gustavo', 4, 'seated', 'site', null, null, null, null, false, false),
    -- atrasados (passou da tolerância e ainda não chegaram)
    (-25, 'bruno', 2, 'confirmed', 'site', null, null, null, null, false, false),
    (-20, 'larissa', 4, 'confirmed', 'telefone', null, 'Podemos chegar uns 10 minutos atrasados.', null, null, false, false),
    -- próximos
    (15, null, 2, 'confirmed', 'site', null, null, null, null, false, true),
    (20, 'leonardo', 2, 'confirmed', 'instagram', null, null, null, null, false, false),
    (30, 'ricardo', 4, 'confirmed', 'telefone', 'negocios', null, null, 'Cliente VIP — oferecer a carta de vinhos.', false, true),
    (45, 'camila', 3, 'confirmed', 'site', null, null, 'Alergia GRAVE a frutos do mar — evitar contaminação cruzada.', null, false, true),
    (45, null, 2, 'confirmed', 'whatsapp', null, null, null, null, false, false),
    (60, 'carolina', 6, 'confirmed', 'site', 'aniversario', 'Vamos comemorar meu aniversário! Se der, uma vela na sobremesa.', null, 'Aniversário — preparar a sobremesa com vela.', false, true),
    (60, null, 2, 'cancelled', 'site', null, null, null, null, false, false),
    (75, null, 4, 'confirmed', 'site', null, null, null, null, false, false),
    (90, 'roberto', 2, 'confirmed', 'telefone', null, null, null, 'Cadeirante — mesa de fácil acesso.', false, false),
    (105, 'henrique', 5, 'confirmed', 'site', 'familia', null, 'Uma pessoa vegana.', null, false, false),
    (120, null, 8, 'confirmed', 'site', 'comemoracao', 'Confraternização da equipe.', null, null, false, true),
    (150, null, 2, 'confirmed', 'whatsapp', null, null, null, null, false, false),
    (180, null, 4, 'confirmed', 'site', null, null, null, null, false, false)
  ) as x(off, key, p, s, src, occ, notes, diet, internal, chk, confirmed)
  left join seed_cust sc on sc.key = x.key
  where (v_anchor + make_interval(mins => x.off))::date = v_today;

  -- --------------------------------------------------------------------------
  -- Atribuição de mesas em ordem de horário (menor mesa que comporta; senão, duas vizinhas)
  -- --------------------------------------------------------------------------
  select array_agg(t.id order by t.max_seats, length(t.label), t.label),
         array_agg(t.max_seats order by t.max_seats, length(t.label), t.label),
         array_agg(t.min_seats order by t.max_seats, length(t.label), t.label),
         array_agg(t.area_id order by t.max_seats, length(t.label), t.label),
         array_agg(t.blocked order by t.max_seats, length(t.label), t.label),
         array_agg(a.bookable_online order by t.max_seats, length(t.label), t.label)
    into t_id, t_max, t_min, t_area, t_blocked, t_online
  from public.dining_tables t join public.areas a on a.id = t.area_id;
  n_t := array_length(t_id, 1);

  select array_agg(array_position(t_id, x.a) order by x.s), array_agg(array_position(t_id, x.b) order by x.s)
    into p_i, p_j
  from (
    select ta.id a, tb.id b, ta.max_seats + tb.max_seats s
    from public.dining_tables ta
    join public.dining_tables tb on tb.area_id = ta.area_id and ta.id < tb.id
    where ta.combinable and tb.combinable
      and sqrt(power((ta.pos_x + ta.width / 2) - (tb.pos_x + tb.width / 2), 2)
             + power((ta.pos_y + ta.height / 2) - (tb.pos_y + tb.height / 2), 2)) <= 26
  ) x;

  cur_date := null;
  for r in select * from seed_res order by date, start_time, seq loop
    if r.date is distinct from cur_date then
      busy := array_fill('-infinity'::timestamp, array[n_t]);
      cur_date := r.date;
    end if;

    v_code := public.gen_reservation_code();
    while exists (select 1 from seed_res s where s.code = v_code) loop
      v_code := public.gen_reservation_code();
    end loop;

    if r.status = 'cancelled' then
      update seed_res set code = v_code where seq = r.seq;
      continue;
    end if;

    v_starts := r.date + r.start_time;
    v_end := v_starts + make_interval(mins => r.duration);
    v_hold := case when r.status = 'no_show' then v_starts + interval '20 minutes' else v_end end;
    chosen := null;

    for k in 1 .. 2 loop
      for i in 1 .. n_t loop
        if busy[i] <= v_starts and t_max[i] >= r.party and t_min[i] <= r.party
           and not (t_blocked[i] and r.date >= v_today)
           and (t_online[i] or r.source <> 'site')
           and (k = 2 or r.area_pref is null or t_area[i] = r.area_pref) then
          chosen := array[i];
          exit;
        end if;
      end loop;
      exit when chosen is not null;
    end loop;

    if chosen is null and p_i is not null then
      for k in 1 .. array_length(p_i, 1) loop
        i := p_i[k];
        j := p_j[k];
        if busy[i] <= v_starts and busy[j] <= v_starts and t_max[i] + t_max[j] >= r.party
           and not ((t_blocked[i] or t_blocked[j]) and r.date >= v_today)
           and ((t_online[i] and t_online[j]) or r.source <> 'site') then
          chosen := array[i, j];
          exit;
        end if;
      end loop;
    end if;

    if chosen is null then
      update seed_res set skip = true where seq = r.seq;   -- salão lotado nesse horário
      continue;
    end if;

    foreach i in array chosen loop
      busy[i] := v_hold;
    end loop;
    update seed_res set code = v_code, table_ids = (select array_agg(t_id[x]) from unnest(chosen) x)
     where seq = r.seq;
  end loop;

  -- --------------------------------------------------------------------------
  -- Grava reservas e mesas
  -- --------------------------------------------------------------------------
  insert into public.reservations (
    id, code, customer_id, party_size, date, start_time, duration_minutes, status, source, occasion,
    notes, dietary_notes, internal_notes, area_preference, confirmed_by_customer_at, seated_at,
    check_requested_at, completed_at, cancelled_at, cancel_reason, deposit_status, deposit_amount,
    created_at, updated_at
  )
  select s.id, s.code, s.customer_id, s.party, s.date, s.start_time, s.duration, s.status, s.source, s.occasion,
         s.notes, s.dietary, s.internal, s.area_pref,
         (s.confirmed_cust + interval '3 hours') at time zone 'utc',
         (s.seated_at + interval '3 hours') at time zone 'utc',
         (s.check_req + interval '3 hours') at time zone 'utc',
         (s.completed_at + interval '3 hours') at time zone 'utc',
         (s.cancelled_at + interval '3 hours') at time zone 'utc',
         s.cancel_reason, s.deposit_status, s.deposit_amount,
         (s.created_at + interval '3 hours') at time zone 'utc',
         (coalesce(s.completed_at, s.cancelled_at, s.seated_at, s.created_at) + interval '3 hours') at time zone 'utc'
  from seed_res s
  where not s.skip;

  insert into public.reservation_tables (reservation_id, table_id, time_range, active)
  select s.id, t,
         tsrange(s.date + s.start_time, s.date + s.start_time + make_interval(mins => s.duration)),
         s.status in ('pending', 'confirmed', 'seated')
  from seed_res s cross join unnest(s.table_ids) t
  where not s.skip and s.table_ids is not null;

  -- Mesa "a limpar": a do último grupo que saiu hoje, se não houver ninguém nela agora
  update public.dining_tables set cleaning_since = now() - interval '6 minutes'
   where id = (
     select rt.table_id
     from public.reservation_tables rt
     join public.reservations res on res.id = rt.reservation_id
     where res.date = v_today and res.status = 'completed'
       and not exists (
         select 1 from public.reservation_tables x
         where x.table_id = rt.table_id and x.active
           and x.time_range && tsrange(v_now - interval '10 minutes', v_now + interval '45 minutes'))
     order by res.completed_at desc
     limit 1);

  -- --------------------------------------------------------------------------
  -- Fila de espera de hoje (2 grupos que chegaram sem reserva) + 1 pedido pelo site
  -- --------------------------------------------------------------------------
  insert into public.waitlist (customer_id, party_size, date, source, quoted_wait_minutes, notes, status, created_at)
  values
    (g_ids[11], 4, v_today, 'walk_in', 30, 'Família com criança pequena.', 'waiting', now() - interval '24 minutes'),
    (g_ids[27], 2, v_today, 'walk_in', 15, null, 'waiting', now() - interval '9 minutes');

  insert into public.waitlist (customer_id, party_size, date, source, preferred_from, preferred_to, status, created_at)
  select g_ids[42], 6, x, 'site', time '20:00', time '21:30', 'waiting', now() - interval '1 day'
  from (select v_today + g as x from generate_series(1, 7) g
        where extract(dow from v_today + g)::int = 6 limit 1) s;

  -- --------------------------------------------------------------------------
  -- Mensagens simuladas (últimos 30 dias e futuras) e histórico de mudanças (14 dias)
  -- --------------------------------------------------------------------------
  insert into public.message_log (reservation_id, customer_id, channel, kind, body, simulated, created_at)
  select res.id, res.customer_id, 'whatsapp', k.kind,
         replace(replace(replace(replace(replace(replace(replace(replace(t.body,
           '{nome}', split_part(c.full_name, ' ', 1)),
           '{data}', to_char(res.date, 'DD/MM')),
           '{hora}', to_char(res.start_time, 'HH24:MI')),
           '{pessoas}', res.party_size || case when res.party_size = 1 then ' pessoa' else ' pessoas' end),
           '{codigo}', res.code),
           '{link}', coalesce(nullif(rtrim(st.public_url, '/'), ''), '') || '/r/' || res.code),
           '{restaurante}', st.name),
           '{endereco}', coalesce(st.address, '')),
         true, k.sent_at
  from public.reservations res
  join public.customers c on c.id = res.customer_id
  cross join public.restaurant_settings st
  cross join lateral (values
    ('confirmacao', res.created_at, res.source <> 'walk_in' and res.deposit_status <> 'pending'),
    ('lembrete_24h', ((res.starts_at - interval '24 hours') + interval '3 hours') at time zone 'utc',
       res.source <> 'walk_in' and res.status <> 'cancelled'
       and res.created_at < ((res.starts_at - interval '24 hours') + interval '3 hours') at time zone 'utc'),
    ('lembrete_2h', ((res.starts_at - interval '2 hours') + interval '3 hours') at time zone 'utc',
       res.source <> 'walk_in' and res.status <> 'cancelled'
       and res.created_at < ((res.starts_at - interval '2 hours') + interval '3 hours') at time zone 'utc'),
    ('cancelamento', res.cancelled_at, res.status = 'cancelled')
  ) as k(kind, sent_at, ok)
  join public.message_templates t on t.kind = k.kind
  where st.id = 1 and k.ok and k.sent_at is not null and k.sent_at <= now()
    and res.date >= v_today - 30 and c.phone is not null;

  insert into public.audit_log (actor, action, entity, entity_id, details, created_at)
  select null::uuid, 'created', 'reservation', res.id,
         jsonb_build_object('status', case when res.status in ('pending') then 'pending' else 'confirmed' end,
           'source', res.source, 'date', res.date, 'start_time', to_char(res.start_time, 'HH24:MI'),
           'party_size', res.party_size),
         res.created_at
  from public.reservations res where res.date >= v_today - 14
  union all
  select null, 'updated', 'reservation', res.id,
         jsonb_build_object('status_from', 'confirmed', 'status_to', 'seated'), res.seated_at
  from public.reservations res where res.date >= v_today - 14 and res.seated_at is not null
  union all
  select null, 'updated', 'reservation', res.id,
         jsonb_build_object('status_from', 'seated', 'status_to', 'completed'), res.completed_at
  from public.reservations res where res.date >= v_today - 14 and res.completed_at is not null
  union all
  select null, 'updated', 'reservation', res.id,
         jsonb_build_object('status_from', 'confirmed', 'status_to', 'cancelled', 'reason', res.cancel_reason), res.cancelled_at
  from public.reservations res where res.date >= v_today - 14 and res.cancelled_at is not null
  union all
  select null, 'updated', 'reservation', res.id,
         jsonb_build_object('status_from', 'confirmed', 'status_to', 'no_show'),
         ((res.starts_at + interval '25 minutes') + interval '3 hours') at time zone 'utc'
  from public.reservations res where res.date >= v_today - 14 and res.status = 'no_show';

  -- --------------------------------------------------------------------------
  -- Conta de cliente da demonstração ligada à Mariana Costa
  -- --------------------------------------------------------------------------
  if v_client_email is not null then
    select u.id into v_uid from auth.users u where lower(u.email) = lower(v_client_email);
    if v_uid is not null then
      update public.customers set user_id = v_uid where id = c_mariana;
      update public.reservations set account_id = v_uid where customer_id = c_mariana and source = 'site';
      update public.profiles set full_name = 'Mariana Costa', phone = '5511987650101',
             preferences = 'Prefere a varanda. Sem restrições alimentares.'
       where id = v_uid;
    end if;
  end if;

  perform set_config('app.seeding', 'off', true);
end;
$$;

-- Liga as contas de demonstração (criadas antes em Authentication > Users).
-- Rode no SQL Editor, trocando os e-mails:
--   select public.demo_setup_accounts('gerente@seudominio.com', 'anfitriao@seudominio.com', 'cliente@seudominio.com');
create or replace function public.demo_setup_accounts(
  p_manager_email text,
  p_host_email text,
  p_client_email text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_missing text[] := '{}';
begin
  if auth.uid() is not null then
    raise exception 'not_allowed';   -- só pelo SQL Editor
  end if;

  update public.profiles p set role = 'manager', active = true, full_name = 'Helena Prado'
    from auth.users u where u.id = p.id and lower(u.email) = lower(p_manager_email);
  if not found then v_missing := v_missing || p_manager_email; end if;

  update public.profiles p set role = 'host', active = true, full_name = 'Caio Ribeiro'
    from auth.users u where u.id = p.id and lower(u.email) = lower(p_host_email);
  if not found then v_missing := v_missing || p_host_email; end if;

  update public.profiles p set role = 'client', active = true
    from auth.users u where u.id = p.id and lower(u.email) = lower(p_client_email);
  if not found then v_missing := v_missing || p_client_email; end if;

  update public.restaurant_settings set demo_mode = true, demo_client_email = lower(p_client_email) where id = 1;
  perform public.demo_reset();

  if array_length(v_missing, 1) > 0 then
    return 'Contas não encontradas (crie em Authentication > Users): ' || array_to_string(v_missing, ', ');
  end if;
  return 'Contas de demonstração configuradas.';
end;
$$;

revoke execute on function public.demo_reset(text) from public, anon, authenticated;
revoke execute on function public.demo_setup_accounts(text, text, text) from public, anon, authenticated;
-- O botão "Resetar demonstração" chama demo_reset() logado como gerente (a função confere).
grant execute on function public.demo_reset(text) to authenticated;

-- Roda o seed agora.
select public.demo_reset();
