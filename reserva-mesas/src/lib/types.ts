// Tipos do banco (espelham supabase/schema.sql) e dos JSONs devolvidos pelas RPCs.

export type Role = "client" | "host" | "manager";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

export type ReservationSource = "site" | "telefone" | "whatsapp" | "instagram" | "walk_in" | "manual";

export type Occasion = "aniversario" | "casal" | "negocios" | "familia" | "comemoracao" | "outro";

export type DepositStatus = "none" | "pending" | "paid" | "refunded" | "forfeited";

export type TableShape = "round" | "square" | "rect";

export type WaitlistStatus = "waiting" | "notified" | "converted" | "expired" | "cancelled";

export type MessageKind =
  | "confirmacao"
  | "lembrete_24h"
  | "lembrete_2h"
  | "alteracao"
  | "cancelamento"
  | "lista_espera"
  | "manual";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  active: boolean;
  birthday: string | null;
  preferences: string | null;
  created_at: string;
};

export type RestaurantSettingsRow = {
  id: number;
  name: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  primary_color: string;
  logo_url: string | null;
  public_url: string | null;
  slot_step_minutes: number;
  min_notice_minutes: number;
  max_advance_days: number;
  max_party_online: number;
  cancel_deadline_hours: number;
  grace_minutes: number;
  no_show_block_after: number;
  waitlist_enabled: boolean;
  deposit_enabled: boolean;
  deposit_min_party: number | null;
  deposit_per_person: number | null;
  demo_mode: boolean;
  demo_client_email: string | null;
  updated_at: string;
};

export type AreaRow = {
  id: string;
  name: string;
  sort_order: number;
  bookable_online: boolean;
  active: boolean;
};

export type DiningTableRow = {
  id: string;
  area_id: string;
  label: string;
  min_seats: number;
  max_seats: number;
  combinable: boolean;
  shape: TableShape;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  active: boolean;
  blocked: boolean;
  blocked_reason: string | null;
  cleaning_since: string | null;
};

export type ShiftRow = {
  id: string;
  weekday: number;
  name: string;
  open_time: string;
  last_seating_time: string;
  close_time: string;
  max_covers: number | null;
  is_open: boolean;
};

export type TurnTimeRow = {
  party_min: number;
  party_max: number;
  minutes: number;
};

export type ClosureRow = {
  id: string;
  date: string;
  shift_id: string | null;
  reason: string | null;
  created_at: string;
};

export type CustomerRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  tags: string[];
  notes: string | null;
  allergies: string | null;
  birthday: string | null;
  marketing_consent: boolean;
  privacy_consent_at: string | null;
  blocked: boolean;
  blocked_reason: string | null;
  anonymized_at: string | null;
  created_at: string;
};

export type ReservationRow = {
  id: string;
  code: string;
  customer_id: string;
  party_size: number;
  date: string;
  start_time: string;
  duration_minutes: number;
  end_time: string;
  starts_at: string;
  ends_at: string;
  status: ReservationStatus;
  source: ReservationSource;
  occasion: Occasion | null;
  notes: string | null;
  dietary_notes: string | null;
  internal_notes: string | null;
  area_preference: string | null;
  account_id: string | null;
  confirmed_by_customer_at: string | null;
  seated_at: string | null;
  check_requested_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  deposit_status: DepositStatus;
  deposit_amount: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ReservationTableRow = {
  reservation_id: string;
  table_id: string;
  time_range: string;
  active: boolean;
};

export type WaitlistRow = {
  id: string;
  customer_id: string;
  party_size: number;
  date: string;
  preferred_from: string | null;
  preferred_to: string | null;
  source: "site" | "walk_in" | "telefone";
  quoted_wait_minutes: number | null;
  notes: string | null;
  status: WaitlistStatus;
  notified_at: string | null;
  seated_reservation_id: string | null;
  created_at: string;
};

export type MessageTemplateRow = {
  kind: Exclude<MessageKind, "manual">;
  body: string;
  active: boolean;
  updated_at: string;
};

export type MessageLogRow = {
  id: string;
  reservation_id: string | null;
  waitlist_id: string | null;
  customer_id: string | null;
  channel: "whatsapp" | "email" | "sms";
  kind: MessageKind;
  body: string;
  simulated: boolean;
  created_at: string;
};

export type AuditLogRow = {
  id: number;
  actor: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

// ----------------------------------------------------------------------------
// JSONs das RPCs
// ----------------------------------------------------------------------------

export type PublicInfo = {
  name: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  primary_color: string;
  logo_url: string | null;
  slot_step_minutes: number;
  min_notice_minutes: number;
  max_advance_days: number;
  max_party_online: number;
  cancel_deadline_hours: number;
  grace_minutes: number;
  waitlist_enabled: boolean;
  deposit_enabled: boolean;
  deposit_min_party: number | null;
  deposit_per_person: number | null;
  demo_mode: boolean;
  today: string;
  areas: { id: string; name: string }[];
  shifts: {
    weekday: number;
    name: string;
    open_time: string;
    last_seating_time: string;
    close_time: string;
  }[];
  closures: { date: string; full_day: boolean; shift_name: string | null }[];
};

export type AvailableSlot = {
  slot_time: string; // HH:MM:SS
  shift_name: string;
  tables_left: number;
};

export type DayAvailability = {
  day: string;
  free_slots: number;
  closed: boolean;
};

export type CreatedReservation = {
  code: string;
  status: ReservationStatus;
  date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  customer_name: string;
  area_name: string | null;
  area_matched: boolean;
  deposit_amount: number | null;
};

export type PublicReservation = {
  code: string;
  status: ReservationStatus;
  date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  occasion: Occasion | null;
  notes: string | null;
  dietary_notes: string | null;
  customer_name: string;
  area_name: string | null;
  deposit_status: DepositStatus;
  deposit_amount: number | null;
  confirmed_by_customer_at: string | null;
  cancel_deadline_hours: number;
  minutes_until: number;
  can_change: boolean;
};

export type MyReservation = {
  code: string;
  phone: string;
  status: ReservationStatus;
  date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  occasion: Occasion | null;
  notes: string | null;
  area_preference: string | null;
  area_name: string | null;
  can_change: boolean;
};

export type HostCustomer = {
  id: string;
  full_name: string;
  phone: string | null;
  tags: string[];
  notes: string | null;
  allergies: string | null;
  birthday: string | null;
  blocked: boolean;
  visits: number;
  no_shows: number;
};

export type HostReservation = {
  id: string;
  code: string;
  status: ReservationStatus;
  date: string;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  duration_minutes: number;
  party_size: number;
  source: ReservationSource;
  occasion: Occasion | null;
  notes: string | null;
  dietary_notes: string | null;
  internal_notes: string | null;
  area_preference: string | null;
  seated_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  check_requested_at: string | null;
  confirmed_by_customer_at: string | null;
  deposit_status: DepositStatus;
  deposit_amount: number | null;
  created_at: string;
  table_ids: string[];
  customer: HostCustomer;
};

export type HostTable = Pick<
  DiningTableRow,
  | "id"
  | "label"
  | "area_id"
  | "min_seats"
  | "max_seats"
  | "shape"
  | "pos_x"
  | "pos_y"
  | "width"
  | "height"
  | "combinable"
  | "blocked"
  | "blocked_reason"
  | "cleaning_since"
>;

export type HostWaitlistEntry = {
  id: string;
  status: WaitlistStatus;
  party_size: number;
  source: WaitlistRow["source"];
  preferred_from: string | null;
  preferred_to: string | null;
  quoted_wait_minutes: number | null;
  notes: string | null;
  created_at: string;
  notified_at: string | null;
  customer: { id: string; full_name: string; phone: string | null; tags: string[] };
};

export type HostDay = {
  date: string;
  now: string; // YYYY-MM-DDTHH:MM:SS (São Paulo)
  settings: {
    grace_minutes: number;
    name: string;
    slot_step_minutes: number;
    waitlist_enabled: boolean;
    demo_mode: boolean;
  };
  areas: { id: string; name: string; bookable_online: boolean }[];
  tables: HostTable[];
  shifts: {
    id: string;
    name: string;
    open_time: string;
    last_seating_time: string;
    close_time: string;
    max_covers: number | null;
    closed: boolean;
  }[];
  reservations: HostReservation[];
  waitlist: HostWaitlistEntry[];
};

export type WalkinOptions =
  | {
      available: true;
      table_ids: string[];
      labels: string;
      seats: number;
      duration_minutes: number;
      queue_ahead: number;
    }
  | {
      available: false;
      wait_minutes: number | null;
      duration_minutes: number;
      queue_ahead: number;
    };

export type ReservationHistory = {
  events: {
    action: string;
    details: Record<string, unknown> | null;
    created_at: string;
    actor_name: string | null;
  }[];
  messages: {
    kind: MessageKind;
    body: string;
    channel: string;
    simulated: boolean;
    created_at: string;
  }[];
};

export type ReportSummary = {
  reservations: number;
  total_including_cancelled: number;
  people: number;
  people_served: number;
  completed: number;
  seated: number;
  upcoming: number;
  no_shows: number;
  cancelled: number;
  walk_ins: number;
  no_show_rate: number | null;
  cancel_rate: number | null;
  avg_party: number | null;
  avg_stay_minutes: number | null;
  occupancy: number | null;
  by_source: { source: ReservationSource; count: number }[];
  by_shift: { shift: string; capacity: number; used: number; occupancy: number | null }[];
  by_occasion: { occasion: Occasion; count: number }[];
};

export type ReportDailyRow = {
  day: string;
  reservations: number;
  people: number;
  cancelled: number;
  no_shows: number;
  walk_ins: number;
  occupancy: number | null;
};

export type ReportHourRow = { hour: number; reservations: number; people: number };

export type ReportWeekdayRow = {
  weekday: number;
  open_days: number;
  reservations: number;
  people: number;
  occupancy: number | null;
};

export type TeamData = {
  members: {
    id: string;
    full_name: string | null;
    email: string;
    role: Role;
    active: boolean;
    last_sign_in_at: string | null;
    is_me: boolean;
  }[];
  invites: { email: string; role: Role; full_name: string | null; created_at: string }[];
};

// ----------------------------------------------------------------------------
// Database (para o cliente Supabase tipado)
// ----------------------------------------------------------------------------

type Table<Row, Insert = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: [];
};

type Fn<Args, Returns> = { Args: Args; Returns: Returns };

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      restaurant_settings: Table<RestaurantSettingsRow>;
      areas: Table<AreaRow>;
      dining_tables: Table<DiningTableRow>;
      shifts: Table<ShiftRow>;
      turn_times: Table<TurnTimeRow>;
      closures: Table<ClosureRow>;
      customers: Table<CustomerRow>;
      reservations: Table<ReservationRow>;
      reservation_tables: Table<ReservationTableRow>;
      waitlist: Table<WaitlistRow>;
      message_templates: Table<MessageTemplateRow>;
      message_log: Table<MessageLogRow>;
      audit_log: Table<AuditLogRow>;
    };
    Views: { [_ in never]: never };
    Functions: {
      get_public_info: Fn<Record<string, never>, PublicInfo>;
      get_available_slots: Fn<
        { p_date: string; p_party_size: number; p_area?: string | null },
        AvailableSlot[]
      >;
      get_days_availability: Fn<
        { p_from: string; p_days: number; p_party_size: number },
        DayAvailability[]
      >;
      create_reservation_public: Fn<
        {
          p_date: string;
          p_start_time: string;
          p_party_size: number;
          p_name: string;
          p_phone: string;
          p_email?: string | null;
          p_occasion?: Occasion | null;
          p_notes?: string | null;
          p_area?: string | null;
          p_marketing_consent?: boolean;
          p_privacy_consent?: boolean;
          p_dietary_notes?: string | null;
          p_website?: string | null;
        },
        CreatedReservation
      >;
      get_reservation_public: Fn<{ p_code: string; p_phone: string }, PublicReservation>;
      cancel_reservation_public: Fn<
        { p_code: string; p_phone: string; p_reason?: string | null },
        PublicReservation
      >;
      confirm_presence_public: Fn<{ p_code: string; p_phone: string }, PublicReservation>;
      pay_deposit_public: Fn<{ p_code: string; p_phone: string }, PublicReservation>;
      change_reservation_public: Fn<
        {
          p_code: string;
          p_phone: string;
          p_new_date: string;
          p_new_time: string;
          p_party_size: number;
        },
        PublicReservation
      >;
      join_waitlist_public: Fn<
        {
          p_date: string;
          p_party_size: number;
          p_name: string;
          p_phone: string;
          p_preferred_from?: string | null;
          p_preferred_to?: string | null;
          p_privacy_consent?: boolean;
          p_email?: string | null;
          p_website?: string | null;
        },
        { id: string; position: number; date: string }
      >;
      my_reservations: Fn<Record<string, never>, MyReservation[]>;
      host_day: Fn<{ p_date: string }, HostDay>;
      get_available_slots_staff: Fn<
        { p_date: string; p_party_size: number; p_exclude?: string | null },
        AvailableSlot[]
      >;
      create_reservation_staff: Fn<
        {
          p_date: string;
          p_start_time: string;
          p_party_size: number;
          p_name: string;
          p_phone: string;
          p_source?: ReservationSource;
          p_email?: string | null;
          p_occasion?: Occasion | null;
          p_notes?: string | null;
          p_internal_notes?: string | null;
          p_dietary_notes?: string | null;
          p_table_ids?: string[] | null;
          p_area?: string | null;
          p_customer_id?: string | null;
        },
        { id: string; code: string }
      >;
      update_reservation_staff: Fn<
        {
          p_id: string;
          p_date: string;
          p_start_time: string;
          p_party_size: number;
          p_occasion?: Occasion | null;
          p_notes?: string | null;
          p_internal_notes?: string | null;
          p_dietary_notes?: string | null;
          p_table_ids?: string[] | null;
        },
        { id: string }
      >;
      assign_tables: Fn<
        { p_reservation_id: string; p_table_ids: string[] },
        { seats: number; party_size: number }
      >;
      set_reservation_status: Fn<
        { p_id: string; p_status: ReservationStatus; p_reason?: string | null },
        { id: string; status: ReservationStatus }
      >;
      set_check_requested: Fn<{ p_id: string; p_on: boolean }, undefined>;
      set_table_state: Fn<
        { p_table_id: string; p_clean?: boolean | null; p_blocked?: boolean | null; p_reason?: string | null },
        undefined
      >;
      walkin_options: Fn<{ p_party_size: number }, WalkinOptions>;
      create_walkin: Fn<
        {
          p_party_size: number;
          p_name?: string | null;
          p_phone?: string | null;
          p_table_ids?: string[] | null;
          p_notes?: string | null;
        },
        { id: string; labels: string }
      >;
      waitlist_add_staff: Fn<
        {
          p_party_size: number;
          p_name: string;
          p_phone?: string | null;
          p_quoted_wait_minutes?: number | null;
          p_notes?: string | null;
          p_date?: string | null;
        },
        { id: string }
      >;
      waitlist_notify: Fn<{ p_id: string }, undefined>;
      waitlist_seat: Fn<{ p_id: string; p_table_ids?: string[] | null }, { id: string; labels: string }>;
      waitlist_set_status: Fn<{ p_id: string; p_status: "waiting" | "cancelled" | "expired" }, undefined>;
      send_manual_message: Fn<{ p_reservation_id: string; p_body: string }, undefined>;
      run_due_reminders: Fn<Record<string, never>, number>;
      block_customer: Fn<{ p_id: string; p_blocked: boolean; p_reason?: string | null }, undefined>;
      anonymize_customer: Fn<{ p_id: string }, undefined>;
      reservation_history: Fn<{ p_id: string }, ReservationHistory>;
      report_summary: Fn<{ p_from: string; p_to: string }, ReportSummary>;
      report_by_hour: Fn<{ p_from: string; p_to: string }, ReportHourRow[]>;
      report_daily: Fn<{ p_from: string; p_to: string }, ReportDailyRow[]>;
      report_by_weekday: Fn<{ p_from: string; p_to: string }, ReportWeekdayRow[]>;
      list_team: Fn<Record<string, never>, TeamData>;
      invite_staff: Fn<{ p_email: string; p_role: "host" | "manager"; p_full_name?: string | null }, string>;
      revoke_invite: Fn<{ p_email: string }, undefined>;
      set_staff: Fn<{ p_user_id: string; p_role: Role; p_active: boolean }, undefined>;
      demo_reset: Fn<{ p_site_url?: string | null }, undefined>;
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
