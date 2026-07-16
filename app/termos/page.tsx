import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="legal-page">
      <article className="legal-content">
        <Link className="legal-brand" href="/">
          <img src="/plano-tracker.png" alt="" aria-hidden="true" />
          <strong>PlanoTracker</strong>
        </Link>
        <p className="eyebrow">Última atualização: 16 de julho de 2026</p>
        <h1>Termos de Uso</h1>
        <p>Ao comprar ou usar o PlanoTracker, você concorda com estes termos.</p>

        <h2>Serviço</h2>
        <p>O PlanoTracker organiza editais e preferências de rotina em planos de estudo gerados com auxílio de inteligência artificial. O usuário pode revisar e editar disciplinas, metas, calendário e sessões.</p>

        <h2>Assinatura e renovação</h2>
        <p>Os planos mensal, trimestral e anual dão acesso às mesmas funcionalidades e são cobrados de forma recorrente conforme o ciclo escolhido no checkout da Cakto. Valores, taxas e condições finais são exibidos antes da confirmação do pagamento.</p>

        <h2>Cancelamento e reembolso</h2>
        <p>Você pode solicitar cancelamento pelo e-mail de suporte. Compras on-line podem ser objeto do direito de arrependimento no prazo legal de 7 dias. Após esse prazo, a interrupção da renovação não gera reembolso proporcional, salvo obrigação legal ou condição expressamente oferecida.</p>

        <h2>Uso responsável da IA</h2>
        <p>Planos gerados por IA podem conter omissões ou interpretações incorretas. Você deve conferir o resultado com o edital oficial. O PlanoTracker não garante aprovação, classificação ou desempenho em provas.</p>

        <h2>Conta e uso permitido</h2>
        <p>Você é responsável por manter sua senha segura e pelas informações enviadas. É proibido tentar contornar controles de acesso, sobrecarregar o serviço, explorar falhas ou usar a plataforma para fins ilícitos.</p>

        <h2>Disponibilidade</h2>
        <p>Buscamos manter o serviço disponível e preservar os dados, mas podem ocorrer manutenções, indisponibilidades de fornecedores e mudanças necessárias para segurança ou evolução do produto.</p>

        <h2>Contato</h2>
        <p>Dúvidas, cancelamentos e solicitações: <a href="mailto:gustavorossiniports@gmail.com">gustavorossiniports@gmail.com</a>.</p>
      </article>
    </main>
  );
}
