"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  FileText, BarChart2, TrendingUp,
  Users, Mic, Building2,
  Laptop, Monitor, RefreshCw,
  FileUser, Compass, MessageSquare,
  GraduationCap, BookOpen, ClipboardList,
  Smartphone, ShoppingCart,
  Palette, Megaphone,
  Globe, Handshake,
  X, CheckCircle2, Clock, MapPin,
  Kanban, ShieldCheck, Puzzle, Video,
  FileSpreadsheet, Braces, Target, Award,
  BookMarked, Sparkles, LayoutTemplate, FileCheck2,
  ListChecks, Bot, Cloud, Camera,
  Newspaper, MapPinned, Presentation, Rocket,
  type LucideIcon,
} from "lucide-react";

type Service = {
  category: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  price: string;
  tags: string[];
  badge?: { label: string; color: string };
  entrega: string;       // ex: "5–7 dias úteis"
  modalidade: string;    // ex: "Presencial ou Remoto"
  inclui: string[];      // o que está incluído
  ganhas: string[];      // o que o cliente ganha / resultados
  internalHref?: string; // se definido, o CTA leva a uma ferramenta interna em vez do formulário de pedido
};

const services: Service[] = [
  {
    category: "Consultoria Estratégica", Icon: FileText, iconBg: "bg-amber-50", iconColor: "text-amber-600",
    title: "Plano de Negócio", desc: "Elaboração de plano de negócio completo, com análise de mercado, projecções financeiras e estratégia de crescimento.",
    price: "A partir de 15.000 MT", tags: ["Presencial","Remoto","PME"], badge: { label: "Popular", color: "bg-amber-100 text-amber-800" },
    entrega: "10–15 dias úteis", modalidade: "Presencial ou Remoto",
    inclui: ["Análise de mercado e concorrência", "Projecções financeiras (3 anos)", "Estratégia de marketing e vendas", "Modelo operacional e estrutura da equipa", "Documento final em PDF e Word"],
    ganhas: ["Plano pronto para apresentar a bancos e investidores", "Clareza sobre a viabilidade do negócio", "Estratégia de crescimento definida", "Maior confiança na tomada de decisões"],
  },
  {
    category: "Consultoria Estratégica", Icon: BarChart2, iconBg: "bg-amber-50", iconColor: "text-amber-600",
    title: "Análise de Mercado", desc: "Estudo aprofundado do mercado moçambicano e regional para decisões estratégicas fundamentadas.",
    price: "A partir de 10.000 MT", tags: ["Remoto","Relatório"],
    entrega: "7–10 dias úteis", modalidade: "Remoto",
    inclui: ["Mapeamento do sector e concorrentes", "Análise de tendências regionais", "Identificação de oportunidades e riscos", "Relatório executivo com recomendações"],
    ganhas: ["Decisões baseadas em dados reais", "Conhecimento do posicionamento competitivo", "Identificação de nichos de oportunidade"],
  },
  {
    category: "Consultoria Estratégica", Icon: TrendingUp, iconBg: "bg-amber-50", iconColor: "text-amber-600",
    title: "Captação de Investimento", desc: "Estruturação de pitch deck, valuation e preparação para apresentação a investidores e parceiros.",
    price: "Sob consulta", tags: ["Presencial","Startups"], badge: { label: "Destaque", color: "bg-purple-100 text-purple-800" },
    entrega: "15–20 dias úteis", modalidade: "Presencial ou Online",
    inclui: ["Pitch deck profissional (10–15 slides)", "Estimativa de valuation", "Preparação e simulação de apresentação", "Estratégia de abordagem a investidores"],
    ganhas: ["Apresentação convincente e profissional", "Maior probabilidade de obter financiamento", "Clareza sobre o valor real do negócio"],
  },
  {
    category: "Consultoria Estratégica", Icon: Kanban, iconBg: "bg-amber-50", iconColor: "text-amber-600",
    title: "Gestão de Projectos", desc: "Planeamento, acompanhamento e execução de projectos com metodologias ágeis adaptadas à tua equipa.",
    price: "A partir de 6.000 MT", tags: ["Remoto","Ágil"],
    entrega: "Contínuo ou por projecto", modalidade: "Remoto",
    inclui: ["Definição de cronograma e marcos", "Ferramenta de gestão configurada (Trello/Asana)", "Reuniões de acompanhamento quinzenais", "Relatório de progresso"],
    ganhas: ["Projectos entregues dentro do prazo", "Equipa organizada e com responsabilidades claras", "Visibilidade total do progresso"],
  },
  {
    category: "Consultoria Estratégica", Icon: ShieldCheck, iconBg: "bg-amber-50", iconColor: "text-amber-600",
    title: "Auditoria & Due Diligence", desc: "Avaliação de riscos e conformidade antes de investimentos, fusões ou parcerias estratégicas.",
    price: "Sob consulta", tags: ["Presencial","Empresarial"],
    entrega: "10–20 dias úteis", modalidade: "Presencial ou Remoto",
    inclui: ["Análise documental e financeira", "Identificação de riscos legais e operacionais", "Relatório de conformidade", "Recomendações de mitigação"],
    ganhas: ["Decisão de investimento informada", "Redução de risco em parcerias", "Conformidade legal garantida"],
  },
  {
    category: "Formação & Palestras", Icon: Users, iconBg: "bg-purple-50", iconColor: "text-purple-600",
    title: "Workshop Empresarial", desc: "Formação prática para equipas de gestão, com metodologias actuais e casos reais do mercado africano.",
    price: "A partir de 8.000 MT", tags: ["Presencial","Grupo"],
    entrega: "Agendado em 5–7 dias", modalidade: "Presencial",
    inclui: ["Sessão de 4 a 8 horas", "Material de apoio impresso/digital", "Exercícios práticos e dinâmicas de grupo", "Certificado de participação"],
    ganhas: ["Equipa mais alinhada e capacitada", "Ferramentas práticas para o dia-a-dia", "Maior produtividade e coesão da equipa"],
  },
  {
    category: "Formação & Palestras", Icon: Mic, iconBg: "bg-purple-50", iconColor: "text-purple-600",
    title: "Palestra Motivacional", desc: "Palestras de impacto para empresas, universidades e eventos corporativos. Temas: liderança, empreendedorismo, lusofonia.",
    price: "Sob consulta", tags: ["Presencial","Online"], badge: { label: "Destaque", color: "bg-purple-100 text-purple-800" },
    entrega: "Agendado conforme disponibilidade", modalidade: "Presencial ou Online",
    inclui: ["Palestra de 45 a 90 minutos", "Sessão de perguntas e respostas", "Apresentação personalizada para o contexto", "Foto/vídeo autorizado para divulgação"],
    ganhas: ["Audiência motivada e inspirada", "Conteúdo relevante e adaptado ao teu público", "Palestrante experiente com presença internacional"],
  },
  {
    category: "Formação & Palestras", Icon: Building2, iconBg: "bg-purple-50", iconColor: "text-purple-600",
    title: "Formação Corporativa", desc: "Programa de formação à medida para empresas que pretendem desenvolver as competências internas das suas equipas.",
    price: "Sob consulta", tags: ["Presencial","Personalizado"],
    entrega: "Programa definido em conjunto", modalidade: "Presencial",
    inclui: ["Diagnóstico de necessidades formativas", "Programa de formação à medida", "Facilitadores especializados", "Relatório de avaliação de impacto"],
    ganhas: ["Equipa com competências actualizadas", "Menor rotatividade e maior satisfação", "ROI mensurável em produtividade"],
  },
  {
    category: "Formação & Palestras", Icon: Puzzle, iconBg: "bg-purple-50", iconColor: "text-purple-600",
    title: "Team Building", desc: "Dinâmicas de grupo para fortalecer a coesão, comunicação e confiança dentro da equipa.",
    price: "A partir de 6.000 MT", tags: ["Presencial","Grupo"],
    entrega: "Agendado em 5–7 dias", modalidade: "Presencial",
    inclui: ["Sessão de meio-dia ou dia inteiro", "Dinâmicas adaptadas ao perfil da equipa", "Facilitador experiente", "Relatório de observações"],
    ganhas: ["Equipa mais unida e colaborativa", "Melhor comunicação interna", "Ambiente de trabalho mais saudável"],
  },
  {
    category: "Formação & Palestras", Icon: Video, iconBg: "bg-purple-50", iconColor: "text-purple-600",
    title: "Formação Online (e-Learning)", desc: "Cursos gravados ou ao vivo, à distância, para equipas dispersas geograficamente.",
    price: "A partir de 5.000 MT", tags: ["Online","Flexível"], badge: { label: "Novo", color: "bg-green-100 text-green-800" },
    entrega: "Conforme módulo escolhido", modalidade: "Online",
    inclui: ["Aulas gravadas ou sessões ao vivo", "Material de apoio digital", "Acesso por 3 meses", "Certificado digital"],
    ganhas: ["Formação flexível, ao ritmo de cada um", "Sem custos de deslocação", "Conteúdo revisitável a qualquer momento"],
  },
  {
    category: "Aulas de Informática", Icon: Laptop, iconBg: "bg-blue-50", iconColor: "text-blue-600",
    title: "Informática para Crianças", desc: "Introdução à tecnologia e programação para crianças dos 6 aos 14 anos. Metodologia lúdica e progressiva.",
    price: "2.500 MT / mês", tags: ["Presencial","Crianças","Turma"], badge: { label: "Novo", color: "bg-green-100 text-green-800" },
    entrega: "Aulas semanais (2x por semana)", modalidade: "Presencial",
    inclui: ["8 aulas por mês", "Material didáctico incluído", "Relatório de progresso mensal", "Certificado de conclusão de nível"],
    ganhas: ["Criança preparada para o mundo digital", "Base em programação e pensamento lógico", "Confiança no uso de tecnologia"],
  },
  {
    category: "Aulas de Informática", Icon: Monitor, iconBg: "bg-blue-50", iconColor: "text-blue-600",
    title: "Informática Básica — Adultos", desc: "Office, internet, email e ferramentas digitais essenciais para o mercado de trabalho actual.",
    price: "3.000 MT / mês", tags: ["Presencial","Adultos"],
    entrega: "Aulas semanais (2x por semana)", modalidade: "Presencial",
    inclui: ["Word, Excel, PowerPoint", "Email e navegação segura na internet", "Google Drive e ferramentas de produtividade", "Certificado de conclusão"],
    ganhas: ["Autonomia digital no trabalho e em casa", "Aumento de empregabilidade", "Confiança no uso de computador e smartphones"],
  },
  {
    category: "Aulas de Informática", Icon: RefreshCw, iconBg: "bg-blue-50", iconColor: "text-blue-600",
    title: "Reciclagem Tecnológica", desc: "Actualização digital para profissionais e empresas: ferramentas cloud, produtividade e segurança digital.",
    price: "4.000 MT / mês", tags: ["Presencial","Remoto","Profissional"],
    entrega: "Aulas semanais (2x por semana)", modalidade: "Presencial ou Remoto",
    inclui: ["Google Workspace / Microsoft 365", "Segurança digital e boas práticas", "Ferramentas de colaboração remota", "Certificado de conclusão"],
    ganhas: ["Equipa actualizada com as melhores ferramentas", "Redução de erros e riscos digitais", "Maior eficiência nos processos diários"],
  },
  {
    category: "Aulas de Informática", Icon: FileSpreadsheet, iconBg: "bg-blue-50", iconColor: "text-blue-600",
    title: "Excel Avançado & Power BI", desc: "Fórmulas avançadas, tabelas dinâmicas e dashboards para análise de dados profissional.",
    price: "3.500 MT / mês", tags: ["Presencial","Remoto","Profissional"],
    entrega: "Aulas semanais (2x por semana)", modalidade: "Presencial ou Remoto",
    inclui: ["Fórmulas avançadas e macros", "Tabelas dinâmicas", "Introdução ao Power BI", "Certificado de conclusão"],
    ganhas: ["Análise de dados mais rápida e precisa", "Relatórios visuais profissionais", "Vantagem competitiva no mercado de trabalho"],
  },
  {
    category: "Aulas de Informática", Icon: Braces, iconBg: "bg-blue-50", iconColor: "text-blue-600",
    title: "Programação para Iniciantes", desc: "Primeiros passos em lógica de programação e desenvolvimento web, sem experiência prévia.",
    price: "3.000 MT / mês", tags: ["Presencial","Iniciantes"], badge: { label: "Novo", color: "bg-green-100 text-green-800" },
    entrega: "Aulas semanais (2x por semana)", modalidade: "Presencial ou Remoto",
    inclui: ["Lógica de programação", "HTML, CSS e JavaScript básico", "Projecto prático final", "Certificado de conclusão"],
    ganhas: ["Base sólida para seguir carreira em tecnologia", "Primeiro projecto no portfólio", "Pensamento lógico e resolução de problemas"],
  },
  {
    category: "Desenvolvimento Profissional", Icon: FileUser, iconBg: "bg-sky-50", iconColor: "text-sky-600",
    title: "CV & Candidaturas", desc: "Revisão e criação de CV profissional, carta de motivação e optimização de perfil LinkedIn.",
    price: "1.500 MT", tags: ["Remoto","Individual"], badge: { label: "Rápido", color: "bg-blue-100 text-blue-800" },
    entrega: "2–3 dias úteis", modalidade: "Remoto",
    inclui: ["CV profissional em português e inglês", "Carta de motivação personalizada", "Optimização do perfil LinkedIn", "1 revisão incluída"],
    ganhas: ["CV que se destaca na pilha de candidaturas", "Maior taxa de chamadas para entrevista", "Imagem profissional coerente e moderna"],
  },
  {
    category: "Desenvolvimento Profissional", Icon: Compass, iconBg: "bg-sky-50", iconColor: "text-sky-600",
    title: "Mentoria Individual", desc: "Sessões de mentoria 1:1 para definição de carreira, liderança e crescimento profissional.",
    price: "3.000 MT / sessão", tags: ["Presencial","Online","Individual"], badge: { label: "Popular", color: "bg-amber-100 text-amber-800" },
    entrega: "Sessões de 60–90 minutos", modalidade: "Presencial ou Online",
    inclui: ["Sessão estruturada 1:1", "Plano de acção personalizado", "Recursos e leituras recomendadas", "Follow-up por email após cada sessão"],
    ganhas: ["Clareza sobre o caminho profissional", "Aceleração do crescimento na carreira", "Perspectiva externa e experiente para os teus desafios"],
  },
  {
    category: "Desenvolvimento Profissional", Icon: MessageSquare, iconBg: "bg-sky-50", iconColor: "text-sky-600",
    title: "Preparação para Entrevistas", desc: "Simulações de entrevista, feedback estruturado e estratégias para comunicar valor em processos selectivos.",
    price: "2.000 MT", tags: ["Online","Individual"],
    entrega: "1–2 dias úteis", modalidade: "Online",
    inclui: ["2 simulações de entrevista", "Feedback detalhado por escrito", "Guia de respostas para perguntas difíceis", "Estratégias de linguagem corporal e comunicação"],
    ganhas: ["Confiança e segurança na entrevista", "Respostas preparadas e impactantes", "Maior probabilidade de ser seleccionado"],
  },
  {
    category: "Desenvolvimento Profissional", Icon: Target, iconBg: "bg-sky-50", iconColor: "text-sky-600",
    title: "Plano de Carreira", desc: "Mapeamento de objectivos profissionais a curto, médio e longo prazo, com passos concretos.",
    price: "2.500 MT", tags: ["Online","Individual"],
    entrega: "3–5 dias úteis", modalidade: "Online",
    inclui: ["Diagnóstico de competências actuais", "Definição de objectivos SMART", "Plano de acção a 12 meses", "Sessão de acompanhamento"],
    ganhas: ["Direcção clara para a carreira", "Passos concretos e mensuráveis", "Maior motivação e foco"],
  },
  {
    category: "Desenvolvimento Profissional", Icon: Award, iconBg: "bg-sky-50", iconColor: "text-sky-600",
    title: "Coaching de Liderança", desc: "Desenvolvimento de competências de liderança para quem gere equipas ou aspira a cargos de gestão.",
    price: "3.500 MT / sessão", tags: ["Online","Individual"],
    entrega: "Sessões de 60 minutos", modalidade: "Online",
    inclui: ["Sessões estruturadas 1:1", "Avaliação de estilo de liderança", "Plano de desenvolvimento pessoal", "Recursos de leitura recomendados"],
    ganhas: ["Liderança mais eficaz e confiante", "Melhor gestão de equipas e conflitos", "Reconhecimento profissional"],
  },
  {
    category: "Monografias & Académico", Icon: Sparkles, iconBg: "bg-orange-50", iconColor: "text-orange-600",
    title: "Assistente Académico IA", desc: "Gera automaticamente a estrutura completa do teu trabalho académico em Word — capa, índice, formatação e conteúdo desenvolvido por IA, adaptado ao teu nível académico.",
    price: "A partir de 500 MT", tags: ["Online","Instantâneo","IA"], badge: { label: "Principal", color: "bg-orange-500 text-white" },
    entrega: "Imediato", modalidade: "Online — ferramenta interactiva",
    inclui: ["Formulário guiado passo-a-passo", "Capa académica com logótipo (opcional)", "Estrutura 100% configurável por ti", "Formatação automática (Times New Roman, espaçamento, paginação, índice)", "Conteúdo gerado por IA em português europeu"],
    ganhas: ["Documento Word pronto a rever em minutos", "Formatação técnica sem esforço manual", "Base sólida para desenvolver e personalizar"],
    internalHref: "/academico",
  },
  {
    category: "Monografias & Académico", Icon: LayoutTemplate, iconBg: "bg-orange-50", iconColor: "text-orange-600",
    title: "Formatação Académica", desc: "Já tens o texto escrito? Formatamos o teu trabalho segundo as normas exigidas pela tua instituição.",
    price: "A partir de 2.000 MT", tags: ["Remoto","Rápido"],
    entrega: "2–4 dias úteis", modalidade: "Remoto",
    inclui: ["Margens, tipo de letra e espaçamento normalizados", "Paginação e índice automático", "Capa e folha de rosto académicas", "Cabeçalhos e rodapés"],
    ganhas: ["Trabalho com aspecto profissional", "Conformidade com as normas da instituição", "Tempo poupado em formatação manual"],
    internalHref: "/academico/ferramentas",
  },
  {
    category: "Monografias & Académico", Icon: FileCheck2, iconBg: "bg-orange-50", iconColor: "text-orange-600",
    title: "Revisão Científica", desc: "Revisão linguística, gramatical e de coerência científica do teu trabalho já escrito.",
    price: "A partir de 3.000 MT", tags: ["Remoto","Licenciatura","Mestrado"],
    entrega: "3–6 dias úteis", modalidade: "Remoto",
    inclui: ["Correcção gramatical e ortográfica", "Revisão de coerência e coesão textual", "Verificação de terminologia científica", "Comentários e sugestões de melhoria"],
    ganhas: ["Texto claro, correcto e academicamente sólido", "Maior confiança na apresentação", "Redução de erros antes da entrega"],
    internalHref: "/academico/ferramentas",
  },
  {
    category: "Monografias & Académico", Icon: ListChecks, iconBg: "bg-orange-50", iconColor: "text-orange-600",
    title: "Normalização APA / Vancouver / Harvard", desc: "Formatação de citações e referências bibliográficas segundo a norma exigida pelo teu curso.",
    price: "A partir de 1.500 MT", tags: ["Remoto","Rápido"],
    entrega: "1–3 dias úteis", modalidade: "Remoto",
    inclui: ["Formatação de citações no texto", "Lista de referências normalizada", "Verificação de consistência", "Norma à escolha (APA, Vancouver ou Harvard)"],
    ganhas: ["Referências correctas e consistentes", "Conformidade com a norma exigida", "Menos pontos perdidos por formatação"],
    internalHref: "/academico/ferramentas",
  },
  {
    category: "Monografias & Académico", Icon: Compass, iconBg: "bg-orange-50", iconColor: "text-orange-600",
    title: "Orientação de Monografias", desc: "Acompanhamento próximo e contínuo, sessão a sessão, do início à defesa da tua monografia.",
    price: "A partir de 4.000 MT / mês", tags: ["Remoto","Contínuo"],
    entrega: "Acompanhamento mensal", modalidade: "Remoto",
    inclui: ["Sessões semanais ou quinzenais", "Acompanhamento da escrita capítulo a capítulo", "Apoio na preparação da defesa", "Disponibilidade para dúvidas entre sessões"],
    ganhas: ["Acompanhamento humano constante", "Menos ansiedade ao longo do processo", "Maior probabilidade de aprovação"],
  },
  {
    category: "Monografias & Académico", Icon: GraduationCap, iconBg: "bg-orange-50", iconColor: "text-orange-600",
    title: "Apoio a Monografias", desc: "Orientação metodológica, revisão estrutural e apoio na elaboração de monografias de licenciatura.",
    price: "A partir de 5.000 MT", tags: ["Remoto","Licenciatura"], badge: { label: "Popular", color: "bg-amber-100 text-amber-800" },
    entrega: "Conforme prazo do aluno", modalidade: "Remoto",
    inclui: ["Definição do tema e problemática", "Revisão da estrutura e metodologia", "Revisão de capítulos (até 3 rondas)", "Formatação final (APA/ABNT)"],
    ganhas: ["Monografia aprovada com qualidade", "Compreensão real da metodologia científica", "Redução do stress académico"],
  },
  {
    category: "Monografias & Académico", Icon: BookOpen, iconBg: "bg-orange-50", iconColor: "text-orange-600",
    title: "Dissertações de Mestrado", desc: "Acompanhamento completo: proposta, revisão de literatura, metodologia e preparação para defesa.",
    price: "A partir de 12.000 MT", tags: ["Remoto","Mestrado"],
    entrega: "Conforme cronograma académico", modalidade: "Remoto",
    inclui: ["Proposta de investigação", "Revisão de literatura sistematizada", "Orientação metodológica completa", "Preparação e simulação de defesa"],
    ganhas: ["Dissertação sólida e academicamente rigorosa", "Preparação completa para a defesa pública", "Grau de Mestre com confiança"],
  },
  {
    category: "Monografias & Académico", Icon: ClipboardList, iconBg: "bg-orange-50", iconColor: "text-orange-600",
    title: "Relatórios Técnicos", desc: "Elaboração e revisão de relatórios técnicos e científicos para empresas e instituições.",
    price: "Sob consulta", tags: ["Remoto","Empresarial"],
    entrega: "5–10 dias úteis", modalidade: "Remoto",
    inclui: ["Estruturação e escrita do relatório", "Revisão técnica e linguística", "Gráficos e tabelas incluídos", "Entrega em PDF e Word"],
    ganhas: ["Relatório profissional e credível", "Comunicação clara de dados complexos", "Documento pronto para submissão ou publicação"],
  },
  {
    category: "Plataformas Digitais", Icon: Smartphone, iconBg: "bg-teal-50", iconColor: "text-teal-600",
    title: "Concepção de App / PWA", desc: "Consultoria e desenvolvimento de aplicações web e móveis para negócios moçambicanos.",
    price: "Sob consulta", tags: ["Remoto","Tech","Startups"], badge: { label: "Novo", color: "bg-green-100 text-green-800" },
    entrega: "Conforme âmbito do projecto", modalidade: "Remoto",
    inclui: ["Levantamento de requisitos", "Protótipo / wireframe", "Desenvolvimento e testes", "Suporte pós-lançamento (30 dias)"],
    ganhas: ["Aplicação funcional e moderna", "Produto digital adaptado ao mercado local", "Presença digital competitiva"],
  },
  {
    category: "Plataformas Digitais", Icon: ShoppingCart, iconBg: "bg-teal-50", iconColor: "text-teal-600",
    title: "E-commerce", desc: "Criação de lojas online com integração de pagamentos locais (M-Pesa, e-Mola).",
    price: "Sob consulta", tags: ["Remoto","M-Pesa","PME"],
    entrega: "15–30 dias úteis", modalidade: "Remoto",
    inclui: ["Loja online completa", "Integração M-Pesa e e-Mola", "Catálogo de produtos", "Painel de gestão de encomendas"],
    ganhas: ["Vendas online 24/7", "Pagamentos locais sem complicações", "Expansão do negócio para o digital"],
  },
  {
    category: "Plataformas Digitais", Icon: Bot, iconBg: "bg-teal-50", iconColor: "text-teal-600",
    title: "Automação & Chatbots", desc: "Chatbots para WhatsApp e website, automatizando respostas e captação de leads 24/7.",
    price: "Sob consulta", tags: ["Remoto","WhatsApp","Automação"], badge: { label: "Novo", color: "bg-green-100 text-green-800" },
    entrega: "10–20 dias úteis", modalidade: "Remoto",
    inclui: ["Chatbot configurado para WhatsApp/website", "Fluxos de conversa personalizados", "Integração com o teu CRM", "Suporte pós-lançamento (30 dias)"],
    ganhas: ["Atendimento 24 horas por dia", "Redução de carga na equipa de suporte", "Mais leads captados automaticamente"],
  },
  {
    category: "Plataformas Digitais", Icon: Cloud, iconBg: "bg-teal-50", iconColor: "text-teal-600",
    title: "Hospedagem & Domínios", desc: "Configuração e gestão de hospedagem, domínio e email profissional para o teu negócio.",
    price: "A partir de 2.000 MT / ano", tags: ["Remoto","Técnico"],
    entrega: "1–3 dias úteis", modalidade: "Remoto",
    inclui: ["Registo e configuração de domínio", "Hospedagem com SSL incluído", "Email profissional (@teudominio.com)", "Suporte técnico contínuo"],
    ganhas: ["Presença online profissional e segura", "Email com o nome da tua marca", "Site sempre disponível"],
  },
  {
    category: "Plataformas Digitais", Icon: Megaphone, iconBg: "bg-teal-50", iconColor: "text-teal-600",
    title: "Gestão de Redes Sociais", desc: "Criação e publicação de conteúdo, resposta a comentários e crescimento das tuas redes sociais.",
    price: "A partir de 4.000 MT / mês", tags: ["Remoto","Social Media"], badge: { label: "Popular", color: "bg-amber-100 text-amber-800" },
    entrega: "Contínuo (mensal)", modalidade: "Remoto",
    inclui: ["Criação de conteúdo (12–16 publicações/mês)", "Gestão de comentários e mensagens", "Relatório mensal de desempenho", "Design gráfico incluído"],
    ganhas: ["Redes sociais activas e consistentes", "Crescimento orgânico de seguidores", "Mais tempo livre para focar no negócio"],
  },
  {
    category: "Comunicação & Marca", Icon: Palette, iconBg: "bg-pink-50", iconColor: "text-pink-600",
    title: "Branding Completo", desc: "Identidade visual, logotipo, paleta de cores, tipografia e manual de marca para empresas.",
    price: "A partir de 8.000 MT", tags: ["Remoto","Design"], badge: { label: "Destaque", color: "bg-purple-100 text-purple-800" },
    entrega: "10–15 dias úteis", modalidade: "Remoto",
    inclui: ["Logotipo em todas as variações", "Paleta de cores e tipografia", "Manual de identidade visual", "Ficheiros editáveis (AI, PNG, PDF)"],
    ganhas: ["Marca profissional e memorável", "Consistência visual em todos os canais", "Confiança e credibilidade junto dos clientes"],
  },
  {
    category: "Comunicação & Marca", Icon: Megaphone, iconBg: "bg-pink-50", iconColor: "text-pink-600",
    title: "Estratégia de Conteúdo", desc: "Plano editorial para redes sociais, blog e email marketing — adaptado ao mercado moçambicano.",
    price: "A partir de 5.000 MT", tags: ["Remoto","Social Media"],
    entrega: "5–7 dias úteis", modalidade: "Remoto",
    inclui: ["Plano editorial mensal", "Calendário de publicações", "Guia de tom e voz da marca", "Templates para redes sociais"],
    ganhas: ["Presença digital consistente e profissional", "Mais engagement com o público-alvo", "Estratégia clara sem improvisar"],
  },
  {
    category: "Comunicação & Marca", Icon: Camera, iconBg: "bg-pink-50", iconColor: "text-pink-600",
    title: "Fotografia Profissional", desc: "Sessões fotográficas para produtos, equipa e eventos empresariais com edição incluída.",
    price: "A partir de 4.000 MT", tags: ["Presencial","Produto"],
    entrega: "3–5 dias úteis (após sessão)", modalidade: "Presencial",
    inclui: ["Sessão fotográfica no local", "Edição profissional das fotos", "Entrega em alta resolução", "Direitos de uso comercial"],
    ganhas: ["Imagens profissionais para marketing", "Maior credibilidade visual da marca", "Conteúdo pronto para redes sociais"],
  },
  {
    category: "Comunicação & Marca", Icon: Newspaper, iconBg: "bg-pink-50", iconColor: "text-pink-600",
    title: "Assessoria de Imprensa", desc: "Gestão de relações com media, comunicados de imprensa e posicionamento público da marca.",
    price: "Sob consulta", tags: ["Remoto","PR"],
    entrega: "Contínuo", modalidade: "Remoto",
    inclui: ["Redacção de comunicados de imprensa", "Contacto com meios de comunicação locais", "Gestão de entrevistas", "Monitorização de menções à marca"],
    ganhas: ["Maior visibilidade mediática", "Reputação pública fortalecida", "Relações duradouras com a imprensa"],
  },
  {
    category: "Comunicação & Marca", Icon: Video, iconBg: "bg-pink-50", iconColor: "text-pink-600",
    title: "Vídeo Institucional", desc: "Produção de vídeos de apresentação da empresa, testemunhos e conteúdo promocional.",
    price: "A partir de 6.000 MT", tags: ["Presencial","Vídeo"],
    entrega: "7–12 dias úteis", modalidade: "Presencial",
    inclui: ["Roteiro e planeamento de gravação", "Filmagem no local", "Edição profissional com motion graphics", "Versões para redes sociais"],
    ganhas: ["Vídeo profissional para o site e redes", "Comunicação mais envolvente da marca", "Conteúdo reutilizável em várias campanhas"],
  },
  {
    category: "Networking Lusófono", Icon: Globe, iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
    title: "Acesso à Rede MZ·PT·ZA", desc: "Integração na rede de parceiros e empresas nos três países. Introductions, eventos e oportunidades.",
    price: "Sob consulta", tags: ["MZ","PT","ZA"],
    entrega: "Processo contínuo", modalidade: "Presencial e Online",
    inclui: ["Introdução a parceiros estratégicos", "Acesso a eventos exclusivos", "Newsletter com oportunidades", "Perfil na rede MUIANGA"],
    ganhas: ["Acesso a mercados que sozinho demoraria anos", "Parcerias que abrem portas reais", "Network lusófono activo e qualificado"],
  },
  {
    category: "Networking Lusófono", Icon: Handshake, iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
    title: "Parcerias Internacionais", desc: "Identificação e facilitação de parcerias entre empresas moçambicanas e parceiros internacionais lusófonos.",
    price: "Sob consulta", tags: ["Internacional","B2B"],
    entrega: "30–60 dias", modalidade: "Remoto e Presencial",
    inclui: ["Mapeamento de parceiros potenciais", "Due diligence básica", "Facilitação de reuniões iniciais", "Apoio na negociação do acordo"],
    ganhas: ["Parceiro internacional validado e alinhado", "Expansão do negócio além-fronteiras", "Processo de parceria seguro e estruturado"],
  },
  {
    category: "Networking Lusófono", Icon: MapPinned, iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
    title: "Missões Empresariais", desc: "Organização de viagens de negócios a Portugal, África do Sul e outros mercados lusófonos.",
    price: "Sob consulta", tags: ["Internacional","Grupo"],
    entrega: "Planeado com 60+ dias de antecedência", modalidade: "Presencial",
    inclui: ["Planeamento de agenda de reuniões", "Logística de viagem e alojamento", "Acompanhamento durante a missão", "Relatório de contactos estabelecidos"],
    ganhas: ["Contactos qualificados em novos mercados", "Experiência estruturada e sem imprevistos", "Oportunidades de negócio reais"],
  },
  {
    category: "Networking Lusófono", Icon: Presentation, iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
    title: "Feiras & Eventos Internacionais", desc: "Representação e apoio na participação em feiras e conferências internacionais lusófonas.",
    price: "Sob consulta", tags: ["Internacional","Eventos"],
    entrega: "Conforme calendário do evento", modalidade: "Presencial",
    inclui: ["Inscrição e preparação do stand/material", "Representação no evento", "Networking activo com participantes", "Relatório pós-evento"],
    ganhas: ["Presença de marca em eventos relevantes", "Novos contactos e parcerias", "Visibilidade internacional"],
  },
  {
    category: "Networking Lusófono", Icon: Rocket, iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
    title: "Consultoria de Expansão Internacional", desc: "Estratégia e apoio prático para expandir o teu negócio para outros mercados lusófonos.",
    price: "Sob consulta", tags: ["Internacional","Estratégia"], badge: { label: "Destaque", color: "bg-purple-100 text-purple-800" },
    entrega: "Conforme âmbito do projecto", modalidade: "Remoto e Presencial",
    inclui: ["Análise de viabilidade do mercado alvo", "Estratégia de entrada", "Apoio em questões legais e fiscais básicas", "Acompanhamento nos primeiros passos"],
    ganhas: ["Expansão estruturada e com menor risco", "Conhecimento local do mercado alvo", "Presença internacional sustentável"],
  },
];

const categories = Array.from(new Set(services.map((s) => s.category)));

export default function ServicosPage() {
  return (
    <Suspense fallback={null}>
      <ServicosContent />
    </Suspense>
  );
}

function ServicosContent() {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [form, setForm] = useState({ nome: "", contacto: "", servico: "", orcamento: "", descricao: "" });
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [detailService, setDetailService] = useState<Service | null>(null);

  // Chegada a partir de um card da homepage: abre o detalhe certo automaticamente
  useEffect(() => {
    const ver = searchParams.get("ver");
    const categoria = searchParams.get("categoria");
    if (ver) {
      const match = services.find((s) => s.title === ver);
      if (match) {
        setDetailService(match);
        setActiveCategory(match.category);
        return;
      }
    }
    if (categoria) {
      const match = categories.find((c) => c === categoria);
      if (match) setActiveCategory(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = activeCategory === "Todos" ? services : services.filter((s) => s.category === activeCategory);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/service-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSubmitted(true);
    setSelected(null);
    setDetailService(null);
  }

  function solicitar(title: string) {
    setSelected(title);
    setDetailService(null);
    setForm((f) => ({ ...f, servico: title }));
    setTimeout(() => document.getElementById("form-pedido")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <div className="bg-white min-h-screen">

      {/* ── MODAL DE DETALHES ── */}
      <AnimatePresence>
      {detailService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDetailService(null)}
          />
          <motion.div
            className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${detailService.iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
                  <detailService.Icon size={22} className={detailService.iconColor} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-0.5">{detailService.category}</p>
                  <h3 className="font-bold text-[#0D0D0D] text-base leading-snug">{detailService.title}</h3>
                </div>
              </div>
              <button onClick={() => setDetailService(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0">
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            {/* Corpo com scroll */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              <p className="text-gray-500 text-sm leading-relaxed">{detailService.desc}</p>

              {/* Preço + meta */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#F8F5EF] rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Preço</p>
                  <p className="text-[#C9A84C] font-bold text-sm leading-tight">{detailService.price}</p>
                </div>
                <div className="bg-[#F8F5EF] rounded-2xl p-3 text-center">
                  <Clock size={13} className="text-gray-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Entrega</p>
                  <p className="text-[#0D0D0D] font-semibold text-xs leading-tight">{detailService.entrega}</p>
                </div>
                <div className="bg-[#F8F5EF] rounded-2xl p-3 text-center">
                  <MapPin size={13} className="text-gray-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Modo</p>
                  <p className="text-[#0D0D0D] font-semibold text-xs leading-tight">{detailService.modalidade}</p>
                </div>
              </div>

              {/* O que está incluído */}
              <div>
                <p className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-3">O que está incluído</p>
                <ul className="space-y-2">
                  {detailService.inclui.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-500">
                      <CheckCircle2 size={15} className="text-[#1D9E75] mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* O que ganhas */}
              <div className="bg-[#0D0D0D] rounded-2xl p-4">
                <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider mb-3">O que vais ganhar</p>
                <ul className="space-y-2">
                  {detailService.ganhas.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                      <span className="text-[#C9A84C] mt-0.5 shrink-0">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {detailService.tags.map((tag) => (
                  <span key={tag} className="badge bg-gray-100 text-gray-500">{tag}</span>
                ))}
              </div>
            </div>

            {/* Footer com CTA */}
            <div className="p-4 border-t border-gray-100 bg-white">
              {detailService.internalHref ? (
                <Link href={detailService.internalHref} className="btn-primary w-full justify-center py-4 text-base rounded-2xl">
                  Começar agora →
                </Link>
              ) : (
                <button onClick={() => solicitar(detailService.title)} className="btn-primary w-full justify-center py-4 text-base rounded-2xl">
                  Solicitar este Serviço →
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <section className="pt-28 sm:pt-32 pb-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#C9A84C]/10 text-[#C9A84C] mb-4">Marketplace de Serviços</span>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#0D0D0D] mb-3">O que podes <span className="text-[#C9A84C]">solicitar</span></h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl leading-relaxed">21 serviços disponíveis — do plano de negócio à palestra motivacional. Clica em qualquer serviço para ver os detalhes completos.</p>
          <div className="flex gap-6 mt-8">
            <div><p className="text-2xl font-bold text-[#C9A84C]">21+</p><p className="text-xs text-gray-400 mt-0.5">Serviços</p></div>
            <div><p className="text-2xl font-bold text-[#C9A84C]">24h</p><p className="text-xs text-gray-400 mt-0.5">Resposta garantida</p></div>
            <div><p className="text-2xl font-bold text-[#C9A84C]">6</p><p className="text-xs text-gray-400 mt-0.5">Países</p></div>
          </div>
        </div>
      </section>

      {/* ── FILTROS ── */}
      <div className="sticky top-16 sm:top-20 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {["Todos", ...categories].map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`text-xs font-semibold whitespace-nowrap px-4 py-2 rounded-xl transition-all duration-200 ${activeCategory === cat ? "bg-[#C9A84C] text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── CARDS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        >
          {filtered.map((service) => {
            const { Icon, iconBg, iconColor, title, desc, price, tags, badge, category } = service;
            return (
              <motion.div
                key={title}
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } } as Variants}
                layout
              >
              <div className="service-card group cursor-pointer h-full" onClick={() => setDetailService(service)}>
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon size={20} className={iconColor} />
                  </div>
                  {badge
                    ? <span className={`badge ${badge.color}`}>{badge.label}</span>
                    : <span className="badge bg-gray-100 text-gray-500 text-[10px]">{category.split(" ")[0]}</span>
                  }
                </div>
                <h3 className="font-bold text-base text-[#0D0D0D] group-hover:text-[#C9A84C] transition-colors leading-snug">{title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed flex-1 line-clamp-2">{desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => <span key={tag} className="badge bg-gray-100 text-gray-500">{tag}</span>)}
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <span className="text-[#C9A84C] font-bold text-sm">{price}</span>
                  <span className="text-xs font-semibold text-[#1D9E75] bg-[#1D9E75]/10 group-hover:bg-[#1D9E75] group-hover:text-white px-3 py-1.5 rounded-full transition-all">
                    Ver detalhes →
                  </span>
                </div>
              </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-10 bg-[#0D0D0D] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <p className="text-white font-bold text-lg sm:text-xl mb-1">Não encontras o que precisas?</p>
            <p className="text-white/40 text-sm">Criamos soluções à medida para o teu negócio.</p>
          </div>
          <button onClick={() => document.getElementById("form-pedido")?.scrollIntoView({ behavior: "smooth" })} className="shrink-0 btn-primary">
            Falar Connosco →
          </button>
        </div>
      </section>

      {/* ── FORMULÁRIO ── */}
      <section id="form-pedido" className="bg-gray-50 border-t border-gray-100 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <span className="badge bg-[#C9A84C]/10 text-[#C9A84C] mb-4 inline-flex">Pedido de Serviço</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0D0D0D] mb-8">
            Solicitar{" "}{selected && <span className="text-[#C9A84C]">{selected}</span>}
          </h2>

          {submitted ? (
            <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/30 rounded-2xl p-8 text-center">
              <p className="text-2xl font-bold text-[#1D9E75] mb-2">Pedido recebido!</p>
              <p className="text-gray-500 text-sm">Entraremos em contacto nas próximas 24 horas.</p>
              <button onClick={() => setSubmitted(false)} className="btn-primary mt-6">Novo Pedido</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              {[
                { name: "nome", label: "Nome completo", type: "text", placeholder: "O seu nome" },
                { name: "contacto", label: "Contacto (telefone ou email)", type: "text", placeholder: "+258 84 000 0000 ou email@exemplo.com" },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <input type={type} required placeholder={placeholder} value={form[name as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Serviço pretendido</label>
                <select required value={form.servico} onChange={(e) => setForm((f) => ({ ...f, servico: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all text-gray-700">
                  <option value="">Seleccionar serviço...</option>
                  {services.map((s) => <option key={s.title} value={s.title}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Orçamento aproximado (MT)</label>
                <input type="text" placeholder="ex: 5.000 MT" value={form.orcamento}
                  onChange={(e) => setForm((f) => ({ ...f, orcamento: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Descrição / contexto</label>
                <textarea rows={4} required placeholder="Descreva brevemente o que precisa..." value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-all placeholder:text-gray-300 resize-none" />
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-4 text-base rounded-xl">Enviar Pedido →</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
