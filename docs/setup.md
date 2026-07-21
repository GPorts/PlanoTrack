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
5. Em um projeto que já existe, rode também `supabase/migrations/20260720_adaptive_study.sql` no SQL editor.

A migração adaptativa preserva os planos existentes, converte blocos antigos marcados como concluídos e cria as tabelas de revisões, erros, simulados, materiais, telemetria e preferências de notificação com RLS.

## 3. OpenAI

Preencha `OPENAI_API_KEY` e, se quiser manter o padrão do projeto, `OPENAI_MODEL=gpt-4.1-mini`.

Em produção, deixe `ENABLE_MOCK_AI=false` para chamar a API real. Se `ENABLE_MOCK_AI=true` ou `OPENAI_API_KEY` estiver vazia, a rota usa o gerador local e não gasta saldo da OpenAI.

O uso por operação é salvo em `ai_usage_events`, incluindo modelo, tokens de entrada e tokens de saída.

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

## 6. PWA e calendário

- A instalação como aplicativo usa `/manifest.webmanifest` e `/sw.js`.
- O botão **Ativar lembretes** solicita a permissão do navegador; não é necessário adicionar chave.
- A agenda pode ser exportada em `.ics` e importada no Google Calendar, Outlook ou Apple Calendar.
- Para o resumo diário por e-mail, configure `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL` e `CRON_SECRET` na Vercel. O cron de `vercel.json` roda diariamente às 08h no horário de Brasília.
- A sincronização OAuth bidirecional com Google Calendar exige credenciais do Google; a exportação `.ics` já funciona sem credenciais.
