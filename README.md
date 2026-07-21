# PlanoTracker

MVP SaaS para transformar editais em planos de estudo diários.

Stack escolhida:

- Next.js
- Supabase
- OpenAI
- Cakto

Recursos principais:

- Assinaturas mensal, trimestral e anual.
- Assinatura ativa libera planos ilimitados.
- Webhook Cakto preparado para atualizar assinatura.
- Supabase schema pronto.
- Plano adaptativo com execução, recuperação de atrasos e histórico para desfazer.
- Revisões espaçadas com FSRS, domínio por subtópico e mapa de risco.
- Caderno de erros, simulados, cenários e materiais baseados na fonte do aluno.
- PWA, lembretes locais e exportação de agenda em `.ics`.

Veja `docs/setup.md` para configurar.

## Rodar no Windows

Se `pnpm dev` não funcionar no terminal, execute:

```bat
iniciar-dev.bat
```

Depois abra `http://localhost:3000`.

## Verificação

```bash
pnpm test
pnpm typecheck
pnpm build
```
