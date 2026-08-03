create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  service_area text,
  business_hours text,
  services_list text,
  pricing_notes text,
  vapi_assistant_id text,
  vapi_phone_number text,
  google_calendar_id text,
  monthly_rate_cents integer,
  created_at timestamptz not null default now()
);

create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  vapi_call_id text unique,
  client_id text,
  from_number text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds numeric,
  ended_reason text,
  transcript text,
  summary text,
  successful boolean,
  recording_url text,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references calls(id),
  client_id uuid references clients(id),
  calendar_event_id text,
  summary text,
  start_time timestamptz,
  end_time timestamptz,
  customer_phone text,
  is_emergency boolean default false,
  created_at timestamptz not null default now()
);
