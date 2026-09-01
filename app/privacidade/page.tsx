import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <article className="legal-content">
        <Link className="legal-brand" href="/">
          <img src="/plano-tracker.png" alt="" aria-hidden="true" />
          <strong>PlanoTracker</strong>
        </Link>
        <p className="eyebrow">Última atualização: 1º de setembro de 2026</p>
        <h1>Política de Privacidade</h1>
        <p>Esta política explica como os dados são tratados quando você compra, cria uma conta e usa o PlanoTracker.</p>

        <h2>Dados tratados</h2>
        <p>Podemos tratar nome, e-mail, mensagens enviadas pelo formulário de contato, identificadores do teste gratuito e da assinatura, dados do plano de estudos, editais enviados, disciplinas, metas, calendário, sessões e observações. Os dados completos do cartão não são armazenados pelo PlanoTracker; o pagamento é processado pela Cakto.</p>

        <h2>Para que usamos</h2>
        <p>Usamos os dados para autenticar a conta, controlar o período de teste, validar a assinatura, gerar e salvar planos de estudo, manter o histórico, responder mensagens e prestar suporte, prevenir abuso e cumprir obrigações legais.</p>

        <h2>Cookies e medição de anúncios</h2>
        <p>Os recursos necessários do site funcionam independentemente da sua escolha. Com sua autorização, usamos o Pixel da Meta para medir visitas e ações como início do quiz, cadastro, início do teste e saída para o checkout. Esses eventos ajudam a avaliar campanhas e não incluem o conteúdo do edital, respostas do quiz, anotações ou materiais de estudo.</p>
        <p>Você pode aceitar ou recusar essa medição no aviso exibido no site e alterar sua decisão posteriormente em <a href="/?cookies=configurar">preferências de cookies</a>.</p>

        <h2>Fornecedores</h2>
        <p>O serviço usa Cakto para pagamentos, Supabase para autenticação e banco de dados, Vercel para hospedagem, Resend para envio de e-mails, Meta para medição consentida de anúncios e OpenAI para interpretar o conteúdo enviado e gerar o plano. Ao usar a geração por IA, o conteúdo do edital e as preferências informadas são enviados à API da OpenAI.</p>

        <h2>Armazenamento e segurança</h2>
        <p>Adotamos controles de acesso por usuário e medidas técnicas compatíveis com o serviço. Mantemos os dados enquanto a conta estiver ativa ou pelo período necessário para prestar o serviço, resolver disputas e cumprir obrigações legais.</p>

        <h2>Seus direitos</h2>
        <p>Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade quando aplicável, informação sobre compartilhamento e exclusão dos dados, respeitadas as hipóteses legais de retenção.</p>

        <h2>Contato</h2>
        <p>Para dúvidas ou solicitações sobre privacidade, escreva para <a href="mailto:contato.planotracker@gmail.com">contato.planotracker@gmail.com</a>.</p>
      </article>
    </main>
  );
}
