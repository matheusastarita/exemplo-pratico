-- ============================================================================
-- Reserva de mesas — schema completo do Supabase (Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase (Database > SQL Editor).
-- Pode ser executado mais de uma vez (idempotente onde possível).
--
-- Princípios:
--   * RLS ligado em TODAS as tabelas. O público (anon) nunca lê tabela: só RPC.
--   * Toda escrita de reserva passa por função security definer com search_path fixo.
--   * Sobreposição de mesa é barrada por constraint de exclusão (corrida entre dois
--     clientes reservando a mesma mesa ao mesmo tempo falha no banco, não na tela).
--   * Datas/horas são "wall clock" de São Paulo (UTC-3 fixo), sem depender do fuso
--     do servidor: sp_now() = now() em UTC menos 3 horas.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ============================================================================
-- TABELAS
-- ============================================================================

-- Perfis ligados ao Supabase Auth (equipe e clientes com conta)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'client' check (role in ('client', 'host', 'manager')),
  active boolean not null default true,
  birthday date,
  preferences text,                                   -- alergias/preferências do cliente logado
  created_at timestamptz not null default now()
);

-- Configurações e marca (linha única)
create table if not exists public.restaurant_settings (
  id int primary key default 1 check (id = 1),
  name text not null,
  tagline text,
  address text,
  phone text,
  whatsapp text,
  instagram text,
  primary_color text not null default '#1B2A4B' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_url text,
  public_url text,                                    -- endereço do site de reservas (links nas mensagens)
  slot_step_minutes int not null default 15 check (slot_step_minutes in (10, 15, 20, 30, 60)),
  min_notice_minutes int not null default 60 check (min_notice_minutes between 0 and 2880),
  max_advance_days int not null default 60 check (max_advance_days between 1 and 365),
  max_party_online int not null default 10 check (max_party_online between 1 and 50),
  cancel_deadline_hours int not null default 4 check (cancel_deadline_hours between 0 and 168),
  grace_minutes int not null default 15 check (grace_minutes between 0 and 120),
  no_show_block_after int not null default 3 check (no_show_block_after between 1 and 20),
  waitlist_enabled boolean not null default true,
  deposit_enabled boolean not null default false,
  deposit_min_party int check (deposit_min_party is null or deposit_min_party between 1 and 50),
  deposit_per_person numeric(10, 2) check (deposit_per_person is null or deposit_per_person >= 0),
  demo_mode boolean not null default false,           -- libera "Resetar demonstração"
  demo_client_email text,                             -- conta de cliente da demo (ligada ao histórico)
  updated_at timestamptz not null default now()
);

-- Salão
create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  sort_order int not null default 0,
  bookable_online boolean not null default true,
  active boolean not null default true
);

create table if not exists public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas (id),
  label text not null unique check (char_length(label) between 1 and 10),
  min_seats int not null default 1 check (min_seats >= 1),
  max_seats int not null check (max_seats >= 1),
  combinable boolean not null default true,           -- pode juntar com mesa vizinha
  shape text not null default 'square' check (shape in ('round', 'square', 'rect')),
  pos_x numeric not null default 0 check (pos_x between 0 and 100),  -- posição no mapa (0–100 %)
  pos_y numeric not null default 0 check (pos_y between 0 and 100),
  width numeric not null default 8 check (width between 3 and 40),
  height numeric not null default 8 check (height between 3 and 40),
  active boolean not null default true,
  blocked boolean not null default false,             -- fora de uso temporariamente
  blocked_reason text,
  cleaning_since timestamptz,                         -- liberada e aguardando limpeza
  check (min_seats <= max_seats)
);

-- Turnos por dia da semana (almoço/jantar separados)
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6),   -- 0 = domingo
  name text not null check (char_length(name) between 1 and 30),
  open_time time not null,
  last_seating_time time not null,                        -- último horário de entrada
  close_time time not null,
  max_covers int check (max_covers is null or max_covers > 0), -- pessoas simultâneas (ritmo da cozinha)
  is_open boolean not null default true,
  check (last_seating_time <= close_time and open_time < last_seating_time)
);
create index if not exists shifts_weekday_idx on public.shifts (weekday);

-- Tempo de permanência por tamanho do grupo
create table if not exists public.turn_times (
  party_min int not null check (party_min >= 1),
  party_max int not null,
  minutes int not null check (minutes between 15 and 600),
  primary key (party_min, party_max),
  check (party_max >= party_min)
);

-- Dias/turnos fechados (feriado, evento privado)
create table if not exists public.closures (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  shift_id uuid references public.shifts (id) on delete cascade,   -- nulo = dia inteiro
  reason text check (reason is null or char_length(reason) <= 120),
  created_at timestamptz not null default now()
);
create index if not exists closures_date_idx on public.closures (date);

-- Clientes (com ou sem conta de login)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  phone text unique,                                      -- só dígitos, com DDI (55...). Nulo só em walk-in sem telefone.
  email text,
  tags text[] not null default '{}',                      -- VIP, Frequente, Imprensa...
  notes text,                                             -- observações da equipe / preferências
  allergies text,                                         -- alergias e restrições (dado sensível — LGPD)
  birthday date,
  marketing_consent boolean not null default false,       -- LGPD: aceitou receber novidades
  privacy_consent_at timestamptz,                         -- LGPD: aceitou a política ao reservar
  blocked boolean not null default false,
  blocked_reason text,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  check (phone is null or phone ~ '^55[0-9]{10,11}$')
);
create index if not exists customers_name_idx on public.customers (lower(full_name));

-- Reservas
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                              -- 8 caracteres, alfabeto sem ambíguos (sem 0/O/1/I)
  customer_id uuid not null references public.customers (id),
  party_size int not null check (party_size between 1 and 60),
  date date not null,
  start_time time not null,
  duration_minutes int not null check (duration_minutes between 15 and 600),
  -- Fim calculado (pode passar da meia-noite: 22:30 + 2h = 00:30 do dia seguinte)
  end_time time generated always as (start_time + duration_minutes * interval '1 minute') stored,
  starts_at timestamp generated always as (date + start_time) stored,
  ends_at timestamp generated always as (date + start_time + duration_minutes * interval '1 minute') stored,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  source text not null default 'site'
    check (source in ('site', 'telefone', 'whatsapp', 'instagram', 'walk_in', 'manual')),
  occasion text check (occasion is null or occasion in ('aniversario', 'casal', 'negocios', 'familia', 'comemoracao', 'outro')),
  notes text check (notes is null or char_length(notes) <= 500),          -- pedido do cliente (visível ao cliente)
  dietary_notes text check (dietary_notes is null or char_length(dietary_notes) <= 300), -- alergias/restrições
  internal_notes text check (internal_notes is null or char_length(internal_notes) <= 500), -- só equipe
  area_preference uuid references public.areas (id),
  account_id uuid references auth.users (id) on delete set null,          -- conta de cliente que reservou logada
  confirmed_by_customer_at timestamptz,
  seated_at timestamptz,
  check_requested_at timestamptz,                         -- "pediu a conta"
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  deposit_status text not null default 'none'
    check (deposit_status in ('none', 'pending', 'paid', 'refunded', 'forfeited')),
  deposit_amount numeric(10, 2),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reservations_date_idx on public.reservations (date, start_time);
create index if not exists reservations_customer_idx on public.reservations (customer_id);
create index if not exists reservations_account_idx on public.reservations (account_id);
create index if not exists reservations_starts_idx on public.reservations (starts_at);

-- Mesas ocupadas por cada reserva (uma reserva pode juntar várias mesas).
-- A constraint de exclusão impede a MESMA mesa em horários que se sobrepõem
-- enquanto a reserva estiver ativa (pendente/confirmada/sentada).
create table if not exists public.reservation_tables (
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  table_id uuid not null references public.dining_tables (id),
  time_range tsrange not null,
  active boolean not null default true,
  primary key (reservation_id, table_id),
  constraint reservation_tables_no_overlap
    exclude using gist (table_id with =, time_range with &&) where (active)
);
create index if not exists reservation_tables_table_idx on public.reservation_tables (table_id);

-- Fila de espera
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id),
  party_size int not null check (party_size between 1 and 60),
  date date not null,
  preferred_from time,
  preferred_to time,
  source text not null default 'site' check (source in ('site', 'walk_in', 'telefone')),
  quoted_wait_minutes int,                                -- espera informada ao cliente (walk-in)
  notes text check (notes is null or char_length(notes) <= 300),
  status text not null default 'waiting'
    check (status in ('waiting', 'notified', 'converted', 'expired', 'cancelled')),
  notified_at timestamptz,
  seated_reservation_id uuid references public.reservations (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists waitlist_date_idx on public.waitlist (date, status);

-- Modelos de mensagem (editáveis pelo gerente)
create table if not exists public.message_templates (
  kind text primary key
    check (kind in ('confirmacao', 'lembrete_24h', 'lembrete_2h', 'alteracao', 'cancelamento', 'lista_espera')),
  body text not null check (char_length(body) between 10 and 1000),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Registro de mensagens (confirmação, lembrete etc.) — na demo, é simulado
create table if not exists public.message_log (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations (id) on delete cascade,
  waitlist_id uuid references public.waitlist (id) on delete cascade,
  customer_id uuid references public.customers (id),
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'email', 'sms')),
  kind text not null check (kind in ('confirmacao', 'lembrete_24h', 'lembrete_2h', 'alteracao', 'cancelamento', 'lista_espera', 'manual')),
  body text not null,
  simulated boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists message_log_reservation_idx on public.message_log (reservation_id);
create index if not exists message_log_customer_idx on public.message_log (customer_id, created_at desc);
-- Um lembrete de cada tipo por reserva (deixa o envio de lembretes idempotente)
create unique index if not exists message_log_one_reminder
  on public.message_log (reservation_id, kind) where kind in ('lembrete_24h', 'lembrete_2h');

-- Auditoria (quem mudou o quê)
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id, created_at desc);

-- Convites da equipe: quando a pessoa cria a conta com esse e-mail (confirmado),
-- recebe o papel definido pelo gerente. O papel NUNCA vem dos metadados do cadastro.
create table if not exists public.staff_invites (
  email text primary key check (email = lower(email)),
  role text not null check (role in ('host', 'manager')),
  full_name text,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- ============================================================================
-- FUNÇÕES AUXILIARES (internas — sem grant para o público)
-- ============================================================================

-- "Agora" em São Paulo (UTC-3 fixo, sem horário de verão desde 2019)
create or replace function public.sp_now()
returns timestamp
language sql
stable
set search_path = public
as $$
  select (now() at time zone 'utc') - interval '3 hours';
$$;

create or replace function public.sp_today()
returns date
language sql
stable
set search_path = public
as $$
  select public.sp_now()::date;
$$;

-- is_staff()/is_manager(): security definer pra não cair em recursão de RLS no profiles.
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('host', 'manager') and active
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'manager' and active
  );
$$;

-- Papel atual (usado no with check do profiles, pra impedir auto-promoção)
create or replace function public.my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Telefone BR normalizado (só dígitos, DDI 55). Devolve null se inválido.
create or replace function public.norm_phone(p_phone text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if length(v) in (10, 11) then
    v := '55' || v;
  end if;
  if v !~ '^55[1-9][0-9][0-9]{8,9}$' then
    return null;
  end if;
  return v;
end;
$$;

-- Código de reserva: 8 caracteres de um alfabeto de 32 símbolos sem ambíguos
-- (sem 0/O/1/I). Usa os bytes aleatórios de gen_random_uuid() (fonte forte, nativa).
create or replace function public.gen_reservation_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea;
  v_code text;
  idx int[] := array[0, 1, 2, 3, 4, 5, 10, 11];  -- bytes sem os bits de versão/variante do uuid
  i int;
begin
  loop
    b := uuid_send(gen_random_uuid());
    v_code := '';
    foreach i in array idx loop
      v_code := v_code || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.reservations r where r.code = v_code);
  end loop;
  return v_code;
end;
$$;

-- Tempo de permanência para um grupo (cai para uma regra padrão se não houver faixa)
create or replace function public.turn_minutes(p_party int)
returns int
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select t.minutes from public.turn_times t
      where p_party between t.party_min and t.party_max
      order by t.party_min desc limit 1),
    case when p_party <= 2 then 90 when p_party <= 4 then 105 when p_party <= 6 then 120 else 150 end
  );
$$;

-- Mesas livres num intervalo. p_online = só áreas reserváveis pela internet.
-- Mesa com grupo sentado também conta como ocupada se o intervalo começa logo
-- (o grupo pode ter passado do tempo previsto e ainda estar à mesa).
create or replace function public.free_tables(
  p_range tsrange,
  p_area uuid default null,
  p_online boolean default false,
  p_exclude uuid default null
)
returns setof public.dining_tables
language sql
stable
set search_path = public
as $$
  select t.*
  from public.dining_tables t
  join public.areas a on a.id = t.area_id
  where t.active and not t.blocked and a.active
    and (not p_online or a.bookable_online)
    and (p_area is null or t.area_id = p_area)
    and not exists (
      select 1 from public.reservation_tables rt
      where rt.table_id = t.id and rt.active and rt.time_range && p_range
        and (p_exclude is null or rt.reservation_id <> p_exclude)
    )
    and not exists (
      select 1 from public.reservation_tables rt
      join public.reservations r on r.id = rt.reservation_id
      where rt.table_id = t.id and rt.active and r.status = 'seated'
        and (p_exclude is null or r.id <> p_exclude)
        and lower(p_range) <= public.sp_now() + interval '30 minutes'
    );
$$;

-- Opções de mesa para um grupo, da melhor para a pior:
--   1) uma mesa só (a menor que comporta; online respeita o mínimo de lugares)
--   2) duas mesas combináveis vizinhas na mesma área
--   3) três mesas combináveis próximas na mesma área
-- p_area_pref só ordena (prefere a área pedida); p_area_only filtra.
create or replace function public.find_table_options(
  p_range tsrange,
  p_party int,
  p_online boolean default false,
  p_area_pref uuid default null,
  p_area_only uuid default null,
  p_exclude uuid default null
)
returns table (table_ids uuid[], seats int, area_id uuid, n_tables int)
language sql
stable
set search_path = public
as $$
  with free as materialized (
    select f.id, f.area_id, f.label, f.min_seats, f.max_seats, f.combinable,
           f.pos_x + f.width / 2 as cx, f.pos_y + f.height / 2 as cy
    from public.free_tables(p_range, p_area_only, p_online, p_exclude) f
  ),
  singles as (
    select array[f.id] as ids, f.max_seats as seats, f.area_id, 1 as n,
           (f.min_seats > p_party) as oversized, f.label as sort_label
    from free f
    where f.max_seats >= p_party and (not p_online or f.min_seats <= p_party)
  ),
  pairs as (
    select array[a.id, b.id], a.max_seats + b.max_seats, a.area_id, 2, false, a.label
    from free a
    join free b on b.area_id = a.area_id and a.id < b.id
    where a.combinable and b.combinable
      and a.max_seats + b.max_seats >= p_party
      and sqrt(power(a.cx - b.cx, 2) + power(a.cy - b.cy, 2)) <= 26
      and not exists (select 1 from singles)
  ),
  triples as (
    select array[a.id, b.id, c.id], a.max_seats + b.max_seats + c.max_seats, a.area_id, 3, false, a.label
    from free a
    join free b on b.area_id = a.area_id and a.id < b.id
    join free c on c.area_id = a.area_id and b.id < c.id
    where a.combinable and b.combinable and c.combinable
      and a.max_seats + b.max_seats + c.max_seats >= p_party
      and sqrt(power(a.cx - b.cx, 2) + power(a.cy - b.cy, 2)) <= 30
      and sqrt(power(a.cx - c.cx, 2) + power(a.cy - c.cy, 2)) <= 30
      and sqrt(power(b.cx - c.cx, 2) + power(b.cy - c.cy, 2)) <= 30
      and not exists (select 1 from singles)
      and not exists (select 1 from pairs)
  ),
  options as (
    select * from singles
    union all select * from pairs
    union all select * from triples
  )
  select o.ids, o.seats, o.area_id, o.n
  from options o
  order by
    (p_area_pref is not null and o.area_id = p_area_pref) desc,
    o.n, o.oversized, o.seats, o.sort_label;
$$;

-- Pico de pessoas simultâneas num intervalo (para respeitar o limite do turno)
create or replace function public.peak_covers(p_range tsrange, p_exclude uuid default null)
returns int
language sql
stable
set search_path = public
as $$
  with active as (
    select r.starts_at, r.ends_at, r.party_size
    from public.reservations r
    where r.status in ('pending', 'confirmed', 'seated')
      and tsrange(r.starts_at, r.ends_at) && p_range
      and (p_exclude is null or r.id <> p_exclude)
  ),
  points as (
    select lower(p_range) as t
    union
    select a.starts_at from active a where a.starts_at > lower(p_range) and a.starts_at < upper(p_range)
  )
  select coalesce(max(s.total), 0)::int
  from points p
  cross join lateral (
    select sum(a.party_size) as total from active a where a.starts_at <= p.t and a.ends_at > p.t
  ) s;
$$;

-- Turno em que um horário de entrada se encaixa (aberto, sem fechamento, alinhado ao passo)
create or replace function public.shift_for_slot(p_date date, p_time time)
returns public.shifts
language sql
stable
set search_path = public
as $$
  select s.*
  from public.shifts s
  where s.weekday = extract(dow from p_date)::int
    and s.is_open
    and p_time >= s.open_time and p_time <= s.last_seating_time
    and (extract(epoch from (p_time - s.open_time)) / 60)::int
        % (select rs.slot_step_minutes from public.restaurant_settings rs where rs.id = 1) = 0
    and not exists (
      select 1 from public.closures c
      where c.date = p_date and (c.shift_id is null or c.shift_id = s.id)
    )
  order by s.open_time
  limit 1;
$$;

-- Texto de uma mensagem a partir do modelo, com as variáveis preenchidas
create or replace function public.render_message(p_kind text, p_reservation_id uuid)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_body text;
  r record;
  s public.restaurant_settings;
begin
  select * into s from public.restaurant_settings where id = 1;
  select t.body into v_body from public.message_templates t where t.kind = p_kind and t.active;
  if v_body is null then
    return null;
  end if;

  select res.code, res.date, res.start_time, res.party_size, c.full_name
    into r
  from public.reservations res
  join public.customers c on c.id = res.customer_id
  where res.id = p_reservation_id;

  if not found then
    return null;
  end if;

  return replace(replace(replace(replace(replace(replace(replace(replace(v_body,
    '{nome}', split_part(r.full_name, ' ', 1)),
    '{data}', to_char(r.date, 'DD/MM')),
    '{hora}', to_char(r.start_time, 'HH24:MI')),
    '{pessoas}', r.party_size || case when r.party_size = 1 then ' pessoa' else ' pessoas' end),
    '{codigo}', r.code),
    '{link}', coalesce(nullif(rtrim(s.public_url, '/'), ''), '') || '/r/' || r.code),
    '{restaurante}', coalesce(s.name, '')),
    '{endereco}', coalesce(s.address, ''));
end;
$$;

-- Registra uma mensagem simulada (a demo não envia WhatsApp/e-mail de verdade)
create or replace function public.log_message(p_kind text, p_reservation_id uuid)
returns void
language plpgsql
volatile
set search_path = public
as $$
declare
  v_body text := public.render_message(p_kind, p_reservation_id);
begin
  if v_body is null then
    return;
  end if;
  insert into public.message_log (reservation_id, customer_id, channel, kind, body, simulated)
  select r.id, r.customer_id, 'whatsapp', p_kind, v_body, true
  from public.reservations r where r.id = p_reservation_id
  on conflict do nothing;
end;
$$;

-- Avisa (simulado) o primeiro da fila de espera do dia quando uma mesa é liberada
create or replace function public.notify_waitlist_for(p_date date, p_free_seats int)
returns void
language plpgsql
volatile
set search_path = public
as $$
declare
  w record;
  s public.restaurant_settings;
  v_body text;
begin
  select * into s from public.restaurant_settings where id = 1;
  if not coalesce(s.waitlist_enabled, false) then
    return;
  end if;

  select wl.id, wl.customer_id, wl.party_size, c.full_name
    into w
  from public.waitlist wl
  join public.customers c on c.id = wl.customer_id
  where wl.date = p_date and wl.status = 'waiting' and wl.party_size <= p_free_seats
  order by wl.created_at
  limit 1;

  if not found then
    return;
  end if;

  select replace(replace(replace(replace(t.body,
           '{nome}', split_part(w.full_name, ' ', 1)),
           '{pessoas}', w.party_size || case when w.party_size = 1 then ' pessoa' else ' pessoas' end),
           '{data}', to_char(p_date, 'DD/MM')),
           '{restaurante}', coalesce(s.name, ''))
    into v_body
  from public.message_templates t where t.kind = 'lista_espera' and t.active;

  update public.waitlist set status = 'notified', notified_at = now() where id = w.id;

  if v_body is not null then
    insert into public.message_log (waitlist_id, customer_id, channel, kind, body, simulated)
    values (w.id, w.customer_id, 'whatsapp', 'lista_espera', v_body, true);
  end if;
end;
$$;

-- Libera as mesas de uma reserva e devolve quantos lugares ficaram livres
create or replace function public.release_tables(p_reservation_id uuid)
returns int
language plpgsql
volatile
set search_path = public
as $$
declare
  v_seats int;
begin
  select coalesce(sum(t.max_seats), 0) into v_seats
  from public.reservation_tables rt
  join public.dining_tables t on t.id = rt.table_id
  where rt.reservation_id = p_reservation_id and rt.active;

  update public.reservation_tables set active = false
  where reservation_id = p_reservation_id and active;

  return v_seats;
end;
$$;

-- Grava as mesas de uma reserva (substitui as atuais). A constraint de exclusão
-- barra a corrida; o erro vira 'slot_taken' para a tela mostrar uma mensagem clara.
create or replace function public.put_reservation_tables(
  p_reservation_id uuid,
  p_table_ids uuid[],
  p_range tsrange
)
returns void
language plpgsql
volatile
set search_path = public
as $$
begin
  delete from public.reservation_tables where reservation_id = p_reservation_id;
  begin
    insert into public.reservation_tables (reservation_id, table_id, time_range, active)
    select p_reservation_id, t, p_range, true from unnest(p_table_ids) as t;
  exception
    when exclusion_violation then
      raise exception 'slot_taken';
  end;
end;
$$;

-- Cliente pelo telefone: cria se não existir, completa dados se existir.
create or replace function public.upsert_customer(
  p_name text,
  p_phone text,
  p_email text default null,
  p_marketing_consent boolean default false,
  p_privacy_consent boolean default false
)
returns public.customers
language plpgsql
volatile
set search_path = public
as $$
declare
  c public.customers;
  v_phone text := public.norm_phone(p_phone);
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
begin
  if v_phone is not null then
    select * into c from public.customers where phone = v_phone;
  end if;

  if c.id is null then
    insert into public.customers (full_name, phone, email, marketing_consent, privacy_consent_at)
    values (v_name, v_phone, v_email, coalesce(p_marketing_consent, false),
            case when p_privacy_consent then now() end)
    returning * into c;
  else
    update public.customers set
      email = coalesce(email, v_email),
      marketing_consent = marketing_consent or coalesce(p_marketing_consent, false),
      privacy_consent_at = case when p_privacy_consent then now() else privacy_consent_at end
    where id = c.id
    returning * into c;
  end if;

  return c;
end;
$$;

-- Valida os campos de texto que vêm do formulário público
create or replace function public.validate_contact(p_name text, p_phone text, p_email text)
returns void
language plpgsql
immutable
set search_path = public
as $$
begin
  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 80 then
    raise exception 'invalid_name';
  end if;
  if public.norm_phone(p_phone) is null then
    raise exception 'invalid_phone';
  end if;
  if nullif(btrim(coalesce(p_email, '')), '') is not null
     and (char_length(p_email) > 120 or btrim(p_email) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'invalid_email';
  end if;
end;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Cria o perfil ao criar um usuário. Papel sempre 'client' — nunca lido dos metadados.
-- Se houver convite da equipe para o e-mail (já confirmado), aplica o papel do convite.
create or replace function public.apply_staff_invite(p_user_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.staff_invites;
begin
  select * into inv from public.staff_invites
  where email = lower(p_email) and accepted_at is null;
  if not found then
    return;
  end if;
  update public.profiles
     set role = inv.role, active = true, full_name = coalesce(nullif(full_name, ''), inv.full_name)
   where id = p_user_id;
  update public.staff_invites set accepted_at = now() where email = inv.email;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80),
    left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 20),
    'client'
  )
  on conflict (id) do nothing;

  if new.email_confirmed_at is not null then
    perform public.apply_staff_invite(new.id, new.email);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform public.apply_staff_invite(new.id, new.email);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();

-- Auditoria de reservas: registra criação e cada mudança relevante.
-- Durante o seed da demo (app.seeding = on) não registra, pra não poluir.
create or replace function public.audit_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_details jsonb := '{}'::jsonb;
begin
  if coalesce(current_setting('app.seeding', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, details)
    values (auth.uid(), 'created', 'reservation', new.id, jsonb_build_object(
      'status', new.status, 'source', new.source, 'date', new.date,
      'start_time', to_char(new.start_time, 'HH24:MI'), 'party_size', new.party_size));
    return new;
  end if;

  if new.status is distinct from old.status then
    v_details := v_details || jsonb_build_object('status_from', old.status, 'status_to', new.status);
    if new.cancel_reason is not null and new.status = 'cancelled' then
      v_details := v_details || jsonb_build_object('reason', new.cancel_reason);
    end if;
  end if;
  if new.date is distinct from old.date or new.start_time is distinct from old.start_time then
    v_details := v_details || jsonb_build_object(
      'from', to_char(old.date, 'DD/MM') || ' ' || to_char(old.start_time, 'HH24:MI'),
      'to', to_char(new.date, 'DD/MM') || ' ' || to_char(new.start_time, 'HH24:MI'));
  end if;
  if new.party_size is distinct from old.party_size then
    v_details := v_details || jsonb_build_object('party_from', old.party_size, 'party_to', new.party_size);
  end if;
  if new.notes is distinct from old.notes or new.internal_notes is distinct from old.internal_notes
     or new.dietary_notes is distinct from old.dietary_notes or new.occasion is distinct from old.occasion then
    v_details := v_details || jsonb_build_object('notes_changed', true);
  end if;
  if new.confirmed_by_customer_at is distinct from old.confirmed_by_customer_at and new.confirmed_by_customer_at is not null then
    v_details := v_details || jsonb_build_object('customer_confirmed', true);
  end if;
  if new.deposit_status is distinct from old.deposit_status then
    v_details := v_details || jsonb_build_object('deposit_from', old.deposit_status, 'deposit_to', new.deposit_status);
  end if;
  if new.check_requested_at is distinct from old.check_requested_at and new.check_requested_at is not null then
    v_details := v_details || jsonb_build_object('check_requested', true);
  end if;

  if v_details <> '{}'::jsonb then
    insert into public.audit_log (actor, action, entity, entity_id, details)
    values (auth.uid(), 'updated', 'reservation', new.id, v_details);
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_audit on public.reservations;
create trigger reservations_audit
  after insert or update on public.reservations
  for each row execute function public.audit_reservation();

-- Troca de mesa também entra no histórico da reserva
create or replace function public.audit_reservation_tables()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('app.seeding', true), '') = 'on' then
    return null;
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, details)
  select auth.uid(), 'tables', 'reservation', x.reservation_id,
         jsonb_build_object('tables', (
           select string_agg(t.label, ' + ' order by t.label)
           from public.reservation_tables rt join public.dining_tables t on t.id = rt.table_id
           where rt.reservation_id = x.reservation_id and rt.active))
  from (select distinct reservation_id from new_rows) x;
  return null;
end;
$$;

drop trigger if exists reservation_tables_audit on public.reservation_tables;
create trigger reservation_tables_audit
  after insert on public.reservation_tables
  referencing new table as new_rows
  for each statement execute function public.audit_reservation_tables();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reservations_touch on public.reservations;
create trigger reservations_touch
  before update on public.reservations
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.restaurant_settings;
create trigger settings_touch
  before update on public.restaurant_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists templates_touch on public.message_templates;
create trigger templates_touch
  before update on public.message_templates
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- RPC PÚBLICAS (anon + authenticated)
-- ============================================================================

-- Dados públicos do restaurante para a página de reserva: marca, contatos,
-- regras que o cliente precisa saber, áreas reserváveis, turnos e dias fechados.
create or replace function public.get_public_info()
returns json
language sql
security definer
stable
set search_path = public
as $$
  select json_build_object(
    'name', s.name,
    'tagline', s.tagline,
    'address', s.address,
    'phone', s.phone,
    'whatsapp', s.whatsapp,
    'instagram', s.instagram,
    'primary_color', s.primary_color,
    'logo_url', s.logo_url,
    'slot_step_minutes', s.slot_step_minutes,
    'min_notice_minutes', s.min_notice_minutes,
    'max_advance_days', s.max_advance_days,
    'max_party_online', s.max_party_online,
    'cancel_deadline_hours', s.cancel_deadline_hours,
    'grace_minutes', s.grace_minutes,
    'waitlist_enabled', s.waitlist_enabled,
    'deposit_enabled', s.deposit_enabled,
    'deposit_min_party', s.deposit_min_party,
    'deposit_per_person', s.deposit_per_person,
    'demo_mode', s.demo_mode,
    'today', public.sp_today(),
    'areas', coalesce((
      select json_agg(json_build_object('id', a.id, 'name', a.name) order by a.sort_order, a.name)
      from public.areas a where a.active and a.bookable_online
        and exists (select 1 from public.dining_tables t where t.area_id = a.id and t.active)
    ), '[]'::json),
    'shifts', coalesce((
      select json_agg(json_build_object(
        'weekday', sh.weekday, 'name', sh.name,
        'open_time', to_char(sh.open_time, 'HH24:MI'),
        'last_seating_time', to_char(sh.last_seating_time, 'HH24:MI'),
        'close_time', to_char(sh.close_time, 'HH24:MI')) order by sh.weekday, sh.open_time)
      from public.shifts sh where sh.is_open
    ), '[]'::json),
    'closures', coalesce((
      select json_agg(json_build_object(
        'date', c.date, 'full_day', c.shift_id is null,
        'shift_name', (select sh.name from public.shifts sh where sh.id = c.shift_id)) order by c.date)
      from public.closures c
      where c.date between public.sp_today() and public.sp_today() + s.max_advance_days
    ), '[]'::json)
  )
  from public.restaurant_settings s
  where s.id = 1;
$$;

-- Núcleo do cálculo de horários livres (público e equipe usam a mesma regra).
create or replace function public.compute_slots(
  p_date date,
  p_party_size int,
  p_area uuid,
  p_online boolean,
  p_exclude uuid default null
)
returns table (slot_time time, shift_name text, tables_left int)
language plpgsql
stable
set search_path = public
as $$
declare
  s public.restaurant_settings;
  sh record;
  v_dur int;
  v_min int;
  v_start_min int;
  v_end_min int;
  v_starts timestamp;
  v_range tsrange;
  v_earliest timestamp;
  v_singles int;
  v_any boolean;
begin
  select * into s from public.restaurant_settings where id = 1;
  if s.id is null or p_party_size is null or p_party_size < 1 or p_date is null then
    return;
  end if;

  if p_online then
    if p_party_size > s.max_party_online then return; end if;
    if p_date < public.sp_today() or p_date > public.sp_today() + s.max_advance_days then return; end if;
    v_earliest := public.sp_now() + make_interval(mins => s.min_notice_minutes);
  else
    v_earliest := public.sp_now() - interval '15 minutes';
  end if;

  v_dur := public.turn_minutes(p_party_size);

  for sh in
    select x.* from public.shifts x
    where x.weekday = extract(dow from p_date)::int and x.is_open
      and not exists (
        select 1 from public.closures c
        where c.date = p_date and (c.shift_id is null or c.shift_id = x.id)
      )
    order by x.open_time
  loop
    v_start_min := (extract(epoch from sh.open_time) / 60)::int;
    v_end_min := (extract(epoch from sh.last_seating_time) / 60)::int;
    v_min := v_start_min;

    while v_min <= v_end_min loop
      v_starts := p_date + make_interval(mins => v_min);
      if v_starts >= v_earliest then
        v_range := tsrange(v_starts, v_starts + make_interval(mins => v_dur));

        if sh.max_covers is null
           or public.peak_covers(v_range, p_exclude) + p_party_size <= sh.max_covers then
          select count(*) filter (where o.n_tables = 1), count(*) > 0
            into v_singles, v_any
          from public.find_table_options(v_range, p_party_size, p_online, null, p_area, p_exclude) o;

          if v_any then
            slot_time := (v_starts)::time;
            shift_name := sh.name;
            tables_left := greatest(v_singles, 1);
            return next;
          end if;
        end if;
      end if;
      v_min := v_min + s.slot_step_minutes;
    end loop;
  end loop;
end;
$$;

-- Horários livres para reservar pela internet.
-- tables_left = quantas mesas ainda servem naquele horário (pra mostrar "últimas mesas"
-- sem expor o mapa do salão).
create or replace function public.get_available_slots(
  p_date date,
  p_party_size int,
  p_area uuid default null
)
returns table (slot_time time, shift_name text, tables_left int)
language sql
security definer
stable
set search_path = public
as $$
  select * from public.compute_slots(p_date, p_party_size, p_area, true, null);
$$;

-- Resumo por dia (faixa de datas): quantos horários livres há em cada dia, pra
-- marcar dias fechados/lotados na faixa de datas. Limitado a 31 dias por chamada.
create or replace function public.get_days_availability(
  p_from date,
  p_days int,
  p_party_size int
)
returns table (day date, free_slots int, closed boolean)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  d date;
  v_open boolean;
begin
  if p_days is null or p_days < 1 or p_days > 31 then
    raise exception 'invalid_range';
  end if;
  for i in 0 .. p_days - 1 loop
    d := p_from + i;
    select exists (
      select 1 from public.shifts x
      where x.weekday = extract(dow from d)::int and x.is_open
        and not exists (select 1 from public.closures c where c.date = d and (c.shift_id is null or c.shift_id = x.id))
    ) into v_open;
    day := d;
    closed := not v_open;
    if v_open then
      select count(*)::int into free_slots from public.compute_slots(d, p_party_size, null, true, null);
    else
      free_slots := 0;
    end if;
    return next;
  end loop;
end;
$$;

-- Cria uma reserva pela página pública.
-- Valida tudo de novo, cria/atualiza o cliente pelo telefone, escolhe a(s) mesa(s)
-- automaticamente (menor mesa que comporta, preferindo a área pedida) e registra a
-- confirmação simulada. p_website é um campo-isca (honeypot): gente não preenche.
drop function if exists public.create_reservation_public(date, time, int, text, text, text, text, text, uuid, boolean);
create or replace function public.create_reservation_public(
  p_date date,
  p_start_time time,
  p_party_size int,
  p_name text,
  p_phone text,
  p_email text default null,
  p_occasion text default null,
  p_notes text default null,
  p_area uuid default null,
  p_marketing_consent boolean default false,
  p_privacy_consent boolean default false,
  p_dietary_notes text default null,
  p_website text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.restaurant_settings;
  sh public.shifts;
  c public.customers;
  v_dur int;
  v_starts timestamp;
  v_range tsrange;
  v_option record;
  v_id uuid;
  v_code text;
  v_status text := 'confirmed';
  v_deposit_status text := 'none';
  v_deposit numeric(10, 2);
  v_area_name text;
  v_account uuid;
begin
  if nullif(btrim(coalesce(p_website, '')), '') is not null then
    raise exception 'invalid_request';
  end if;

  perform public.validate_contact(p_name, p_phone, p_email);

  if not coalesce(p_privacy_consent, false) then
    raise exception 'consent_required';
  end if;
  if p_occasion is not null and p_occasion not in ('aniversario', 'casal', 'negocios', 'familia', 'comemoracao', 'outro') then
    raise exception 'invalid_request';
  end if;
  if char_length(coalesce(p_notes, '')) > 500 or char_length(coalesce(p_dietary_notes, '')) > 300 then
    raise exception 'text_too_long';
  end if;

  select * into s from public.restaurant_settings where id = 1;

  if p_party_size is null or p_party_size < 1 then
    raise exception 'invalid_party';
  end if;
  if p_party_size > s.max_party_online then
    raise exception 'party_too_large';
  end if;
  if p_date < public.sp_today() or p_date > public.sp_today() + s.max_advance_days then
    raise exception 'date_out_of_range';
  end if;

  sh := public.shift_for_slot(p_date, p_start_time);
  if sh.id is null then
    raise exception 'outside_hours';
  end if;

  v_starts := p_date + p_start_time;
  if v_starts < public.sp_now() + make_interval(mins => s.min_notice_minutes) then
    raise exception 'too_soon';
  end if;

  c := public.upsert_customer(p_name, p_phone, p_email, p_marketing_consent, p_privacy_consent);

  if c.blocked then
    raise exception 'customer_blocked';
  end if;

  -- Anti-abuso: limite de reservas ativas e de tentativas por telefone
  if (select count(*) from public.reservations r
       where r.customer_id = c.id and r.status in ('pending', 'confirmed')
         and r.starts_at >= public.sp_now()) >= 3 then
    raise exception 'too_many_active';
  end if;
  if (select count(*) from public.reservations r
       where r.customer_id = c.id and r.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited';
  end if;

  v_dur := public.turn_minutes(p_party_size);
  v_range := tsrange(v_starts, v_starts + make_interval(mins => v_dur));

  if exists (select 1 from public.reservations r
             where r.customer_id = c.id and r.status in ('pending', 'confirmed', 'seated')
               and tsrange(r.starts_at, r.ends_at) && v_range) then
    raise exception 'duplicate_reservation';
  end if;

  if sh.max_covers is not null and public.peak_covers(v_range) + p_party_size > sh.max_covers then
    raise exception 'slot_taken';
  end if;

  select * into v_option
  from public.find_table_options(v_range, p_party_size, true, p_area, null, null)
  limit 1;

  if v_option.table_ids is null then
    raise exception 'slot_taken';
  end if;

  if s.deposit_enabled and s.deposit_min_party is not null and coalesce(s.deposit_per_person, 0) > 0
     and p_party_size >= s.deposit_min_party then
    v_status := 'pending';
    v_deposit_status := 'pending';
    v_deposit := p_party_size * s.deposit_per_person;
  end if;

  if public.my_role() = 'client' then
    v_account := auth.uid();
  end if;

  v_code := public.gen_reservation_code();

  insert into public.reservations (
    code, customer_id, party_size, date, start_time, duration_minutes, status, source,
    occasion, notes, dietary_notes, area_preference, account_id,
    deposit_status, deposit_amount, created_by
  ) values (
    v_code, c.id, p_party_size, p_date, p_start_time, v_dur, v_status, 'site',
    p_occasion, nullif(btrim(coalesce(p_notes, '')), ''), nullif(btrim(coalesce(p_dietary_notes, '')), ''),
    p_area, v_account, v_deposit_status, v_deposit, auth.uid()
  )
  returning id into v_id;

  perform public.put_reservation_tables(v_id, v_option.table_ids, v_range);

  if v_status = 'confirmed' then
    perform public.log_message('confirmacao', v_id);
  end if;

  select a.name into v_area_name from public.areas a where a.id = v_option.area_id;

  return json_build_object(
    'code', v_code,
    'status', v_status,
    'date', p_date,
    'start_time', to_char(p_start_time, 'HH24:MI'),
    'end_time', to_char(v_starts + make_interval(mins => v_dur), 'HH24:MI'),
    'party_size', p_party_size,
    'customer_name', c.full_name,
    'area_name', v_area_name,
    'area_matched', p_area is null or p_area = v_option.area_id,
    'deposit_amount', v_deposit,
    -- texto da confirmação (simulada na demo) — só da própria reserva
    'message', (select m.body from public.message_log m
                where m.reservation_id = v_id and m.kind = 'confirmacao'
                order by m.created_at desc limit 1)
  );
end;
$$;

-- Horários livres para ALTERAR uma reserva: confere código + telefone e não conta
-- a mesa da própria reserva como ocupada.
create or replace function public.get_available_slots_for_change(
  p_code text,
  p_phone text,
  p_date date,
  p_party_size int
)
returns table (slot_time time, shift_name text, tables_left int)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  r public.reservations := public.find_reservation_by_code(p_code, p_phone);
begin
  return query select * from public.compute_slots(p_date, p_party_size, null, true, r.id);
end;
$$;

-- Busca a reserva só quando código E telefone batem (nunca confirma um código sozinho)
create or replace function public.find_reservation_by_code(p_code text, p_phone text)
returns public.reservations
language plpgsql
stable
set search_path = public
as $$
declare
  r public.reservations;
  v_phone text := public.norm_phone(p_phone);
begin
  if v_phone is null or char_length(coalesce(p_code, '')) <> 8 then
    raise exception 'not_found';
  end if;
  select res.* into r
  from public.reservations res
  join public.customers c on c.id = res.customer_id
  where res.code = upper(btrim(p_code)) and c.phone = v_phone;
  if r.id is null then
    raise exception 'not_found';
  end if;
  return r;
end;
$$;

create or replace function public.reservation_public_json(p_reservation_id uuid)
returns json
language sql
stable
set search_path = public
as $$
  select json_build_object(
    'code', r.code,
    'status', r.status,
    'date', r.date,
    'start_time', to_char(r.start_time, 'HH24:MI'),
    'end_time', to_char(r.end_time, 'HH24:MI'),
    'party_size', r.party_size,
    'occasion', r.occasion,
    'notes', r.notes,
    'dietary_notes', r.dietary_notes,
    'customer_name', c.full_name,
    'area_name', coalesce(
      (select string_agg(distinct a.name, ', ')
         from public.reservation_tables rt
         join public.dining_tables t on t.id = rt.table_id
         join public.areas a on a.id = t.area_id
        where rt.reservation_id = r.id and rt.active),
      (select a.name from public.areas a where a.id = r.area_preference)),
    'deposit_status', r.deposit_status,
    'deposit_amount', r.deposit_amount,
    'confirmed_by_customer_at', r.confirmed_by_customer_at,
    'cancel_deadline_hours', s.cancel_deadline_hours,
    'minutes_until', floor(extract(epoch from (r.starts_at - public.sp_now())) / 60)::int,
    'can_change', r.status in ('pending', 'confirmed')
                  and r.starts_at - public.sp_now() >= make_interval(hours => s.cancel_deadline_hours)
  )
  from public.reservations r
  join public.customers c on c.id = r.customer_id
  cross join public.restaurant_settings s
  where r.id = p_reservation_id and s.id = 1;
$$;

create or replace function public.get_reservation_public(p_code text, p_phone text)
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  r public.reservations := public.find_reservation_by_code(p_code, p_phone);
begin
  return public.reservation_public_json(r.id);
end;
$$;

create or replace function public.cancel_reservation_public(
  p_code text,
  p_phone text,
  p_reason text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations := public.find_reservation_by_code(p_code, p_phone);
  s public.restaurant_settings;
  v_seats int;
begin
  select * into s from public.restaurant_settings where id = 1;

  if r.status not in ('pending', 'confirmed') then
    raise exception 'not_cancellable';
  end if;
  if r.starts_at - public.sp_now() < make_interval(hours => s.cancel_deadline_hours) then
    raise exception 'past_deadline';
  end if;

  update public.reservations
     set status = 'cancelled', cancelled_at = now(),
         cancel_reason = coalesce(nullif(left(btrim(coalesce(p_reason, '')), 200), ''), 'Cancelada pelo cliente'),
         deposit_status = case when deposit_status = 'paid' then 'refunded' else deposit_status end
   where id = r.id;

  v_seats := public.release_tables(r.id);
  perform public.log_message('cancelamento', r.id);
  perform public.notify_waitlist_for(r.date, v_seats);

  return public.reservation_public_json(r.id);
end;
$$;

create or replace function public.confirm_presence_public(p_code text, p_phone text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations := public.find_reservation_by_code(p_code, p_phone);
begin
  if r.status not in ('pending', 'confirmed') or r.ends_at < public.sp_now() then
    raise exception 'not_confirmable';
  end if;
  update public.reservations set confirmed_by_customer_at = coalesce(confirmed_by_customer_at, now()) where id = r.id;
  return public.reservation_public_json(r.id);
end;
$$;

-- Pagamento do sinal — SIMULADO na demonstração (não existe pagamento real).
create or replace function public.pay_deposit_public(p_code text, p_phone text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations := public.find_reservation_by_code(p_code, p_phone);
begin
  if not (select demo_mode from public.restaurant_settings where id = 1) then
    raise exception 'not_allowed';
  end if;
  if r.deposit_status <> 'pending' or r.status <> 'pending' then
    raise exception 'not_allowed';
  end if;
  update public.reservations set deposit_status = 'paid', status = 'confirmed' where id = r.id;
  perform public.log_message('confirmacao', r.id);
  return public.reservation_public_json(r.id);
end;
$$;

-- Altera data/horário/pessoas. Libera as mesas antigas e reserva novas na mesma
-- transação: se não houver mesa no novo horário, nada muda.
create or replace function public.change_reservation_public(
  p_code text,
  p_phone text,
  p_new_date date,
  p_new_time time,
  p_party_size int
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations := public.find_reservation_by_code(p_code, p_phone);
  s public.restaurant_settings;
  sh public.shifts;
  v_dur int;
  v_starts timestamp;
  v_range tsrange;
  v_option record;
begin
  select * into s from public.restaurant_settings where id = 1;

  if r.status not in ('pending', 'confirmed') then
    raise exception 'not_cancellable';
  end if;
  if r.starts_at - public.sp_now() < make_interval(hours => s.cancel_deadline_hours) then
    raise exception 'past_deadline';
  end if;
  if p_party_size is null or p_party_size < 1 then
    raise exception 'invalid_party';
  end if;
  if p_party_size > s.max_party_online then
    raise exception 'party_too_large';
  end if;
  if p_new_date < public.sp_today() or p_new_date > public.sp_today() + s.max_advance_days then
    raise exception 'date_out_of_range';
  end if;

  sh := public.shift_for_slot(p_new_date, p_new_time);
  if sh.id is null then
    raise exception 'outside_hours';
  end if;

  v_starts := p_new_date + p_new_time;
  if v_starts < public.sp_now() + make_interval(mins => s.min_notice_minutes) then
    raise exception 'too_soon';
  end if;

  v_dur := public.turn_minutes(p_party_size);
  v_range := tsrange(v_starts, v_starts + make_interval(mins => v_dur));

  if sh.max_covers is not null and public.peak_covers(v_range, r.id) + p_party_size > sh.max_covers then
    raise exception 'slot_taken';
  end if;

  select * into v_option
  from public.find_table_options(v_range, p_party_size, true, r.area_preference, null, r.id)
  limit 1;
  if v_option.table_ids is null then
    raise exception 'slot_taken';
  end if;

  update public.reservations
     set date = p_new_date, start_time = p_new_time, party_size = p_party_size,
         duration_minutes = v_dur, confirmed_by_customer_at = null
   where id = r.id;

  perform public.put_reservation_tables(r.id, v_option.table_ids, v_range);
  perform public.log_message('alteracao', r.id);

  return public.reservation_public_json(r.id);
end;
$$;

-- Entrar na lista de espera pela página pública
create or replace function public.join_waitlist_public(
  p_date date,
  p_party_size int,
  p_name text,
  p_phone text,
  p_preferred_from time default null,
  p_preferred_to time default null,
  p_privacy_consent boolean default false,
  p_email text default null,
  p_website text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.restaurant_settings;
  c public.customers;
  v_id uuid;
  v_position int;
begin
  if nullif(btrim(coalesce(p_website, '')), '') is not null then
    raise exception 'invalid_request';
  end if;
  perform public.validate_contact(p_name, p_phone, p_email);
  if not coalesce(p_privacy_consent, false) then
    raise exception 'consent_required';
  end if;

  select * into s from public.restaurant_settings where id = 1;
  if not s.waitlist_enabled then
    raise exception 'waitlist_disabled';
  end if;
  if p_party_size is null or p_party_size < 1 or p_party_size > 30 then
    raise exception 'invalid_party';
  end if;
  if p_date < public.sp_today() or p_date > public.sp_today() + s.max_advance_days then
    raise exception 'date_out_of_range';
  end if;

  c := public.upsert_customer(p_name, p_phone, p_email, false, true);
  if c.blocked then
    raise exception 'customer_blocked';
  end if;

  select w.id into v_id from public.waitlist w
  where w.customer_id = c.id and w.date = p_date and w.status in ('waiting', 'notified');

  if v_id is null then
    if (select count(*) from public.waitlist w
         where w.customer_id = c.id and w.created_at > now() - interval '1 hour') >= 5 then
      raise exception 'rate_limited';
    end if;
    insert into public.waitlist (customer_id, party_size, date, preferred_from, preferred_to, source)
    values (c.id, p_party_size, p_date, p_preferred_from, p_preferred_to, 'site')
    returning id into v_id;
  end if;

  select count(*)::int into v_position from public.waitlist w
  where w.date = p_date and w.status = 'waiting'
    and w.created_at <= (select created_at from public.waitlist where id = v_id);

  return json_build_object('id', v_id, 'position', v_position, 'date', p_date);
end;
$$;

-- "Minhas reservas" do cliente logado
create or replace function public.my_reservations()
returns json
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
    'code', r.code,
    'phone', c.phone,
    'status', r.status,
    'date', r.date,
    'start_time', to_char(r.start_time, 'HH24:MI'),
    'end_time', to_char(r.end_time, 'HH24:MI'),
    'party_size', r.party_size,
    'occasion', r.occasion,
    'notes', r.notes,
    'area_preference', r.area_preference,
    'area_name', (select a.name from public.areas a where a.id = r.area_preference),
    'can_change', r.status in ('pending', 'confirmed')
                  and r.starts_at - public.sp_now() >= make_interval(hours => s.cancel_deadline_hours)
  ) order by r.date desc, r.start_time desc), '[]'::json)
  from public.reservations r
  join public.customers c on c.id = r.customer_id
  cross join public.restaurant_settings s
  where s.id = 1 and auth.uid() is not null
    and (r.account_id = auth.uid() or c.user_id = auth.uid());
$$;

-- ============================================================================
-- RPC DA EQUIPE (anfitrião e gerente)
-- ============================================================================

-- Tudo que o painel do salão precisa para um dia, numa chamada só.
create or replace function public.host_day(p_date date)
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v json;
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;

  select json_build_object(
    'date', p_date,
    'now', to_char(public.sp_now(), 'YYYY-MM-DD"T"HH24:MI:SS'),
    'settings', (select json_build_object(
        'grace_minutes', s.grace_minutes, 'name', s.name, 'slot_step_minutes', s.slot_step_minutes,
        'waitlist_enabled', s.waitlist_enabled, 'demo_mode', s.demo_mode)
      from public.restaurant_settings s where s.id = 1),
    'areas', coalesce((select json_agg(json_build_object('id', a.id, 'name', a.name, 'bookable_online', a.bookable_online)
        order by a.sort_order, a.name) from public.areas a where a.active), '[]'::json),
    'tables', coalesce((select json_agg(json_build_object(
        'id', t.id, 'label', t.label, 'area_id', t.area_id, 'min_seats', t.min_seats, 'max_seats', t.max_seats,
        'shape', t.shape, 'pos_x', t.pos_x, 'pos_y', t.pos_y, 'width', t.width, 'height', t.height,
        'combinable', t.combinable, 'blocked', t.blocked, 'blocked_reason', t.blocked_reason,
        'cleaning_since', t.cleaning_since) order by t.label)
      from public.dining_tables t join public.areas a on a.id = t.area_id
      where t.active and a.active), '[]'::json),
    'shifts', coalesce((select json_agg(json_build_object(
        'id', sh.id, 'name', sh.name, 'open_time', to_char(sh.open_time, 'HH24:MI'),
        'last_seating_time', to_char(sh.last_seating_time, 'HH24:MI'),
        'close_time', to_char(sh.close_time, 'HH24:MI'), 'max_covers', sh.max_covers,
        'closed', exists (select 1 from public.closures c where c.date = p_date and (c.shift_id is null or c.shift_id = sh.id)))
        order by sh.open_time)
      from public.shifts sh where sh.weekday = extract(dow from p_date)::int and sh.is_open), '[]'::json),
    'reservations', coalesce((select json_agg(json_build_object(
        'id', r.id, 'code', r.code, 'status', r.status, 'date', r.date,
        'start_time', to_char(r.start_time, 'HH24:MI'), 'end_time', to_char(r.end_time, 'HH24:MI'),
        'duration_minutes', r.duration_minutes, 'party_size', r.party_size, 'source', r.source,
        'occasion', r.occasion, 'notes', r.notes, 'dietary_notes', r.dietary_notes,
        'internal_notes', r.internal_notes, 'area_preference', r.area_preference,
        'seated_at', r.seated_at, 'completed_at', r.completed_at, 'cancelled_at', r.cancelled_at,
        'cancel_reason', r.cancel_reason, 'check_requested_at', r.check_requested_at,
        'confirmed_by_customer_at', r.confirmed_by_customer_at,
        'deposit_status', r.deposit_status, 'deposit_amount', r.deposit_amount,
        'created_at', r.created_at,
        'table_ids', coalesce((select json_agg(rt.table_id) from public.reservation_tables rt
                               where rt.reservation_id = r.id and (rt.active or r.status = 'completed')), '[]'::json),
        'customer', json_build_object(
          'id', c.id, 'full_name', c.full_name, 'phone', c.phone, 'tags', c.tags, 'notes', c.notes,
          'allergies', c.allergies, 'birthday', c.birthday, 'blocked', c.blocked,
          'visits', (select count(*) from public.reservations x where x.customer_id = c.id and x.status = 'completed'),
          'no_shows', (select count(*) from public.reservations x where x.customer_id = c.id and x.status = 'no_show'))
      ) order by r.start_time, r.created_at)
      from public.reservations r join public.customers c on c.id = r.customer_id
      where r.date = p_date), '[]'::json),
    'waitlist', coalesce((select json_agg(json_build_object(
        'id', w.id, 'status', w.status, 'party_size', w.party_size, 'source', w.source,
        'preferred_from', to_char(w.preferred_from, 'HH24:MI'), 'preferred_to', to_char(w.preferred_to, 'HH24:MI'),
        'quoted_wait_minutes', w.quoted_wait_minutes, 'notes', w.notes,
        'created_at', w.created_at, 'notified_at', w.notified_at,
        'customer', json_build_object('id', c.id, 'full_name', c.full_name, 'phone', c.phone, 'tags', c.tags))
      order by w.created_at)
      from public.waitlist w join public.customers c on c.id = w.customer_id
      where w.date = p_date and w.status in ('waiting', 'notified')), '[]'::json)
  ) into v;

  return v;
end;
$$;

-- Horários livres para a equipe (sem antecedência mínima; todas as áreas)
create or replace function public.get_available_slots_staff(
  p_date date,
  p_party_size int,
  p_exclude uuid default null
)
returns table (slot_time time, shift_name text, tables_left int)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  return query select * from public.compute_slots(p_date, p_party_size, null, false, p_exclude);
end;
$$;

-- Reserva lançada pela equipe (telefone, WhatsApp, Instagram...). Sem limite de
-- antecedência; aceita escolher a mesa (ou atribui automaticamente).
drop function if exists public.create_reservation_staff(date, time, int, text, text, text, text, text, text, text, uuid[]);
create or replace function public.create_reservation_staff(
  p_date date,
  p_start_time time,
  p_party_size int,
  p_name text,
  p_phone text,
  p_source text default 'telefone',
  p_email text default null,
  p_occasion text default null,
  p_notes text default null,
  p_internal_notes text default null,
  p_dietary_notes text default null,
  p_table_ids uuid[] default null,
  p_area uuid default null,
  p_customer_id uuid default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.customers;
  v_dur int;
  v_starts timestamp;
  v_range tsrange;
  v_tables uuid[];
  v_id uuid;
  v_code text;
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  if p_source not in ('telefone', 'whatsapp', 'instagram', 'manual', 'site') then
    raise exception 'invalid_request';
  end if;
  if p_party_size is null or p_party_size < 1 or p_party_size > 60 then
    raise exception 'invalid_party';
  end if;
  if p_date is null or p_start_time is null then
    raise exception 'invalid_request';
  end if;
  if p_occasion is not null and p_occasion not in ('aniversario', 'casal', 'negocios', 'familia', 'comemoracao', 'outro') then
    raise exception 'invalid_request';
  end if;

  if p_customer_id is not null then
    select * into c from public.customers where id = p_customer_id;
    if c.id is null then
      raise exception 'not_found';
    end if;
  else
    perform public.validate_contact(p_name, p_phone, p_email);
    c := public.upsert_customer(p_name, p_phone, p_email, false, false);
  end if;

  v_dur := public.turn_minutes(p_party_size);
  v_starts := p_date + p_start_time;
  v_range := tsrange(v_starts, v_starts + make_interval(mins => v_dur));

  if p_table_ids is not null and array_length(p_table_ids, 1) > 0 then
    v_tables := p_table_ids;
  else
    select o.table_ids into v_tables
    from public.find_table_options(v_range, p_party_size, false, p_area, null, null) o
    limit 1;
    if v_tables is null then
      raise exception 'no_table';
    end if;
  end if;

  v_code := public.gen_reservation_code();
  insert into public.reservations (
    code, customer_id, party_size, date, start_time, duration_minutes, status, source,
    occasion, notes, internal_notes, dietary_notes, area_preference, created_by
  ) values (
    v_code, c.id, p_party_size, p_date, p_start_time, v_dur, 'confirmed', p_source,
    p_occasion, nullif(btrim(coalesce(p_notes, '')), ''), nullif(btrim(coalesce(p_internal_notes, '')), ''),
    nullif(btrim(coalesce(p_dietary_notes, '')), ''), p_area, auth.uid()
  ) returning id into v_id;

  perform public.put_reservation_tables(v_id, v_tables, v_range);
  if c.phone is not null then
    perform public.log_message('confirmacao', v_id);
  end if;

  return json_build_object('id', v_id, 'code', v_code);
end;
$$;

-- Edita uma reserva pela equipe (data/hora/pessoas/observações/mesas).
create or replace function public.update_reservation_staff(
  p_id uuid,
  p_date date,
  p_start_time time,
  p_party_size int,
  p_occasion text default null,
  p_notes text default null,
  p_internal_notes text default null,
  p_dietary_notes text default null,
  p_table_ids uuid[] default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations;
  v_dur int;
  v_starts timestamp;
  v_range tsrange;
  v_tables uuid[];
  v_moved boolean;
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  select * into r from public.reservations where id = p_id for update;
  if r.id is null then
    raise exception 'not_found';
  end if;
  if r.status not in ('pending', 'confirmed', 'seated') then
    raise exception 'not_editable';
  end if;
  if p_party_size is null or p_party_size < 1 or p_party_size > 60 then
    raise exception 'invalid_party';
  end if;
  if p_occasion is not null and p_occasion not in ('aniversario', 'casal', 'negocios', 'familia', 'comemoracao', 'outro') then
    raise exception 'invalid_request';
  end if;

  v_moved := p_date is distinct from r.date or p_start_time is distinct from r.start_time
             or p_party_size is distinct from r.party_size;
  v_dur := case when p_party_size = r.party_size then r.duration_minutes else public.turn_minutes(p_party_size) end;
  v_starts := p_date + p_start_time;
  v_range := tsrange(v_starts, v_starts + make_interval(mins => v_dur));

  if p_table_ids is not null and array_length(p_table_ids, 1) > 0 then
    v_tables := p_table_ids;
  elsif v_moved then
    -- tenta manter as mesas atuais; se não der, escolhe outras
    select array_agg(rt.table_id) into v_tables from public.reservation_tables rt
    where rt.reservation_id = r.id and rt.active;
    if v_tables is null or exists (
      select 1 from unnest(v_tables) t
      where not exists (select 1 from public.free_tables(v_range, null, false, r.id) f where f.id = t)
    ) or (select coalesce(sum(t.max_seats), 0) from public.dining_tables t where t.id = any (v_tables)) < p_party_size then
      select o.table_ids into v_tables
      from public.find_table_options(v_range, p_party_size, false, r.area_preference, null, r.id) o
      limit 1;
    end if;
    if v_tables is null then
      raise exception 'no_table';
    end if;
  end if;

  update public.reservations
     set date = p_date, start_time = p_start_time, party_size = p_party_size, duration_minutes = v_dur,
         occasion = p_occasion,
         notes = nullif(btrim(coalesce(p_notes, '')), ''),
         internal_notes = nullif(btrim(coalesce(p_internal_notes, '')), ''),
         dietary_notes = nullif(btrim(coalesce(p_dietary_notes, '')), '')
   where id = r.id;

  if v_tables is not null then
    perform public.put_reservation_tables(r.id, v_tables, v_range);
  end if;
  if v_moved and r.status in ('pending', 'confirmed') then
    perform public.log_message('alteracao', r.id);
  end if;

  return json_build_object('id', r.id);
end;
$$;

-- Move/combina mesas de uma reserva. Falha com 'slot_taken' se alguma mesa
-- estiver ocupada no horário.
create or replace function public.assign_tables(p_reservation_id uuid, p_table_ids uuid[])
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations;
  v_range tsrange;
  v_seats int;
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  if p_table_ids is null or array_length(p_table_ids, 1) is null then
    raise exception 'invalid_request';
  end if;
  select * into r from public.reservations where id = p_reservation_id for update;
  if r.id is null then
    raise exception 'not_found';
  end if;
  if r.status not in ('pending', 'confirmed', 'seated') then
    raise exception 'not_editable';
  end if;
  if exists (select 1 from unnest(p_table_ids) t
             where not exists (select 1 from public.dining_tables d where d.id = t and d.active and not d.blocked)) then
    raise exception 'table_unavailable';
  end if;

  if r.status = 'seated' then
    v_range := tsrange(least(r.starts_at, public.sp_now()), greatest(r.ends_at, public.sp_now() + interval '15 minutes'));
  else
    v_range := tsrange(r.starts_at, r.ends_at);
  end if;

  perform public.put_reservation_tables(r.id, p_table_ids, v_range);

  select coalesce(sum(t.max_seats), 0) into v_seats from public.dining_tables t where t.id = any (p_table_ids);
  return json_build_object('seats', v_seats, 'party_size', r.party_size);
end;
$$;

-- Muda o status de uma reserva. Transições válidas:
--   pendente/confirmada -> sentada | faltou | cancelada | confirmada
--   sentada -> concluída | confirmada (desfazer)
--   concluída -> sentada (desfazer)
--   cancelada/faltou -> confirmada (desfazer)
-- Concluir/cancelar/faltar libera as mesas. Faltar aplica a política de faltas.
create or replace function public.set_reservation_status(
  p_id uuid,
  p_status text,
  p_reason text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations;
  s public.restaurant_settings;
  v_seats int;
  v_no_shows int;
  v_now timestamp := public.sp_now();
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  select * into s from public.restaurant_settings where id = 1;
  select * into r from public.reservations where id = p_id for update;
  if r.id is null then
    raise exception 'not_found';
  end if;

  if not (
    (r.status in ('pending', 'confirmed') and p_status in ('seated', 'no_show', 'cancelled', 'confirmed'))
    or (r.status = 'seated' and p_status in ('completed', 'confirmed'))
    or (r.status = 'completed' and p_status = 'seated')
    or (r.status in ('cancelled', 'no_show') and p_status = 'confirmed')
  ) or r.status = p_status then
    raise exception 'invalid_transition';
  end if;

  if p_status = 'seated' then
    if r.status <> 'completed'
       and not exists (select 1 from public.reservation_tables rt where rt.reservation_id = r.id and rt.active) then
      raise exception 'no_table';
    end if;
    if r.status = 'completed' then
      -- desfazer "concluir": reativa as mesas (pode ter outra reserva agora)
      begin
        update public.reservation_tables set active = true where reservation_id = r.id;
      exception when exclusion_violation then
        raise exception 'slot_taken';
      end;
      update public.reservations set status = 'seated', completed_at = null where id = r.id;
    else
      -- grupo chegou: a ocupação começa agora (se chegou cedo) e vai até o previsto
      begin
        update public.reservation_tables
           set time_range = tsrange(least(r.starts_at, v_now), greatest(r.ends_at, v_now + interval '15 minutes'))
         where reservation_id = r.id and active;
      exception when exclusion_violation then
        raise exception 'slot_taken';
      end;
      update public.reservations set status = 'seated', seated_at = now() where id = r.id;
    end if;
    update public.dining_tables set cleaning_since = null
     where id in (select rt.table_id from public.reservation_tables rt where rt.reservation_id = r.id and rt.active);

  elsif p_status = 'completed' then
    update public.dining_tables set cleaning_since = now()
     where id in (select rt.table_id from public.reservation_tables rt where rt.reservation_id = r.id and rt.active);
    v_seats := public.release_tables(r.id);
    update public.reservations set status = 'completed', completed_at = now() where id = r.id;
    perform public.notify_waitlist_for(r.date, v_seats);

  elsif p_status = 'cancelled' then
    v_seats := public.release_tables(r.id);
    update public.reservations
       set status = 'cancelled', cancelled_at = now(),
           cancel_reason = coalesce(nullif(left(btrim(coalesce(p_reason, '')), 200), ''), 'Cancelada pelo restaurante'),
           deposit_status = case when deposit_status = 'paid' then 'refunded' else deposit_status end
     where id = r.id;
    if r.source <> 'walk_in' then
      perform public.log_message('cancelamento', r.id);
    end if;
    perform public.notify_waitlist_for(r.date, v_seats);

  elsif p_status = 'no_show' then
    v_seats := public.release_tables(r.id);
    update public.reservations
       set status = 'no_show',
           deposit_status = case when deposit_status = 'paid' then 'forfeited' else deposit_status end
     where id = r.id;
    select count(*) into v_no_shows from public.reservations x
     where x.customer_id = r.customer_id and x.status = 'no_show';
    if v_no_shows >= s.no_show_block_after then
      update public.customers
         set blocked = true, blocked_reason = 'Bloqueio automático: ' || v_no_shows || ' faltas'
       where id = r.customer_id and not blocked;
    end if;
    perform public.notify_waitlist_for(r.date, v_seats);

  elsif p_status = 'confirmed' then
    if r.status = 'seated' then
      update public.reservations set status = 'confirmed', seated_at = null, check_requested_at = null where id = r.id;
    elsif r.status = 'pending' then
      update public.reservations set status = 'confirmed' where id = r.id;
    else
      -- desfazer cancelamento/falta: reativa as mesas se ainda estiverem livres
      begin
        update public.reservation_tables set active = true where reservation_id = r.id;
      exception when exclusion_violation then
        raise exception 'tables_taken';
      end;
      update public.reservations
         set status = 'confirmed', cancelled_at = null, cancel_reason = null,
             deposit_status = case when deposit_status in ('refunded', 'forfeited') then 'paid' else deposit_status end
       where id = r.id;
      if r.status = 'no_show' then
        select count(*) into v_no_shows from public.reservations x
         where x.customer_id = r.customer_id and x.status = 'no_show';
        update public.customers set blocked = false, blocked_reason = null
         where id = r.customer_id and blocked and blocked_reason like 'Bloqueio automático%'
           and v_no_shows < s.no_show_block_after;
      end if;
    end if;
  end if;

  return json_build_object('id', r.id, 'status', p_status);
end;
$$;

-- "Pediu a conta" (liga/desliga)
create or replace function public.set_check_requested(p_id uuid, p_on boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  update public.reservations
     set check_requested_at = case when p_on then now() else null end
   where id = p_id and status = 'seated';
  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

-- Mesa limpa / bloquear mesa temporariamente
create or replace function public.set_table_state(
  p_table_id uuid,
  p_clean boolean default null,
  p_blocked boolean default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  update public.dining_tables
     set cleaning_since = case when p_clean is true then null when p_clean is false then now() else cleaning_since end,
         blocked = coalesce(p_blocked, blocked),
         blocked_reason = case when p_blocked is true then nullif(left(btrim(coalesce(p_reason, '')), 80), '')
                               when p_blocked is false then null else blocked_reason end
   where id = p_table_id;
  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

-- Walk-in: tem mesa agora? Senão, quanto tempo de espera (estimado pelas mesas).
create or replace function public.walkin_options(p_party_size int)
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_now timestamp := date_trunc('minute', public.sp_now());
  v_dur int;
  v_option record;
  v_wait int;
  v_ahead int;
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  if p_party_size is null or p_party_size < 1 or p_party_size > 60 then
    raise exception 'invalid_party';
  end if;
  v_dur := public.turn_minutes(p_party_size);

  select * into v_option
  from public.find_table_options(tsrange(v_now, v_now + make_interval(mins => v_dur)), p_party_size, false, null, null, null)
  limit 1;

  select count(*)::int into v_ahead from public.waitlist w
  where w.date = v_now::date and w.status in ('waiting', 'notified');

  if v_option.table_ids is not null then
    return json_build_object(
      'available', true,
      'table_ids', to_json(v_option.table_ids),
      'labels', (select string_agg(t.label, ' + ' order by t.label) from public.dining_tables t where t.id = any (v_option.table_ids)),
      'seats', v_option.seats,
      'duration_minutes', v_dur,
      'queue_ahead', v_ahead);
  end if;

  -- procura, de 5 em 5 minutos (até 3h), o primeiro horário com mesa
  for i in 1 .. 36 loop
    if exists (
      select 1 from public.find_table_options(
        tsrange(v_now + make_interval(mins => i * 5), v_now + make_interval(mins => i * 5 + v_dur)),
        p_party_size, false, null, null, null)
    ) then
      v_wait := i * 5;
      exit;
    end if;
  end loop;

  return json_build_object(
    'available', false,
    'wait_minutes', v_wait,
    'duration_minutes', v_dur,
    'queue_ahead', v_ahead);
end;
$$;

-- Walk-in sentado na hora (cria a reserva já como "sentada")
create or replace function public.create_walkin(
  p_party_size int,
  p_name text default null,
  p_phone text default null,
  p_table_ids uuid[] default null,
  p_notes text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.customers;
  v_now timestamp := date_trunc('minute', public.sp_now());
  v_dur int;
  v_range tsrange;
  v_tables uuid[];
  v_id uuid;
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  if p_party_size is null or p_party_size < 1 or p_party_size > 60 then
    raise exception 'invalid_party';
  end if;
  if nullif(btrim(coalesce(p_phone, '')), '') is not null and public.norm_phone(p_phone) is null then
    raise exception 'invalid_phone';
  end if;

  v_dur := public.turn_minutes(p_party_size);
  v_range := tsrange(v_now, v_now + make_interval(mins => v_dur));

  if p_table_ids is not null and array_length(p_table_ids, 1) > 0 then
    v_tables := p_table_ids;
  else
    select o.table_ids into v_tables
    from public.find_table_options(v_range, p_party_size, false, null, null, null) o limit 1;
  end if;
  if v_tables is null then
    raise exception 'no_table';
  end if;

  c := public.upsert_customer(coalesce(v_name, 'Cliente sem reserva'), p_phone, null, false, false);

  insert into public.reservations (
    code, customer_id, party_size, date, start_time, duration_minutes, status, source,
    notes, seated_at, created_by
  ) values (
    public.gen_reservation_code(), c.id, p_party_size, v_now::date, v_now::time, v_dur, 'seated', 'walk_in',
    nullif(btrim(coalesce(p_notes, '')), ''), now(), auth.uid()
  ) returning id into v_id;

  perform public.put_reservation_tables(v_id, v_tables, v_range);
  update public.dining_tables set cleaning_since = null where id = any (v_tables);

  return json_build_object('id', v_id,
    'labels', (select string_agg(t.label, ' + ' order by t.label) from public.dining_tables t where t.id = any (v_tables)));
end;
$$;

-- Equipe coloca alguém na fila de espera (walk-in sem mesa, ou pedido por telefone)
create or replace function public.waitlist_add_staff(
  p_party_size int,
  p_name text,
  p_phone text default null,
  p_quoted_wait_minutes int default null,
  p_notes text default null,
  p_date date default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.customers;
  v_id uuid;
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) < 2 then
    raise exception 'invalid_name';
  end if;
  if p_party_size is null or p_party_size < 1 or p_party_size > 60 then
    raise exception 'invalid_party';
  end if;
  if nullif(btrim(coalesce(p_phone, '')), '') is not null and public.norm_phone(p_phone) is null then
    raise exception 'invalid_phone';
  end if;

  c := public.upsert_customer(p_name, p_phone, null, false, false);
  insert into public.waitlist (customer_id, party_size, date, source, quoted_wait_minutes, notes)
  values (c.id, p_party_size, coalesce(p_date, public.sp_today()), 'walk_in', p_quoted_wait_minutes,
          nullif(btrim(coalesce(p_notes, '')), ''))
  returning id into v_id;
  return json_build_object('id', v_id);
end;
$$;

-- Avisar cliente da fila (mensagem simulada)
create or replace function public.waitlist_notify(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w record;
  s public.restaurant_settings;
  v_body text;
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  select * into s from public.restaurant_settings where id = 1;
  select wl.*, c.full_name into w
  from public.waitlist wl join public.customers c on c.id = wl.customer_id
  where wl.id = p_id and wl.status in ('waiting', 'notified');
  if w.id is null then
    raise exception 'not_found';
  end if;

  select replace(replace(replace(replace(t.body,
           '{nome}', split_part(w.full_name, ' ', 1)),
           '{pessoas}', w.party_size || case when w.party_size = 1 then ' pessoa' else ' pessoas' end),
           '{data}', to_char(w.date, 'DD/MM')),
           '{restaurante}', coalesce(s.name, ''))
    into v_body
  from public.message_templates t where t.kind = 'lista_espera';

  update public.waitlist set status = 'notified', notified_at = now() where id = p_id;
  insert into public.message_log (waitlist_id, customer_id, channel, kind, body, simulated)
  values (p_id, w.customer_id, 'whatsapp', 'lista_espera',
          coalesce(v_body, 'Sua mesa está pronta! Pode vir até a recepção.'), true);
end;
$$;

-- Sentar alguém da fila: vira uma reserva "sentada" (walk-in)
create or replace function public.waitlist_seat(p_id uuid, p_table_ids uuid[] default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.waitlist;
  v_now timestamp := date_trunc('minute', public.sp_now());
  v_dur int;
  v_range tsrange;
  v_tables uuid[];
  v_id uuid;
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  select * into w from public.waitlist where id = p_id and status in ('waiting', 'notified') for update;
  if w.id is null then
    raise exception 'not_found';
  end if;

  v_dur := public.turn_minutes(w.party_size);
  v_range := tsrange(v_now, v_now + make_interval(mins => v_dur));
  if p_table_ids is not null and array_length(p_table_ids, 1) > 0 then
    v_tables := p_table_ids;
  else
    select o.table_ids into v_tables
    from public.find_table_options(v_range, w.party_size, false, null, null, null) o limit 1;
  end if;
  if v_tables is null then
    raise exception 'no_table';
  end if;

  insert into public.reservations (
    code, customer_id, party_size, date, start_time, duration_minutes, status, source, notes, seated_at, created_by
  ) values (
    public.gen_reservation_code(), w.customer_id, w.party_size, v_now::date, v_now::time, v_dur, 'seated', 'walk_in',
    w.notes, now(), auth.uid()
  ) returning id into v_id;

  perform public.put_reservation_tables(v_id, v_tables, v_range);
  update public.dining_tables set cleaning_since = null where id = any (v_tables);
  update public.waitlist set status = 'converted', seated_reservation_id = v_id where id = p_id;

  return json_build_object('id', v_id,
    'labels', (select string_agg(t.label, ' + ' order by t.label) from public.dining_tables t where t.id = any (v_tables)));
end;
$$;

create or replace function public.waitlist_set_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  if p_status not in ('waiting', 'cancelled', 'expired') then
    raise exception 'invalid_transition';
  end if;
  update public.waitlist set status = p_status where id = p_id and status in ('waiting', 'notified');
  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

-- Mensagem avulsa para o cliente de uma reserva (simulada)
create or replace function public.send_manual_message(p_reservation_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  if char_length(btrim(coalesce(p_body, ''))) not between 2 and 1000 then
    raise exception 'text_too_long';
  end if;
  insert into public.message_log (reservation_id, customer_id, channel, kind, body, simulated)
  select r.id, r.customer_id, 'whatsapp', 'manual', btrim(p_body), true
  from public.reservations r where r.id = p_reservation_id;
  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

-- Lembretes devidos (24h e 2h antes) — simulados. Idempotente: o índice único
-- garante um lembrete de cada tipo por reserva. O painel chama periodicamente.
create or replace function public.run_due_reminders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_count int := 0;
  v_now timestamp := public.sp_now();
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  for r in
    select res.id, res.starts_at, (res.created_at at time zone 'utc') - interval '3 hours' as created_sp
    from public.reservations res
    join public.customers c on c.id = res.customer_id
    where res.status in ('pending', 'confirmed') and c.phone is not null
      and res.starts_at > v_now and res.starts_at <= v_now + interval '24 hours'
  loop
    if r.starts_at - v_now <= interval '2 hours' then
      if r.created_sp < r.starts_at - interval '2 hours'
         and not exists (select 1 from public.message_log m where m.reservation_id = r.id and m.kind = 'lembrete_2h') then
        perform public.log_message('lembrete_2h', r.id);
        v_count := v_count + 1;
      end if;
    elsif r.created_sp < r.starts_at - interval '24 hours'
          and not exists (select 1 from public.message_log m where m.reservation_id = r.id and m.kind = 'lembrete_24h') then
      perform public.log_message('lembrete_24h', r.id);
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

-- Bloquear/desbloquear cliente (com motivo)
create or replace function public.block_customer(p_id uuid, p_blocked boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  if p_blocked and char_length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'reason_required';
  end if;
  update public.customers
     set blocked = p_blocked,
         blocked_reason = case when p_blocked then left(btrim(p_reason), 200) else null end
   where id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), case when p_blocked then 'blocked' else 'unblocked' end, 'customer', p_id,
          jsonb_build_object('reason', p_reason));
end;
$$;

-- LGPD: anonimiza um cliente (mantém as reservas para os números do restaurante,
-- mas apaga nome, contatos e observações pessoais).
create or replace function public.anonymize_customer(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  update public.customers
     set full_name = 'Cliente anonimizado', phone = null, email = null, tags = '{}', notes = null,
         allergies = null, birthday = null, marketing_consent = false, user_id = null,
         anonymized_at = now()
   where id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
  update public.reservations set notes = null, dietary_notes = null, internal_notes = null
   where customer_id = p_id;
  delete from public.message_log where customer_id = p_id;
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), 'anonymized', 'customer', p_id, null);
end;
$$;

-- Histórico de uma reserva (auditoria + mensagens), para a ficha da reserva
create or replace function public.reservation_history(p_id uuid)
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  return json_build_object(
    'events', coalesce((select json_agg(json_build_object(
        'action', a.action, 'details', a.details, 'created_at', a.created_at,
        'actor_name', (select p.full_name from public.profiles p where p.id = a.actor)) order by a.created_at)
      from public.audit_log a where a.entity = 'reservation' and a.entity_id = p_id), '[]'::json),
    'messages', coalesce((select json_agg(json_build_object(
        'kind', m.kind, 'body', m.body, 'channel', m.channel, 'simulated', m.simulated, 'created_at', m.created_at)
        order by m.created_at)
      from public.message_log m where m.reservation_id = p_id), '[]'::json)
  );
end;
$$;

-- ============================================================================
-- RELATÓRIOS (só gerente). Nada de faturamento: o sistema não tem consumo/pedido.
-- Ocupação = tempo de mesa usado ÷ tempo de mesa disponível nos turnos abertos.
-- ============================================================================

create or replace function public.capacity_minutes(p_from date, p_to date)
returns table (day date, shift_name text, table_minutes numeric)
language sql
stable
set search_path = public
as $$
  select d::date, sh.name,
         (extract(epoch from (sh.close_time - sh.open_time)) / 60)
         * (select count(*) from public.dining_tables t join public.areas a on a.id = t.area_id
            where t.active and a.active)
  from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d
  join public.shifts sh on sh.weekday = extract(dow from d)::int and sh.is_open
  where not exists (select 1 from public.closures c
                    where c.date = d::date and (c.shift_id is null or c.shift_id = sh.id));
$$;

-- Minutos de mesa usados por reserva (mesas × tempo real, ou previsto se não houver)
create or replace function public.used_minutes(p_from date, p_to date)
returns table (day date, shift_name text, table_minutes numeric)
language sql
stable
set search_path = public
as $$
  select r.date,
         coalesce((select sh.name from public.shifts sh
                   where sh.weekday = extract(dow from r.date)::int
                     and r.start_time >= sh.open_time and r.start_time < sh.close_time
                   order by sh.open_time limit 1), 'Fora do turno'),
         greatest(1, (select count(*) from public.reservation_tables rt where rt.reservation_id = r.id))
         * coalesce(
             case when r.completed_at is not null and r.seated_at is not null
                  then extract(epoch from (r.completed_at - r.seated_at)) / 60 end,
             r.duration_minutes)
  from public.reservations r
  where r.date between p_from and p_to and r.status in ('completed', 'seated', 'confirmed', 'pending');
$$;

create or replace function public.report_summary(p_from date, p_to date)
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v json;
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  if p_to < p_from or p_to - p_from > 400 then
    raise exception 'invalid_range';
  end if;

  with base as (
    select r.* from public.reservations r where r.date between p_from and p_to
  ),
  cap as (select * from public.capacity_minutes(p_from, p_to)),
  used as (select * from public.used_minutes(p_from, p_to))
  select json_build_object(
    'reservations', (select count(*) from base where status <> 'cancelled'),
    'total_including_cancelled', (select count(*) from base),
    'people', (select coalesce(sum(party_size), 0) from base where status in ('completed', 'seated', 'confirmed', 'pending')),
    'people_served', (select coalesce(sum(party_size), 0) from base where status in ('completed', 'seated')),
    'completed', (select count(*) from base where status = 'completed'),
    'seated', (select count(*) from base where status = 'seated'),
    'upcoming', (select count(*) from base where status in ('confirmed', 'pending')),
    'no_shows', (select count(*) from base where status = 'no_show'),
    'cancelled', (select count(*) from base where status = 'cancelled'),
    'walk_ins', (select count(*) from base where source = 'walk_in' and status <> 'cancelled'),
    'no_show_rate', (select case when count(*) filter (where status in ('completed', 'no_show')) = 0 then null
                         else round(100.0 * count(*) filter (where status = 'no_show')
                                    / count(*) filter (where status in ('completed', 'no_show')), 1) end from base),
    'cancel_rate', (select case when count(*) = 0 then null
                        else round(100.0 * count(*) filter (where status = 'cancelled') / count(*), 1) end from base),
    'avg_party', (select round(avg(party_size), 1) from base where status <> 'cancelled'),
    'avg_stay_minutes', (select round(avg(extract(epoch from (completed_at - seated_at)) / 60))
                         from base where status = 'completed' and seated_at is not null and completed_at is not null),
    'occupancy', (select case when coalesce((select sum(table_minutes) from cap), 0) = 0 then null
                      else round(100.0 * (select coalesce(sum(table_minutes), 0) from used)
                                 / (select sum(table_minutes) from cap), 1) end),
    'by_source', coalesce((select json_agg(json_build_object('source', x.source, 'count', x.n) order by x.n desc)
                  from (select source, count(*) n from base where status <> 'cancelled' group by source) x), '[]'::json),
    'by_shift', coalesce((select json_agg(json_build_object(
                    'shift', c.shift_name, 'capacity', c.cap,
                    'used', coalesce(u.used, 0),
                    'occupancy', case when c.cap = 0 then null else round(100.0 * coalesce(u.used, 0) / c.cap, 1) end)
                    order by c.shift_name)
                  from (select shift_name, sum(table_minutes) cap from cap group by shift_name) c
                  left join (select shift_name, sum(table_minutes) used from used group by shift_name) u
                    on u.shift_name = c.shift_name), '[]'::json),
    'by_occasion', coalesce((select json_agg(json_build_object('occasion', x.occasion, 'count', x.n) order by x.n desc)
                  from (select occasion, count(*) n from base where status <> 'cancelled' and occasion is not null
                        group by occasion) x), '[]'::json)
  ) into v;
  return v;
end;
$$;

create or replace function public.report_by_hour(p_from date, p_to date)
returns table (hour int, reservations int, people int)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  return query
    select extract(hour from r.start_time)::int, count(*)::int, coalesce(sum(r.party_size), 0)::int
    from public.reservations r
    where r.date between p_from and p_to and r.status <> 'cancelled'
    group by 1 order by 1;
end;
$$;

-- capacity/used_minutes vão junto para somar semanas e meses com exatidão
-- (média de percentuais de dias diferentes daria número errado).
drop function if exists public.report_daily(date, date);
create function public.report_daily(p_from date, p_to date)
returns table (day date, reservations int, people int, cancelled int, no_shows int, walk_ins int, occupancy numeric,
               capacity_minutes numeric, used_minutes numeric)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  if p_to < p_from or p_to - p_from > 400 then
    raise exception 'invalid_range';
  end if;
  return query
    with days as (select d::date as day from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d),
    cap as (select c.day, sum(c.table_minutes) m from public.capacity_minutes(p_from, p_to) c group by c.day),
    used as (select u.day, sum(u.table_minutes) m from public.used_minutes(p_from, p_to) u group by u.day),
    res as (
      select r.date as day,
             count(*) filter (where r.status <> 'cancelled')::int as reservations,
             coalesce(sum(r.party_size) filter (where r.status in ('completed', 'seated', 'confirmed', 'pending')), 0)::int as people,
             count(*) filter (where r.status = 'cancelled')::int as cancelled,
             count(*) filter (where r.status = 'no_show')::int as no_shows,
             count(*) filter (where r.source = 'walk_in' and r.status <> 'cancelled')::int as walk_ins
      from public.reservations r where r.date between p_from and p_to group by r.date
    )
    select d.day, coalesce(x.reservations, 0), coalesce(x.people, 0), coalesce(x.cancelled, 0),
           coalesce(x.no_shows, 0), coalesce(x.walk_ins, 0),
           case when coalesce(c.m, 0) = 0 then null else round(100.0 * coalesce(u.m, 0) / c.m, 1) end,
           coalesce(c.m, 0), coalesce(u.m, 0)
    from days d
    left join res x on x.day = d.day
    left join cap c on c.day = d.day
    left join used u on u.day = d.day
    order by d.day;
end;
$$;

create or replace function public.report_by_weekday(p_from date, p_to date)
returns table (weekday int, open_days int, reservations int, people int, occupancy numeric)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  return query
    with cap as (select extract(dow from c.day)::int wd, count(distinct c.day)::int days, sum(c.table_minutes) m
                 from public.capacity_minutes(p_from, p_to) c group by 1),
    used as (select extract(dow from u.day)::int wd, sum(u.table_minutes) m
             from public.used_minutes(p_from, p_to) u group by 1),
    res as (select extract(dow from r.date)::int wd, count(*)::int n, coalesce(sum(r.party_size), 0)::int p
            from public.reservations r
            where r.date between p_from and p_to and r.status not in ('cancelled')
            group by 1)
    select w, coalesce(c.days, 0), coalesce(x.n, 0), coalesce(x.p, 0),
           case when coalesce(c.m, 0) = 0 then null else round(100.0 * coalesce(u.m, 0) / c.m, 1) end
    from generate_series(0, 6) w
    left join cap c on c.wd = w
    left join used u on u.wd = w
    left join res x on x.wd = w
    order by w;
end;
$$;

-- ============================================================================
-- GERÊNCIA: listas e visão geral (só gerente)
-- ============================================================================

-- Reservas de um período com cliente e mesas (a tela filtra e exporta CSV).
create or replace function public.manager_reservations(p_from date, p_to date)
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  if p_to < p_from or p_to - p_from > 120 then
    raise exception 'invalid_range';
  end if;
  return coalesce((
    select json_agg(json_build_object(
      'id', r.id, 'code', r.code, 'status', r.status, 'source', r.source,
      'date', r.date, 'start_time', to_char(r.start_time, 'HH24:MI'), 'end_time', to_char(r.end_time, 'HH24:MI'),
      'duration_minutes', r.duration_minutes, 'party_size', r.party_size, 'occasion', r.occasion,
      'notes', r.notes, 'dietary_notes', r.dietary_notes, 'internal_notes', r.internal_notes,
      'deposit_status', r.deposit_status, 'deposit_amount', r.deposit_amount,
      'cancel_reason', r.cancel_reason, 'created_at', r.created_at,
      'customer_id', c.id, 'customer_name', c.full_name, 'customer_phone', c.phone, 'customer_tags', c.tags,
      'area_id', (select t.area_id from public.reservation_tables rt join public.dining_tables t on t.id = rt.table_id
                  where rt.reservation_id = r.id order by rt.active desc limit 1),
      'tables', (select string_agg(t.label, ' + ' order by t.label) from public.reservation_tables rt
                 join public.dining_tables t on t.id = rt.table_id
                 where rt.reservation_id = r.id and (rt.active or r.status in ('completed', 'no_show')))
    ) order by r.date, r.start_time)
    from public.reservations r
    join public.customers c on c.id = r.customer_id
    where r.date between p_from and p_to
  ), '[]'::json);
end;
$$;

-- Clientes com totais (visitas, faltas, cancelamentos, última visita, próxima reserva).
create or replace function public.customer_list()
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  return coalesce((
    select json_agg(json_build_object(
      'id', c.id, 'full_name', c.full_name, 'phone', c.phone, 'email', c.email, 'tags', c.tags,
      'birthday', c.birthday, 'blocked', c.blocked, 'allergies', c.allergies,
      'marketing_consent', c.marketing_consent, 'has_account', c.user_id is not null,
      'visits', coalesce(x.visits, 0), 'no_shows', coalesce(x.no_shows, 0),
      'cancellations', coalesce(x.cancellations, 0), 'people', coalesce(x.people, 0),
      'last_visit', x.last_visit, 'next_reservation', x.next_reservation, 'created_at', c.created_at
    ) order by c.full_name)
    from public.customers c
    left join lateral (
      select count(*) filter (where r.status = 'completed') as visits,
             count(*) filter (where r.status = 'no_show') as no_shows,
             count(*) filter (where r.status = 'cancelled') as cancellations,
             coalesce(sum(r.party_size) filter (where r.status = 'completed'), 0) as people,
             max(r.date) filter (where r.status = 'completed') as last_visit,
             min(r.date) filter (where r.status in ('pending', 'confirmed') and r.date >= public.sp_today()) as next_reservation
      from public.reservations r where r.customer_id = c.id
    ) x on true
    where c.anonymized_at is null
  ), '[]'::json);
end;
$$;

-- Ficha do cliente: dados + todas as reservas.
create or replace function public.customer_detail(p_id uuid)
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v json;
begin
  if not public.is_staff() then
    raise exception 'not_allowed';
  end if;
  select json_build_object(
    'customer', to_json(c),
    'reservations', coalesce((select json_agg(json_build_object(
        'id', r.id, 'code', r.code, 'status', r.status, 'source', r.source, 'date', r.date,
        'start_time', to_char(r.start_time, 'HH24:MI'), 'party_size', r.party_size, 'occasion', r.occasion,
        'notes', r.notes, 'dietary_notes', r.dietary_notes, 'cancel_reason', r.cancel_reason,
        'tables', (select string_agg(t.label, ' + ' order by t.label) from public.reservation_tables rt
                   join public.dining_tables t on t.id = rt.table_id where rt.reservation_id = r.id))
        order by r.date desc, r.start_time desc)
      from public.reservations r where r.customer_id = c.id), '[]'::json),
    'messages', coalesce((select json_agg(json_build_object('kind', m.kind, 'body', m.body, 'created_at', m.created_at,
        'simulated', m.simulated) order by m.created_at desc)
      from (select * from public.message_log ml where ml.customer_id = c.id order by ml.created_at desc limit 30) m), '[]'::json)
  ) into v
  from public.customers c where c.id = p_id;
  if v is null then
    raise exception 'not_found';
  end if;
  return v;
end;
$$;

-- Visão geral do gerente: hoje, semana atual x anterior, série diária, pico por
-- horário e próximas datas com alta ocupação.
create or replace function public.manager_overview()
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_today date := public.sp_today();
  v_week_start date := v_today - ((extract(isodow from v_today)::int) - 1);
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  return json_build_object(
    'today', v_today,
    'week_start', v_week_start,
    'day', public.report_summary(v_today, v_today),
    'same_day_last_week', public.report_summary(v_today - 7, v_today - 7),
    -- "semana" = últimos 7 dias x os 7 anteriores (sempre com dados completos)
    'week', public.report_summary(v_today - 6, v_today),
    'prev_week', public.report_summary(v_today - 13, v_today - 7),
    'daily', coalesce((select json_agg(to_json(d) order by d.day) from public.report_daily(v_today - 27, v_today + 14) d), '[]'::json),
    'hours', coalesce((select json_agg(to_json(h) order by h.hour) from public.report_by_hour(v_today - 29, v_today) h), '[]'::json),
    'busy_days', coalesce((select json_agg(to_json(d) order by d.occupancy desc nulls last, d.day)
                           from public.report_daily(v_today + 1, v_today + 21) d
                           where d.reservations > 0), '[]'::json)
  );
end;
$$;

-- ============================================================================
-- EQUIPE (só gerente)
-- ============================================================================

create or replace function public.list_team()
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  return json_build_object(
    'members', coalesce((select json_agg(json_build_object(
        'id', p.id, 'full_name', p.full_name, 'email', u.email, 'role', p.role, 'active', p.active,
        'last_sign_in_at', u.last_sign_in_at, 'is_me', p.id = auth.uid()) order by p.role desc, p.full_name)
      from public.profiles p join auth.users u on u.id = p.id
      where p.role in ('host', 'manager')), '[]'::json),
    'invites', coalesce((select json_agg(json_build_object(
        'email', i.email, 'role', i.role, 'full_name', i.full_name, 'created_at', i.created_at) order by i.created_at desc)
      from public.staff_invites i where i.accepted_at is null), '[]'::json)
  );
end;
$$;

create or replace function public.invite_staff(p_email text, p_role text, p_full_name text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_user uuid;
  v_confirmed boolean;
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  if p_role not in ('host', 'manager') then
    raise exception 'invalid_request';
  end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;

  insert into public.staff_invites (email, role, full_name, invited_by)
  values (v_email, p_role, nullif(btrim(coalesce(p_full_name, '')), ''), auth.uid())
  on conflict (email) do update
    set role = excluded.role, full_name = excluded.full_name, invited_by = excluded.invited_by,
        created_at = now(), accepted_at = null;

  select u.id, u.email_confirmed_at is not null into v_user, v_confirmed
  from auth.users u where lower(u.email) = v_email;

  if v_user is not null and v_confirmed then
    perform public.apply_staff_invite(v_user, v_email);
    return 'promoted';
  end if;
  return 'invited';
end;
$$;

create or replace function public.revoke_invite(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  delete from public.staff_invites where email = lower(btrim(p_email)) and accepted_at is null;
end;
$$;

create or replace function public.set_staff(p_user_id uuid, p_role text, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot_change_self';
  end if;
  if p_role not in ('client', 'host', 'manager') then
    raise exception 'invalid_request';
  end if;
  update public.profiles set role = p_role, active = coalesce(p_active, active) where id = p_user_id;
  if not found then
    raise exception 'not_found';
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), 'staff_changed', 'profile', p_user_id, jsonb_build_object('role', p_role, 'active', p_active));
end;
$$;

-- Turnos de um dia da semana, gravados de uma vez: a tela manda a lista inteira
-- do dia (com id nos que já existem). Valida horários e sobreposição.
create or replace function public.save_day_shifts(p_weekday int, p_shifts jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  x jsonb;
  v_ids uuid[] := '{}';
  v_id uuid;
  v_name text;
  v_open time;
  v_last time;
  v_close time;
  v_cap int;
  v_is_open boolean;
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  if p_weekday is null or p_weekday not between 0 and 6
     or p_shifts is null or jsonb_typeof(p_shifts) <> 'array' then
    raise exception 'invalid_request';
  end if;
  if jsonb_array_length(p_shifts) > 4 then
    raise exception 'too_many_shifts';
  end if;

  for x in select v from jsonb_array_elements(p_shifts) v loop
    v_name := btrim(coalesce(x->>'name', ''));
    v_open := (x->>'open_time')::time;
    v_last := (x->>'last_seating_time')::time;
    v_close := (x->>'close_time')::time;
    v_cap := nullif(x->>'max_covers', '')::int;
    if char_length(v_name) not between 1 and 30 then
      raise exception 'invalid_shift_name';
    end if;
    if v_open is null or v_last is null or v_close is null or not (v_open < v_last and v_last <= v_close) then
      raise exception 'invalid_shift_times';
    end if;
    if v_cap is not null and v_cap not between 1 and 2000 then
      raise exception 'invalid_capacity';
    end if;
  end loop;

  -- Turnos abertos do mesmo dia não podem se cruzar
  if exists (
    select 1
    from jsonb_array_elements(p_shifts) with ordinality a(v, i)
    join jsonb_array_elements(p_shifts) with ordinality b(v, j) on a.i < b.j
    where coalesce((a.v->>'is_open')::boolean, true) and coalesce((b.v->>'is_open')::boolean, true)
      and (a.v->>'open_time')::time < (b.v->>'close_time')::time
      and (b.v->>'open_time')::time < (a.v->>'close_time')::time
  ) then
    raise exception 'shifts_overlap';
  end if;

  for x in select v from jsonb_array_elements(p_shifts) v loop
    v_id := nullif(x->>'id', '')::uuid;
    v_is_open := coalesce((x->>'is_open')::boolean, true);
    if v_id is not null and exists (select 1 from public.shifts where id = v_id and weekday = p_weekday) then
      update public.shifts
         set name = btrim(x->>'name'),
             open_time = (x->>'open_time')::time,
             last_seating_time = (x->>'last_seating_time')::time,
             close_time = (x->>'close_time')::time,
             max_covers = nullif(x->>'max_covers', '')::int,
             is_open = v_is_open
       where id = v_id;
    else
      insert into public.shifts (weekday, name, open_time, last_seating_time, close_time, max_covers, is_open)
      values (p_weekday, btrim(x->>'name'), (x->>'open_time')::time, (x->>'last_seating_time')::time,
              (x->>'close_time')::time, nullif(x->>'max_covers', '')::int, v_is_open)
      returning id into v_id;
    end if;
    v_ids := v_ids || v_id;
  end loop;

  -- Turnos que saíram da lista (os fechamentos ligados a eles saem junto)
  delete from public.shifts where weekday = p_weekday and not (id = any (v_ids));

  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), 'shifts_saved', 'settings', null, jsonb_build_object('weekday', p_weekday, 'shifts', p_shifts));
end;
$$;

-- Tempo de permanência por tamanho do grupo: faixas contínuas de 1 a 60 pessoas,
-- trocadas de uma vez (vale para as próximas reservas).
create or replace function public.save_turn_times(p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  x jsonb;
  v_expected int := 1;
  v_min int;
  v_max int;
  v_minutes int;
begin
  if not public.is_manager() then
    raise exception 'not_allowed';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) not between 1 and 12 then
    raise exception 'invalid_turn_times';
  end if;
  for x in select v from jsonb_array_elements(p_rows) v order by (v->>'party_min')::int loop
    v_min := (x->>'party_min')::int;
    v_max := (x->>'party_max')::int;
    v_minutes := (x->>'minutes')::int;
    if v_min is distinct from v_expected or v_max is null or v_max < v_min or v_max > 60
       or v_minutes is null or v_minutes not between 15 and 600 then
      raise exception 'invalid_turn_times';
    end if;
    v_expected := v_max + 1;
  end loop;
  if v_expected <> 61 then
    raise exception 'invalid_turn_times';
  end if;

  delete from public.turn_times where true;
  insert into public.turn_times (party_min, party_max, minutes)
  select (v->>'party_min')::int, (v->>'party_max')::int, (v->>'minutes')::int
  from jsonb_array_elements(p_rows) v;

  insert into public.audit_log (actor, action, entity, entity_id, details)
  values (auth.uid(), 'turn_times_saved', 'settings', null, jsonb_build_object('rows', p_rows));
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.areas enable row level security;
alter table public.dining_tables enable row level security;
alter table public.shifts enable row level security;
alter table public.turn_times enable row level security;
alter table public.closures enable row level security;
alter table public.customers enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_tables enable row level security;
alter table public.waitlist enable row level security;
alter table public.message_templates enable row level security;
alter table public.message_log enable row level security;
alter table public.audit_log enable row level security;
alter table public.staff_invites enable row level security;

-- profiles: cada um lê o próprio; gerente lê todos.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() = id or public.is_manager());

-- with check impede editar o próprio cadastro e se promover (papel/ativo iguais aos atuais).
-- Além disso, só as colunas de dados pessoais têm permissão de update (ver grants abaixo).
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.my_role());

-- Configurações e salão: equipe lê, gerente escreve. O público lê via get_public_info().
drop policy if exists settings_select on public.restaurant_settings;
create policy settings_select on public.restaurant_settings for select using (public.is_staff());
drop policy if exists settings_write on public.restaurant_settings;
create policy settings_write on public.restaurant_settings for update
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists areas_select on public.areas;
create policy areas_select on public.areas for select using (public.is_staff());
drop policy if exists areas_write on public.areas;
create policy areas_write on public.areas for all
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists tables_select on public.dining_tables;
create policy tables_select on public.dining_tables for select using (public.is_staff());
drop policy if exists tables_write on public.dining_tables;
create policy tables_write on public.dining_tables for all
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists shifts_select on public.shifts;
create policy shifts_select on public.shifts for select using (public.is_staff());
drop policy if exists shifts_write on public.shifts;
create policy shifts_write on public.shifts for all
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists turn_times_select on public.turn_times;
create policy turn_times_select on public.turn_times for select using (public.is_staff());
drop policy if exists turn_times_write on public.turn_times;
create policy turn_times_write on public.turn_times for all
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists closures_select on public.closures;
create policy closures_select on public.closures for select using (public.is_staff());
drop policy if exists closures_write on public.closures;
create policy closures_write on public.closures for all
  using (public.is_manager()) with check (public.is_manager());

-- Dados sensíveis: só a equipe. Reservas, mesas da reserva e fila só são escritas por RPC.
drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers for select using (public.is_staff());
drop policy if exists customers_update on public.customers;
create policy customers_update on public.customers for update
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists reservations_select on public.reservations;
create policy reservations_select on public.reservations for select using (public.is_staff());

drop policy if exists reservation_tables_select on public.reservation_tables;
create policy reservation_tables_select on public.reservation_tables for select using (public.is_staff());

drop policy if exists waitlist_select on public.waitlist;
create policy waitlist_select on public.waitlist for select using (public.is_staff());

drop policy if exists templates_select on public.message_templates;
create policy templates_select on public.message_templates for select using (public.is_staff());
drop policy if exists templates_write on public.message_templates;
create policy templates_write on public.message_templates for update
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists message_log_select on public.message_log;
create policy message_log_select on public.message_log for select using (public.is_staff());

drop policy if exists audit_log_select on public.audit_log;
create policy audit_log_select on public.audit_log for select using (public.is_manager());

drop policy if exists staff_invites_select on public.staff_invites;
create policy staff_invites_select on public.staff_invites for select using (public.is_manager());

-- ============================================================================
-- PERMISSÕES (grants explícitos e mínimos)
-- O Supabase concede tudo a anon/authenticated por padrão; aqui reduzimos ao
-- necessário. O RLS continua sendo a barreira de linhas.
-- ============================================================================

revoke all on all tables in schema public from anon;
revoke insert, update, delete, truncate on all tables in schema public from authenticated;

grant select on all tables in schema public to authenticated;
grant update (full_name, phone, birthday, preferences) on public.profiles to authenticated;
-- Colunas editáveis pela tela (o resto só muda por função: bloqueio com motivo,
-- anonimização, modo demo). O RLS decide quem (equipe ou gerente) pode atualizar.
grant update (full_name, phone, email, tags, notes, allergies, birthday) on public.customers to authenticated;
grant update (name, tagline, address, phone, whatsapp, instagram, primary_color, logo_url, public_url,
              slot_step_minutes, min_notice_minutes, max_advance_days, max_party_online, cancel_deadline_hours,
              grace_minutes, no_show_block_after, waitlist_enabled, deposit_enabled, deposit_min_party,
              deposit_per_person)
  on public.restaurant_settings to authenticated;
grant update (body, active) on public.message_templates to authenticated;
grant insert, update, delete on public.areas, public.dining_tables, public.shifts, public.turn_times, public.closures
  to authenticated;

-- Funções: ninguém executa nada por padrão...
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- ...e liberamos só o que cada papel precisa.
-- Usadas nas políticas de RLS (precisam ser executáveis por quem consulta):
grant execute on function public.is_staff(), public.is_manager(), public.my_role() to anon, authenticated;

-- Públicas (página de reserva, sem login):
grant execute on function public.get_public_info() to anon, authenticated;
grant execute on function public.get_available_slots(date, int, uuid) to anon, authenticated;
grant execute on function public.get_days_availability(date, int, int) to anon, authenticated;
grant execute on function public.create_reservation_public(date, time, int, text, text, text, text, text, uuid, boolean, boolean, text, text) to anon, authenticated;
grant execute on function public.get_reservation_public(text, text) to anon, authenticated;
grant execute on function public.cancel_reservation_public(text, text, text) to anon, authenticated;
grant execute on function public.confirm_presence_public(text, text) to anon, authenticated;
grant execute on function public.change_reservation_public(text, text, date, time, int) to anon, authenticated;
grant execute on function public.get_available_slots_for_change(text, text, date, int) to anon, authenticated;
grant execute on function public.pay_deposit_public(text, text) to anon, authenticated;
grant execute on function public.join_waitlist_public(date, int, text, text, time, time, boolean, text, text) to anon, authenticated;

-- Cliente logado:
grant execute on function public.my_reservations() to authenticated;

-- Equipe (as funções checam is_staff()/is_manager() por dentro):
grant execute on function public.host_day(date) to authenticated;
grant execute on function public.get_available_slots_staff(date, int, uuid) to authenticated;
grant execute on function public.create_reservation_staff(date, time, int, text, text, text, text, text, text, text, text, uuid[], uuid, uuid) to authenticated;
grant execute on function public.update_reservation_staff(uuid, date, time, int, text, text, text, text, uuid[]) to authenticated;
grant execute on function public.assign_tables(uuid, uuid[]) to authenticated;
grant execute on function public.set_reservation_status(uuid, text, text) to authenticated;
grant execute on function public.set_check_requested(uuid, boolean) to authenticated;
grant execute on function public.set_table_state(uuid, boolean, boolean, text) to authenticated;
grant execute on function public.walkin_options(int) to authenticated;
grant execute on function public.create_walkin(int, text, text, uuid[], text) to authenticated;
grant execute on function public.waitlist_add_staff(int, text, text, int, text, date) to authenticated;
grant execute on function public.waitlist_notify(uuid) to authenticated;
grant execute on function public.waitlist_seat(uuid, uuid[]) to authenticated;
grant execute on function public.waitlist_set_status(uuid, text) to authenticated;
grant execute on function public.send_manual_message(uuid, text) to authenticated;
grant execute on function public.run_due_reminders() to authenticated;
grant execute on function public.block_customer(uuid, boolean, text) to authenticated;
grant execute on function public.anonymize_customer(uuid) to authenticated;
grant execute on function public.reservation_history(uuid) to authenticated;
grant execute on function public.report_summary(date, date) to authenticated;
grant execute on function public.report_by_hour(date, date) to authenticated;
grant execute on function public.report_daily(date, date) to authenticated;
grant execute on function public.report_by_weekday(date, date) to authenticated;
grant execute on function public.list_team() to authenticated;
grant execute on function public.manager_reservations(date, date) to authenticated;
grant execute on function public.customer_list() to authenticated;
grant execute on function public.customer_detail(uuid) to authenticated;
grant execute on function public.manager_overview() to authenticated;
grant execute on function public.invite_staff(text, text, text) to authenticated;
grant execute on function public.revoke_invite(text) to authenticated;
grant execute on function public.set_staff(uuid, text, boolean) to authenticated;
grant execute on function public.save_day_shifts(int, jsonb) to authenticated;
grant execute on function public.save_turn_times(jsonb) to authenticated;

-- ============================================================================
-- REALTIME: o painel do salão atualiza sozinho quando entra reserva, alguém
-- cancela, uma mesa muda de status ou a fila anda.
-- ============================================================================

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['reservations', 'reservation_tables', 'waitlist', 'dining_tables'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ============================================================================
-- DADOS INICIAIS MÍNIMOS (o seed completo da demonstração fica em seed_demo.sql)
-- ============================================================================

insert into public.restaurant_settings (id, name, tagline)
values (1, 'Meu Restaurante', 'Reserve sua mesa')
on conflict (id) do nothing;

insert into public.turn_times (party_min, party_max, minutes) values
  (1, 2, 90), (3, 4, 105), (5, 6, 120), (7, 10, 150), (11, 60, 180)
on conflict do nothing;

insert into public.message_templates (kind, body) values
  ('confirmacao', 'Olá, {nome}! Sua reserva no {restaurante} está confirmada para {data} às {hora}, {pessoas}. Código: {codigo}. Para ver, alterar ou cancelar: {link}'),
  ('lembrete_24h', 'Oi, {nome}! Passando para lembrar: amanhã, {data} às {hora}, tem mesa para {pessoas} esperando por você no {restaurante}. Confirme sua presença: {link}'),
  ('lembrete_2h', '{nome}, sua reserva é hoje às {hora}. Até daqui a pouco! Endereço: {endereco}. Se precisar mudar algo: {link}'),
  ('alteracao', '{nome}, sua reserva foi alterada: {data} às {hora}, {pessoas}. Código: {codigo}. Detalhes: {link}'),
  ('cancelamento', '{nome}, sua reserva de {data} às {hora} foi cancelada. Esperamos receber você em breve no {restaurante}.'),
  ('lista_espera', 'Boa notícia, {nome}! Abriu uma mesa para {pessoas} no {restaurante} em {data}. Responda esta mensagem ou fale com a recepção para garantir o seu lugar.')
on conflict (kind) do nothing;
