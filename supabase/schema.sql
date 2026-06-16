-- MUIANGA CONSULTORES — Supabase Schema

-- Service requests (formulário de pedido de serviço)
create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  contacto text not null,
  servico text not null,
  orcamento text,
  descricao text not null,
  created_at timestamptz default now()
);

-- Job listings (biscatos e vagas)
create table if not exists job_listings (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('biscato', 'vaga')),
  title text not null,
  descricao text,
  valor text,
  prazo text,
  modalidade text,
  area text,
  empresa text,
  local text,
  status text default 'Aberto' check (status in ('Aberto', 'Em andamento', 'Encerrado')),
  created_at timestamptz default now()
);

-- Candidaturas (biscatos e vagas)
create table if not exists candidaturas (
  id uuid primary key default gen_random_uuid(),
  job_id text not null,
  nome text not null,
  contacto text not null,
  mensagem text,
  created_at timestamptz default now()
);

-- Community members
create table if not exists community_members (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  tel text,
  area text,
  pais text,
  motivacao text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Contact messages
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  assunto text,
  mensagem text not null,
  lido boolean default false,
  created_at timestamptz default now()
);

-- RLS: Enable but allow inserts from anon for forms
alter table service_requests enable row level security;
alter table candidaturas enable row level security;
alter table community_members enable row level security;
alter table contact_messages enable row level security;

create policy "Allow public inserts on service_requests"
  on service_requests for insert to anon with check (true);

create policy "Allow public inserts on candidaturas"
  on candidaturas for insert to anon with check (true);

create policy "Allow public inserts on community_members"
  on community_members for insert to anon with check (true);

create policy "Allow public inserts on contact_messages"
  on contact_messages for insert to anon with check (true);
