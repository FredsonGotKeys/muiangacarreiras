import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade: MUIANGA Carreiras",
  description: "Como recolhemos, usamos e protegemos os teus dados pessoais.",
};

const sections = [
  {
    title: "1. Quem somos",
    body: "A MUIANGA CARREIRAS é uma empresa sediada em Moçambique, dedicada à consultoria, formação e conexão de oportunidades no espaço lusófono. Responsável pelo tratamento de dados: Fredson Bernardo Muianga. Contacto: geral@muiangaconsultores.com",
  },
  {
    title: "2. Dados que recolhemos",
    body: "Recolhemos apenas os dados necessários para o funcionamento da plataforma: nome completo, endereço de email (via autenticação Google), e dados de pagamento processados pela ZumboPay (não armazenamos dados de cartão ou carteira móvel directamente).",
  },
  {
    title: "3. Para que usamos os teus dados",
    body: "Os teus dados são usados para: criar e gerir a tua conta, processar subscrições de acesso às vagas, enviar comunicações relacionadas com o serviço (confirmações, alertas de expiração), e melhorar a plataforma.",
  },
  {
    title: "4. Partilha de dados",
    body: "Não vendemos nem partilhamos os teus dados com terceiros para fins comerciais. Os dados são partilhados apenas com prestadores de serviço essenciais: Supabase (base de dados e autenticação), Google (autenticação OAuth) e ZumboPay (processamento de pagamentos). Todos operam com as suas próprias políticas de privacidade.",
  },
  {
    title: "5. Retenção de dados",
    body: "Os teus dados são mantidos enquanto a tua conta estiver activa. Podes solicitar a eliminação da conta e dos dados associados a qualquer momento através do email de contacto.",
  },
  {
    title: "6. Os teus direitos",
    body: "Tens direito a aceder, corrigir, exportar ou eliminar os teus dados pessoais. Para exercer estes direitos, contacta-nos através de geral@muiangaconsultores.com. Respondemos em até 30 dias úteis.",
  },
  {
    title: "7. Segurança",
    body: "Implementamos medidas técnicas e organizacionais para proteger os teus dados contra acesso não autorizado, incluindo autenticação segura, comunicações cifradas (HTTPS) e controlo de acesso baseado em funções (RLS).",
  },
  {
    title: "8. Cookies",
    body: "Utilizamos apenas cookies de sessão essenciais para manter o teu estado de autenticação. Não utilizamos cookies de rastreamento ou publicidade de terceiros.",
  },
  {
    title: "9. Alterações a esta política",
    body: "Podemos actualizar esta política ocasionalmente. Notificaremos os utilizadores activos sobre alterações significativas por email. A data da última actualização está indicada no rodapé desta página.",
  },
  {
    title: "10. Contacto",
    body: "Para qualquer questão sobre privacidade ou protecção de dados: geral@muiangaconsultores.com | MUIANGA CARREIRAS, Maputo, Moçambique.",
  },
];

export default function PrivacidadePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#D20001]/10 text-[#D20001] border border-[#D20001]/20 mb-4">
          Legal
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#2A0001] mb-3">Política de Privacidade</h1>
        <p className="text-gray-400 text-sm mb-10">Última actualização: Junho de 2026</p>

        <div className="space-y-8">
          {sections.map(({ title, body }) => (
            <div key={title}>
              <h2 className="text-base font-bold text-[#2A0001] mb-2">{title}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
