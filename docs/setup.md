# PlanoTrack setup

## 1. Rodar localmente

```bash
pnpm install
pnpm dev
```

Copie `.env.example` para `.env.local` e preencha as chaves conforme for criando as contas.

## 2. Supabase

1. Crie um projeto no Supabase.
2. Copie `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Copie a service role key para `SUPABASE_SERVICE_ROLE_KEY`.
4. Rode `supabase/schema.sql` no SQL editor.

## 3. OpenAI

Preencha `OPENAI_API_KEY`.

Enquanto `ENABLE_MOCK_AI=true`, a rota de IA usa o gerador local. Coloque `ENABLE_MOCK_AI=false` para chamar a API real.

## 4. Cakto

1. Crie tres ofertas/assinaturas: mensal, trimestral e anual.
2. Os tres links de checkout da Cakto ja estao conectados na landing e na tela `/checkout`.
3. Configure webhook para:

```text
https://seu-dominio.com/api/cakto/webhook
```

Eventos importantes: compra aprovada, assinatura criada, assinatura renovada, cancelamento e reembolso.

Sugestao de metadata na Cakto:

```text
plan_code=monthly | quarterly | annual
billing_cycle=monthly | quarterly | annual
user_id={{id do usuario no PlanoTrack}}
```

## 5. Modelo de MVP

- Usuario sem assinatura pode testar telas/manual.
- Assinatura ativa libera criacao ilimitada de planos.
- Mensal, trimestral e anual entregam os mesmos recursos; muda apenas o desconto.
