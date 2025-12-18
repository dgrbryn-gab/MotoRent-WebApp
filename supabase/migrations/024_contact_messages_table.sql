-- Create contact_messages table
create table if not exists contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  message text not null,
  status text default 'new' check (status in ('new', 'read', 'responded')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index on created_at for better query performance
create index if not exists idx_contact_messages_created_at on contact_messages(created_at desc);

-- Create index on status for filtering
create index if not exists idx_contact_messages_status on contact_messages(status);

-- Create index on email for searching
create index if not exists idx_contact_messages_email on contact_messages(email);

-- Enable RLS
alter table contact_messages enable row level security;

-- Only admins can view contact messages
create policy "Admin can view contact messages"
  on contact_messages
  for select
  using (auth.jwt() ->> 'email' in (select email from auth.users where user_metadata->>'is_admin' = 'true'));

-- Only admins can update contact messages
create policy "Admin can update contact messages"
  on contact_messages
  for update
  using (auth.jwt() ->> 'email' in (select email from auth.users where user_metadata->>'is_admin' = 'true'));

-- Only admins can delete contact messages
create policy "Admin can delete contact messages"
  on contact_messages
  for delete
  using (auth.jwt() ->> 'email' in (select email from auth.users where user_metadata->>'is_admin' = 'true'));

-- Anyone can insert contact messages (from the form)
create policy "Anyone can create contact messages"
  on contact_messages
  for insert
  with check (true);
