# MUIANGA CONSULTORES — Guia de Deploy

## 1. Supabase

1. Cria um projecto em https://supabase.com
2. Vai a **SQL Editor** e executa o conteúdo de `supabase/schema.sql`
3. Copia `Project URL` e `anon key` das **Settings > API**

## 2. Variáveis de Ambiente

Cria um ficheiro `.env.local` na raiz (ou define no Vercel):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Imagem do Fundador

A imagem é descarregada automaticamente do Google Drive em `npm run dev` e `npm run build`.  
Se preferires adicionar manualmente: coloca o ficheiro em `public/images/fredson-muianga.jpg`.

## 4. Deploy no Vercel

```bash
npm install -g vercel
vercel
```

Ou conecta o repositório GitHub directamente em https://vercel.com/new.

Adiciona as variáveis de ambiente no painel do Vercel em **Settings > Environment Variables**.

## 5. Desenvolvimento local

```bash
npm install
npm run dev
# Acede em http://localhost:3000
```

## Estrutura do projecto

```
app/
  page.tsx          — Página inicial
  sobre/            — Sobre Nós + fundador
  servicos/         — E-commerce de serviços
  emprego/          — Biscatos e vagas
  comunidade/       — Registo na comunidade
  contacto/         — Formulário de contacto
  api/              — API routes (Supabase)
components/
  Navbar.tsx
  Footer.tsx
lib/
  supabase.ts
supabase/
  schema.sql        — SQL para criar as tabelas
public/
  images/
    fredson-muianga.jpg
```
