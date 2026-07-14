export const metadata = {
  title: "Termos de Uso: MUIANGA CARREIRAS",
  description: "Termos e condições de utilização da plataforma MUIANGA CARREIRAS.",
};

const YEAR = new Date().getFullYear();

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-[#2A0001] mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-[#D20001] rounded-full inline-block shrink-0" />
        {title}
      </h2>
      <div className="text-gray-600 text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function TermosPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-8 border-b border-gray-100 bg-[#FFF8F8]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#D20001]/10 text-[#D20001] border border-[#D20001]/20 mb-4">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2A0001] mb-3">Termos de Uso</h1>
          <p className="text-gray-400 text-sm">Última actualização: Janeiro de {YEAR}</p>
        </div>
      </section>

      {/* Conteúdo */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        <div className="bg-[#FFF8F8] border border-amber-100 rounded-2xl p-5 mb-10 text-sm text-gray-600 leading-relaxed">
          Ao aceder e utilizar a plataforma <strong className="text-[#2A0001]">MUIANGA CARREIRAS</strong> (disponível em muiangaconsultores.co.mz), declara que leu, compreendeu e aceita os presentes Termos de Uso na íntegra. Caso não concorde com alguma das condições, deverá cessar imediatamente a utilização da plataforma.
        </div>

        <Section title="1. Identificação da Empresa">
          <p><strong className="text-[#2A0001]">MUIANGA CARREIRAS</strong> é uma empresa de consultoria multifuncional sediada em Maputo, Moçambique, que opera uma plataforma digital de serviços de consultoria, boladas (micro-trabalhos) e vagas de emprego destinada ao mercado Moçambicano e à lusofonia (Angola, Brasil, Portugal e PALOP).</p>
          <p>Contactos oficiais:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email: <a href="mailto:minville@outlook.pt" className="text-[#D20001] hover:underline">minville@outlook.pt</a></li>
            <li>E-Mola: <strong className="text-[#2A0001]">876 252 006</strong> (Fredson Muianga)</li>
            <li>M-Pesa: <strong className="text-[#2A0001]">846 283 051</strong> (Fredson Muianga)</li>
            <li>Localização: Maputo, Moçambique</li>
          </ul>
        </Section>

        <Section title="2. Registo e Conta de Utilizador">
          <p>Para aceder a funcionalidades como candidaturas a vagas e boladas, é obrigatório criar uma conta com um endereço de email válido e palavra-passe segura.</p>
          <p>O utilizador é responsável por:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Manter a confidencialidade das suas credenciais de acesso;</li>
            <li>Fornecer informações verdadeiras, actualizadas e completas;</li>
            <li>Notificar imediatamente a MUIANGA CARREIRAS em caso de uso não autorizado da sua conta.</li>
          </ul>
          <p>A MUIANGA CARREIRAS reserva-se o direito de suspender ou eliminar contas que violem os presentes termos, sem aviso prévio.</p>
        </Section>

        <Section title="3. Plano Premium: Subscrição Mensal">
          <p>O acesso às funcionalidades de candidatura a vagas de emprego requer uma subscrição activa no valor de <strong className="text-[#2A0001]">199 MT por mês</strong> (trinta dias corridos).</p>
          <p><strong className="text-[#2A0001]">Métodos de pagamento aceites:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>E-Mola: <strong>876 252 006</strong>, em nome de Fredson Muianga</li>
            <li>M-Pesa: <strong>846 283 051</strong>, em nome de Fredson Muianga</li>
          </ul>
          <p>Após o pagamento, o utilizador deve submeter a referência da transacção na plataforma. A activação é efectuada manualmente em até <strong className="text-[#2A0001]">24 horas úteis</strong>.</p>
          <p>A subscrição não é renovada automaticamente. O utilizador é responsável por renovar o acesso antes do término do período contratado. A expiração da subscrição implica a desactivação imediata das funcionalidades premium.</p>
          <p><strong className="text-[#2A0001]">Política de reembolso:</strong> Não são efectuados reembolsos após a activação do período de acesso, salvo em casos de erro comprovado da parte da MUIANGA CARREIRAS.</p>
        </Section>

        <Section title="4. Boladas (Micro-trabalhos)">
          <p>As Boladas são tarefas de trabalho de curta duração publicadas na plataforma, remuneradas em Meticais (MT). Ao candidatar-se a uma Bolada, o utilizador aceita:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Executar o trabalho dentro do prazo indicado e com a qualidade acordada;</li>
            <li>Que a MUIANGA CARREIRAS actua como intermediária e não garante a atribuição de nenhuma tarefa;</li>
            <li>Que o pagamento está condicionado à aceitação do trabalho entregue pelo solicitante.</li>
          </ul>
        </Section>

        <Section title="5. Vagas de Emprego">
          <p>As vagas de emprego exibidas na plataforma são agregadas de fontes externas (nomeadamente njobs.co.mz) e actualizadas automaticamente a cada hora. A MUIANGA CARREIRAS não é responsável pela exactidão, completude ou disponibilidade das vagas publicadas por terceiros.</p>
          <p>A candidatura por email é facilitada pela plataforma através de um email pré-preenchido. A MUIANGA CARREIRAS não garante resposta por parte das entidades empregadoras nem intervém no processo de selecção.</p>
        </Section>

        <Section title="6. Conduta do Utilizador">
          <p>É expressamente proibido:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Utilizar a plataforma para fins ilegais ou fraudulentos;</li>
            <li>Submeter informações falsas, enganosas ou difamatórias;</li>
            <li>Tentar aceder a áreas restritas da plataforma sem autorização;</li>
            <li>Partilhar credenciais de acesso com terceiros;</li>
            <li>Utilizar meios automáticos (bots, scrapers) para extrair conteúdo da plataforma;</li>
            <li>Publicar ou transmitir conteúdo que viole direitos de terceiros.</li>
          </ul>
          <p>A violação destas regras implica a suspensão imediata da conta, sem direito a reembolso.</p>
        </Section>

        <Section title="7. Propriedade Intelectual">
          <p>Todo o conteúdo da plataforma, incluindo textos, logótipos, design, código-fonte e identidade visual, é propriedade exclusiva da MUIANGA CARREIRAS e está protegido pela legislação moçambicana e internacional de propriedade intelectual.</p>
          <p>É proibida a reprodução, distribuição ou utilização comercial de qualquer elemento sem autorização prévia e escrita da MUIANGA CARREIRAS.</p>
        </Section>

        <Section title="8. Privacidade e Protecção de Dados">
          <p>Os dados pessoais recolhidos (nome, email, telefone) são utilizados exclusivamente para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Gestão da conta e subscrição;</li>
            <li>Facilitação de candidaturas a vagas e boladas;</li>
            <li>Comunicações relacionadas com o serviço.</li>
          </ul>
          <p>Os dados são armazenados de forma segura através da plataforma Supabase (servidores na Europa) e não são vendidos nem partilhados com terceiros sem consentimento, excepto quando exigido por lei.</p>
          <p>O utilizador tem o direito de solicitar a eliminação dos seus dados a qualquer momento, contactando <a href="mailto:minville@outlook.pt" className="text-[#D20001] hover:underline">minville@outlook.pt</a>.</p>
        </Section>

        <Section title="9. Limitação de Responsabilidade">
          <p>A MUIANGA CARREIRAS não se responsabiliza por:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Interrupções ou falhas técnicas na plataforma;</li>
            <li>Resultados de candidaturas submetidas a entidades externas;</li>
            <li>Perdas ou danos decorrentes do uso indevido da plataforma pelo utilizador;</li>
            <li>Conteúdo de sites de terceiros para os quais a plataforma possa redirecionar.</li>
          </ul>
          <p>O serviço é fornecido "tal como está", sem garantias de disponibilidade ininterrupta.</p>
        </Section>

        <Section title="10. Alterações aos Termos">
          <p>A MUIANGA CARREIRAS reserva-se o direito de actualizar os presentes Termos de Uso a qualquer momento. As alterações entram em vigor imediatamente após publicação na plataforma. A continuação da utilização após as alterações constitui aceitação dos novos termos.</p>
          <p>Recomendamos a consulta periódica desta página.</p>
        </Section>

        <Section title="11. Lei Aplicável e Jurisdição">
          <p>Os presentes Termos de Uso são regidos pela legislação da República de Moçambique. Qualquer litígio decorrente da utilização da plataforma será submetido à jurisdição dos tribunais competentes de Maputo, Moçambique.</p>
        </Section>

        <div className="border-t border-gray-100 pt-8 mt-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            Para qualquer questão relativa a estes termos, contacte-nos em <a href="mailto:minville@outlook.pt" className="text-[#D20001] hover:underline">minville@outlook.pt</a> ou através dos nossos números de pagamento móvel.<br/>
            &copy; {YEAR} MUIANGA CARREIRAS. Todos os direitos reservados. Maputo, Moçambique.
          </p>
        </div>
      </div>
    </div>
  );
}
