# Guia Definativo de Deploy: Next.js + Supabase no Cloudflare Pages

Este documento registra o passo a passo exato e as regras obrigatórias para publicar aplicações Next.js com Supabase no **Cloudflare Pages** sem erros de build.

---

## 1. Regras Obrigatórias no Código (Next.js App Router)

### A. Edge Runtime em Todas as Rotas Dinâmicas / APIs
No Cloudflare Pages, toda API ou rota dinâmica de página DEVE exportar o runtime edge:
```typescript
export const runtime = 'edge';
```
Arquivos que devem conter essa linha:
- `src/proxy.ts` (middleware)
- Todos os arquivos `route.ts` dentro de `src/app/api/` e `src/app/heartbeat/`
- Páginas dinâmicas com `[id]` em `src/app/`

### B. Arquivo `.npmrc` na Raiz do Projeto
Para evitar conflito de resolução de dependências (`ERESOLVE`) com Next.js 16 durante o `npm clean-install` no servidor da Cloudflare:
```ini
legacy-peer-deps=true
```

### C. Script no `package.json`
```json
"scripts": {
  "build": "next build",
  "pages:build": "next-on-pages"
}
```

---

## 2. Configurações no Painel do Cloudflare Pages

### A. Build Settings (Configurações de Build)
- **Framework Preset**: `Next.js (Static HTML Export)` ou `None`
- **Build command**: `npm run pages:build`
- **Build output directory**: `.vercel/output/static`

### B. Compatibility Flags (Flags de Compatibilidade)
Em **Settings** → **Functions** → **Compatibility flags**:
- Adicionar: **`nodejs_compat`** (em Production e Preview)

### C. Variáveis de Ambiente (Environment Variables)
Em **Settings** → **Environment Variables**:
Adicionar nas seções **Build** e **Runtime**:

1. `NPM_FLAGS` = `--legacy-peer-deps`
2. `NEXT_PUBLIC_SUPABASE_URL` = `http://...` (URL do Supabase)
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `...`
4. `SUPABASE_SERVICE_ROLE_KEY` = `...`
5. `ENCRYPTION_KEY` = `...`
6. `META_APP_SECRET` = `...`

---

## 3. Checklist de Resolução de Erros Comuns

| Erro no Log do Cloudflare | Causa Raiz | Solução |
| :--- | :--- | :--- |
| `ERESOLVE could not resolve peer dependency` | Conflito de versão npm | Garantir `.npmrc` com `legacy-peer-deps=true` e variável `NPM_FLAGS=--legacy-peer-deps`. |
| `The following routes were not configured to run with Edge Runtime` | Faltou declarar o runtime edge | Adicionar `export const runtime = 'edge'` no topo da rota indicada. |
| `Failed to produce a Cloudflare Pages build` | Build command incorreto | Garantir que o comando da build seja `npm run pages:build`. |
