-- ============================================================
-- MHP Web Sitesi & Yönetim Paneli - Supabase Veritabanı Şeması
-- ============================================================
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor alanına yapıştırıp "Run" butonuna basın.

-- 1. İçerik Tablosunu Oluştur
create table if not exists public.site_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Satır Seviyesi Güvenliği (RLS) Etkinleştir
alter table public.site_content enable row level security;

-- 3. Okuma Politikası (Ziyaretçiler ve web sitesi içeriği serbestçe okuyabilir)
drop policy if exists "Herkes okuyabilir" on public.site_content;
create policy "Herkes okuyabilir" on public.site_content
  for select using (true);

-- 4. Yazma/Güncelleme Politikası (API anahtarı ile güncellenebilir)
drop policy if exists "Yetkili anahtar güncelleyebilir" on public.site_content;
create policy "Yetkili anahtar güncelleyebilir" on public.site_content
  for all using (true) with check (true);
