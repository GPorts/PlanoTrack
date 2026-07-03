# PlanoTracker setup

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

Preencha `OPENAI_API_KEY` e, se quiser manter o padrão do projeto, `OPENAI_MODEL=gpt-4.1-mini`.

Em produção, deixe `ENABLE_MOCK_AI=false` para chamar a API real. Se `ENABLE_MOCK_AI=true` ou `OPENAI_API_KEY` estiver vazia, a rota usa o gerador local e não gasta saldo da OpenAI.

## 4. Cakto

1. Crie três ofertas/assinaturas: mensal, trimestral e anual.
2. Os três links de checkout da Cakto já estão conectados na landing e na tela `/checkout`.
3. Configure webhook para:

```text
https://seu-dominio.com/api/cakto/webhook
```

Eventos importantes: compra aprovada, assinatura renovada, assinatura cancelada, reembolso e chargeback.

Sugestão de metadata na Cakto:

```text
plan_code=monthly | quarterly | annual
billing_cycle=monthly | quarterly | annual
user_id={{id do usuário no PlanoTracker}}
```

## 5. Modelo de MVP

- Usuário sem assinatura não acessa o app interno.
- Assinatura ativa libera criação ilimitada de planos com IA.
- Mensal, trimestral e anual entregam os mesmos recursos; muda apenas o desconto.
