"use client";
import { useState, useRef, useEffect, useLayoutEffect, type ChangeEvent } from "react";
import { authFetch } from "@/lib/auth-fetch";
import {
  FileUser, Camera, Plus, Trash2, ChevronRight, ChevronLeft, ChevronDown,
  Download, Eye, Lightbulb, Upload, Loader2, Globe2, Flag,
  GraduationCap, Briefcase, Wrench, Info, CheckCircle2, X,
  Languages, Car, Award, Users, Mail, Phone, MapPin, Calendar,
  Sparkles,
} from "lucide-react";
import CvAnaliseIA from "@/components/premium/CvAnaliseIA";
import DocumentosGerados from "@/components/premium/DocumentosGerados";
import ImportarCv from "@/components/premium/ImportarCv";
import CvMatchingVaga from "@/components/premium/CvMatchingVaga";
import FotoVersoes from "@/components/premium/FotoVersoes";
import CompraGate from "@/components/premium/CompraGate";
import { useEntitlement } from "@/lib/use-entitlement";
import { useAuthGate } from "@/lib/use-auth-gate";
import AuthModal from "@/components/AuthModal";
import { guardarDocumento } from "@/lib/documentos-client";
import MeusDocumentos from "@/components/premium/MeusDocumentos";
import MarcaDagua from "@/components/premium/MarcaDagua";
import ConversaoATS from "@/components/premium/ConversaoATS";
import TraducaoCv from "@/components/premium/TraducaoCv";
import SimulacaoEntrevista from "@/components/premium/SimulacaoEntrevista";
import { checkPhotoQuality } from "@/lib/photo-enhance";
import { gerarCvDocx, downloadBlob } from "@/lib/export-docx";
import { recomendarModelo } from "@/lib/cv-modelos-recomendacao";

/* ─── Types ─── */
type CvType = "nacional" | null;
type CvModelo = "classico" | "moderno" | "minimalista" | "executivo" | "corporativo" | "elegante" | "ats" | "academico" | "premium" | "criativo";

type CategoriaModelo = "classico" | "corporativo" | "moderno" | "minimalista" | "criativo" | "premium";
type Densidade = "compacta" | "equilibrada" | "espacosa";
type NivelExperiencia = "Júnior" | "Pleno" | "Sénior" | "Todos";

interface PaletaCor {
  nome: string;
  accentColor: string;
  sidebarBg?: string;
  sidebarColor?: string;
}

type EstiloTitulo = "linha" | "linha-fina" | "caixa" | "numerado" | "centrado" | "simples";

interface ModeloConfig {
  id: CvModelo;
  nome: string;
  descricao: string;
  fontFamily: string;
  accentColor: string;
  textColor: string;
  layout: "single" | "sidebar" | "banner";
  sidebarBg?: string;
  sidebarColor?: string;
  densidade: Densidade;
  categoria: CategoriaModelo;
  areaRecomendada: string[];
  nivelExperiencia: NivelExperiencia;
  ats: "Alta" | "Média" | "Baixa";
  justificativa: string;
  paletas: PaletaCor[];
  // Parâmetros estruturais — o que faz cada modelo parecer genuinamente
  // diferente, além de cor/fonte:
  estiloTitulo: EstiloTitulo;
  headerAlign?: "esquerda" | "centrado"; // só "single"
  colunaLateral?: boolean;               // só "single" — corpo em 2 colunas
  sidebarPos?: "esquerda" | "direita";   // só "sidebar"
}

const DENSIDADE_ESCALA: Record<Densidade, { fontBase: string; lineHeight: number; secMargin: string; tituloSize: string }> = {
  compacta:    { fontBase: "9.5pt",  lineHeight: 1.35, secMargin: "4.5mm", tituloSize: "10pt" },
  equilibrada: { fontBase: "10.5pt", lineHeight: 1.5,  secMargin: "6mm",   tituloSize: "11pt" },
  espacosa:    { fontBase: "11pt",   lineHeight: 1.65, secMargin: "7.5mm", tituloSize: "12pt" },
};

const MODELOS: ModeloConfig[] = [
  {
    id: "classico",
    nome: "Clássico",
    descricao: "Serif tradicional, dourado discreto. Ideal para sector público, banca, jurídico.",
    fontFamily: "Georgia, 'Times New Roman', serif",
    accentColor: "#8B6F1E",
    textColor: "#0D0D0D",
    layout: "single",
    densidade: "equilibrada",
    categoria: "classico",
    areaRecomendada: ["Direito", "Administração Pública", "Educação", "Sector Bancário"],
    nivelExperiencia: "Todos",
    ats: "Alta",
    justificativa: "Formato tradicional e sóbrio, o que recrutadores em instituições formais esperam ver primeiro — transmite seriedade sem distrair do conteúdo.",
    paletas: [
      { nome: "Dourado discreto", accentColor: "#8B6F1E" },
      { nome: "Azul corporativo", accentColor: "#1E3A5F" },
      { nome: "Cinza institucional", accentColor: "#44403C" },
    ],
    estiloTitulo: "centrado",
    headerAlign: "centrado",
  },
  {
    id: "moderno",
    nome: "Moderno",
    descricao: "Sans-serif com sidebar escura. Para tecnologia, marketing, design.",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    accentColor: "#C9A84C",
    textColor: "#0D0D0D",
    layout: "sidebar",
    sidebarBg: "#0D0D0D",
    sidebarColor: "#fff",
    densidade: "equilibrada",
    categoria: "moderno",
    areaRecomendada: ["Tecnologia", "Marketing Digital", "Produto", "Startups"],
    nivelExperiencia: "Pleno",
    ats: "Média",
    justificativa: "Sidebar escura cria hierarquia visual imediata, agradando a equipas de recrutamento em ambientes rápidos e orientados a produto.",
    paletas: [
      { nome: "Dourado", accentColor: "#C9A84C", sidebarBg: "#0D0D0D", sidebarColor: "#fff" },
      { nome: "Azul tecnológico", accentColor: "#3B82F6", sidebarBg: "#0F172A", sidebarColor: "#fff" },
      { nome: "Cinza moderno", accentColor: "#94A3B8", sidebarBg: "#1E293B", sidebarColor: "#fff" },
    ],
    estiloTitulo: "linha",
    sidebarPos: "esquerda",
  },
  {
    id: "minimalista",
    nome: "Minimalista",
    descricao: "Sem cores. Só preto sobre branco. Foco no conteúdo, sem distracções.",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    accentColor: "#0D0D0D",
    textColor: "#0D0D0D",
    layout: "single",
    densidade: "compacta",
    categoria: "minimalista",
    areaRecomendada: ["Qualquer área", "Candidaturas online", "Sistemas de triagem automática"],
    nivelExperiencia: "Todos",
    ats: "Alta",
    justificativa: "Sem elementos gráficos a competir com o texto — maximiza a velocidade de leitura de um recrutador que vê dezenas de CVs por dia.",
    paletas: [
      { nome: "Preto sobre branco", accentColor: "#0D0D0D" },
      { nome: "Cinza-chumbo", accentColor: "#374151" },
    ],
    estiloTitulo: "linha-fina",
    headerAlign: "esquerda",
  },
  {
    id: "executivo",
    nome: "Executivo",
    descricao: "Serif com accent azul-marinho. Sector financeiro, consultoria, gestão sénior.",
    fontFamily: "Georgia, 'Times New Roman', serif",
    accentColor: "#1E3A5F",
    textColor: "#0D0D0D",
    layout: "single",
    densidade: "equilibrada",
    categoria: "corporativo",
    areaRecomendada: ["Finanças", "Consultoria", "Gestão", "Auditoria"],
    nivelExperiencia: "Sénior",
    ats: "Alta",
    justificativa: "Azul-marinho é a cor mais associada a confiança e rigor no sector financeiro — comunica maturidade profissional sem exagero visual.",
    paletas: [
      { nome: "Azul-marinho", accentColor: "#1E3A5F" },
      { nome: "Preto executivo", accentColor: "#18181B" },
      { nome: "Dourado discreto", accentColor: "#8B6F1E" },
    ],
    estiloTitulo: "caixa",
    headerAlign: "esquerda",
  },
  {
    id: "corporativo",
    nome: "Corporativo",
    descricao: "Sidebar em grafite, sans-serif firme. Grandes empresas, multinacionais, gestão.",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    accentColor: "#0EA5E9",
    textColor: "#0D0D0D",
    layout: "sidebar",
    sidebarBg: "#1F2937",
    sidebarColor: "#fff",
    densidade: "equilibrada",
    categoria: "corporativo",
    areaRecomendada: ["Multinacionais", "Recursos Humanos", "Operações", "Gestão de Projectos"],
    nivelExperiencia: "Pleno",
    ats: "Média",
    justificativa: "Estrutura em sidebar organiza dados de contacto e competências de forma imediata — facilita triagem rápida em processos com muitos candidatos.",
    paletas: [
      { nome: "Azul corporativo", accentColor: "#0EA5E9", sidebarBg: "#1F2937", sidebarColor: "#fff" },
      { nome: "Cinza-grafite", accentColor: "#9CA3AF", sidebarBg: "#111827", sidebarColor: "#fff" },
      { nome: "Verde institucional", accentColor: "#059669", sidebarBg: "#1F2937", sidebarColor: "#fff" },
    ],
    estiloTitulo: "caixa",
    sidebarPos: "direita",
  },
  {
    id: "elegante",
    nome: "Elegante",
    descricao: "Serif requintado, accent bordô. Cargos de topo, direcção, relações institucionais.",
    fontFamily: "Georgia, 'Times New Roman', serif",
    accentColor: "#7C2D3E",
    textColor: "#0D0D0D",
    layout: "single",
    densidade: "espacosa",
    categoria: "corporativo",
    areaRecomendada: ["Direcção Geral", "Relações Institucionais", "Diplomacia", "Relações Públicas"],
    nivelExperiencia: "Sénior",
    ats: "Alta",
    justificativa: "Espaçamento generoso e tom bordô transmitem requinte sem soar informal — adequado a quem representa uma instituição perante terceiros.",
    paletas: [
      { nome: "Bordô", accentColor: "#7C2D3E" },
      { nome: "Verde-garrafa", accentColor: "#14532D" },
      { nome: "Azul-petróleo", accentColor: "#155E63" },
    ],
    estiloTitulo: "linha",
    headerAlign: "esquerda",
    colunaLateral: true,
  },
  {
    id: "ats",
    nome: "ATS Friendly",
    descricao: "Preto e branco puro, sem ícones/cores. Máxima leitura por sistemas ATS automáticos.",
    fontFamily: "Arial, Helvetica, sans-serif",
    accentColor: "#000000",
    textColor: "#000000",
    layout: "single",
    densidade: "compacta",
    categoria: "minimalista",
    areaRecomendada: ["Candidaturas a grandes empresas", "Vagas com triagem automática"],
    nivelExperiencia: "Todos",
    ats: "Alta",
    justificativa: "Zero elementos gráficos — o formato que sistemas automáticos de triagem (ATS) conseguem ler sem erros de interpretação.",
    paletas: [
      { nome: "Preto e branco", accentColor: "#000000" },
    ],
    estiloTitulo: "simples",
    headerAlign: "esquerda",
  },
  {
    id: "academico",
    nome: "Académico",
    descricao: "Serif verde-escuro, foco em publicações e formação. Docência, investigação, bolsas.",
    fontFamily: "Georgia, 'Times New Roman', serif",
    accentColor: "#14532D",
    textColor: "#0D0D0D",
    layout: "single",
    densidade: "compacta",
    categoria: "classico",
    areaRecomendada: ["Docência", "Investigação", "Bolsas de Estudo", "Organizações Académicas"],
    nivelExperiencia: "Todos",
    ats: "Alta",
    justificativa: "Densidade mais compacta acomoda historiais longos de formação e publicações sem perder legibilidade — comum em perfis académicos.",
    paletas: [
      { nome: "Verde-escuro", accentColor: "#14532D" },
      { nome: "Azul-marinho", accentColor: "#1E3A5F" },
    ],
    estiloTitulo: "numerado",
    headerAlign: "esquerda",
  },
  {
    id: "premium",
    nome: "Premium",
    descricao: "Sidebar preta com dourado intenso. Alta direcção, consultoria de elite.",
    fontFamily: "Georgia, 'Times New Roman', serif",
    accentColor: "#D4AF37",
    textColor: "#0D0D0D",
    layout: "sidebar",
    sidebarBg: "#0A0A0A",
    sidebarColor: "#D4AF37",
    densidade: "espacosa",
    categoria: "premium",
    areaRecomendada: ["Alta Direcção", "C-Level", "Consultoria de Elite", "Conselhos de Administração"],
    nivelExperiencia: "Sénior",
    ats: "Baixa",
    justificativa: "Recomendado para profissionais com experiência de liderança porque transmite autoridade, organização e maturidade profissional.",
    paletas: [
      { nome: "Preto e dourado", accentColor: "#D4AF37", sidebarBg: "#0A0A0A", sidebarColor: "#D4AF37" },
      { nome: "Grafite e prata", accentColor: "#CBD5E1", sidebarBg: "#18181B", sidebarColor: "#E5E7EB" },
    ],
    estiloTitulo: "linha",
    sidebarPos: "esquerda",
  },
  {
    id: "criativo",
    nome: "Criativo",
    descricao: "Faixa colorida no topo, tags de competências. Design, comunicação, moda, música, artes.",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    accentColor: "#7C3AED",
    textColor: "#18181B",
    layout: "banner",
    densidade: "espacosa",
    categoria: "criativo",
    areaRecomendada: ["Design", "Comunicação", "Marketing Criativo", "Moda", "Música", "Artes"],
    nivelExperiencia: "Todos",
    ats: "Baixa",
    justificativa: "Faixa de destaque e tags visuais demonstram sensibilidade estética logo na primeira impressão — relevante em áreas onde o portfólio visual pesa tanto quanto o texto.",
    paletas: [
      { nome: "Roxo", accentColor: "#7C3AED" },
      { nome: "Verde-esmeralda", accentColor: "#059669" },
      { nome: "Petróleo e coral", accentColor: "#0F766E" },
    ],
    estiloTitulo: "linha",
  },
];

interface Formacao {
  instituicao: string; curso: string; grau: string;
  anoInicio: string; anoFim: string; descricao: string;
}
interface Experiencia {
  empresa: string; cargo: string; local: string;
  dataInicio: string; dataFim: string; actualmente: boolean; descricao: string;
}
interface Lingua {
  lingua: string; nivel: string;
}
interface Referencia {
  nome: string; cargo: string; empresa: string; telefone: string; email: string;
}
interface CvData {
  // Personal
  foto: string | null; fotoOriginal: string | null; fotoProcessada: string | null;
  nome: string; titulo: string;
  dataNascimento: string; nacionalidade: string; localNascimento: string;
  estadoCivil: string; genero: string; biDire: string; nuit: string;
  telefone: string; telefone2: string; email: string;
  endereco: string; cidade: string; provincia: string;
  linkedin: string; website: string; github: string;
  objectivo: string;
  // Education
  formacao: Formacao[];
  // Experience
  experiencia: Experiencia[];
  // Skills
  competenciasTecnicas: string[];
  competenciasInformaticas: string[];
  linguaMaterna: string;
  linguas: Lingua[];
  // Nacional extras
  referencias: Referencia[];
  cartaConducao: string;
  actividadesExtra: string;
}

const emptyCv: CvData = {
  foto: null, fotoOriginal: null, fotoProcessada: null,
  nome: "", titulo: "",
  dataNascimento: "", nacionalidade: "Moçambicana", localNascimento: "",
  estadoCivil: "", genero: "", biDire: "", nuit: "",
  telefone: "", telefone2: "", email: "",
  endereco: "", cidade: "Maputo", provincia: "Maputo",
  linkedin: "", website: "", github: "",
  objectivo: "",
  formacao: [],
  experiencia: [],
  competenciasTecnicas: [],
  competenciasInformaticas: [],
  linguaMaterna: "Português",
  linguas: [],
  referencias: [],
  cartaConducao: "",
  actividadesExtra: "",
};

const emptyFormacao: Formacao = { instituicao: "", curso: "", grau: "Licenciatura", anoInicio: "", anoFim: "", descricao: "" };
const emptyExperiencia: Experiencia = { empresa: "", cargo: "", local: "", dataInicio: "", dataFim: "", actualmente: false, descricao: "" };
const emptyLinguaNacional: Lingua = { lingua: "", nivel: "Intermédio" };
const emptyReferencia: Referencia = { nome: "", cargo: "", empresa: "", telefone: "", email: "" };

const graus = ["Ensino Secundário", "Técnico Médio", "Técnico Superior", "Licenciatura", "Mestrado", "Doutoramento", "Pós-Graduação", "Outro"];
const niveisNacional = ["Básico", "Intermédio", "Avançado", "Fluente"];

const stepsNacional = ["Dados Pessoais", "Formação", "Experiência", "Competências", "Info Adicional", "Pré-visualização"];

/* ─── Tip Component ─── */
function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
      <Lightbulb className="w-4 h-4 text-[#D20001] mt-0.5 shrink-0" />
      <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "Georgia, serif",
      fontSize: "11pt",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "2px",
      color: "#0D0D0D",
      borderBottom: "0.5pt solid #D20001",
      paddingBottom: "1.5mm",
      marginBottom: "3.5mm",
      marginTop: 0,
    }}>{children}</h2>
  );
}

function ThemedSectionTitle({ children, accent, font, size = "11pt", estilo = "linha", numero }: {
  children: React.ReactNode; accent: string; font: string; size?: string; estilo?: EstiloTitulo; numero?: number;
}) {
  const base: React.CSSProperties = {
    fontFamily: font,
    fontSize: size,
    fontWeight: 700,
    color: "#0D0D0D",
    marginTop: 0,
    overflowWrap: "break-word",
  };

  if (estilo === "caixa") {
    return (
      <h2 style={{
        ...base,
        display: "inline-block",
        color: "#fff",
        background: accent,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        padding: "1.5mm 4mm",
        borderRadius: "1.5mm",
        marginBottom: "4mm",
      }}>{children}</h2>
    );
  }
  if (estilo === "numerado") {
    return (
      <h2 style={{ ...base, display: "flex", alignItems: "baseline", gap: "3mm", marginBottom: "3.5mm" }}>
        <span style={{ color: accent, fontWeight: 700, fontSize: "1.15em" }}>{String(numero ?? 1).padStart(2, "0")}</span>
        <span style={{ textTransform: "uppercase", letterSpacing: "1.5px" }}>{children}</span>
      </h2>
    );
  }
  if (estilo === "centrado") {
    return (
      <h2 style={{
        ...base,
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: "3.5px",
        fontWeight: 600,
        borderTop: `0.5pt solid ${accent}`,
        borderBottom: `0.5pt solid ${accent}`,
        padding: "1.5mm 0",
        marginBottom: "4mm",
      }}>{children}</h2>
    );
  }
  if (estilo === "simples") {
    return (
      <h2 style={{ ...base, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2.5mm" }}>{children}</h2>
    );
  }
  if (estilo === "linha-fina") {
    return (
      <h2 style={{
        ...base,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "3px",
        borderBottom: "0.25pt solid #ccc",
        paddingBottom: "2mm",
        marginBottom: "4.5mm",
      }}>{children}</h2>
    );
  }
  // "linha" — estilo por omissão
  return (
    <h2 style={{
      ...base,
      textTransform: "uppercase",
      letterSpacing: "2.5px",
      borderBottom: `0.5pt solid ${accent}`,
      paddingBottom: "1.5mm",
      marginBottom: "3.5mm",
    }}>{children}</h2>
  );
}

function Card({ children, title, icon: Icon }: { children: React.ReactNode; title: string; icon: React.ElementType }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#D20001]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#D20001]" />
        </div>
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Ferramenta({ children, title, desc, icon: Icon, open, onToggle }: {
  children: React.ReactNode; title: string; desc: string; icon: React.ElementType;
  open: boolean; onToggle: () => void;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden print:hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-9 h-9 rounded-xl bg-[#D20001]/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#D20001]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#2A0001]">{title}</h3>
          <p className="text-[11px] text-gray-400 truncate">{desc}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function AiTextarea({ value, onChange, contexto, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; contexto: string; placeholder?: string; rows?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [original, setOriginal] = useState<string | null>(null);
  const { withAuth, showAuth, onAuthSuccess, onAuthClose } = useAuthGate();

  // Melhorar com IA é livre e imediato — a cobrança acontece no download do
  // CV final (que já inclui o texto melhorado), não em cada acção intermédia.
  async function melhorar() {
    if (!value.trim()) return;
    setLoading(true);
    setOriginal(value);
    try {
      const res = await authFetch("/api/melhorar-texto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: value, contexto }),
      });
      if (res.ok) {
        const { texto } = await res.json();
        if (texto) onChange(texto);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <div className="space-y-1.5">
      <textarea
        value={value}
        onChange={e => { onChange(e.target.value); setOriginal(null); }}
        placeholder={placeholder}
        rows={rows}
        className="input-field resize-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => withAuth(melhorar)}
          disabled={loading || !value.trim()}
          className="flex items-center gap-1.5 text-xs font-bold disabled:opacity-40 px-4 py-2 rounded-xl transition-all active:scale-95"
          style={{
            background: loading ? "#FFE3E3" : "linear-gradient(135deg, #D20001 0%, #ED1D1D 50%, #FFD6D6 100%)",
            color: loading ? "#D20001" : "#fff",
            boxShadow: loading ? "none" : "0 2px 8px rgba(210,0,1,0.3)",
          }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          )}
          {loading ? "A optimizar..." : "Optimizar"}
        </button>
        {original && (
          <button
            type="button"
            onClick={() => { onChange(original); setOriginal(null); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
          >
            Desfazer
          </button>
        )}
      </div>
      {showAuth && <AuthModal onClose={onAuthClose} onSuccess={onAuthSuccess} />}
    </div>
  );
}

/* ─── Main Component ─── */
export default function CurriculumPage() {
  const [cvType, setCvType] = useState<CvType>(null);
  const [cvModelo, setCvModelo] = useState<CvModelo>("classico");
  const [corCustom, setCorCustom] = useState<string | null>(null);
  const [modeloEscolhidoManualmente, setModeloEscolhidoManualmente] = useState(false);
  const [sugestaoIgnorada, setSugestaoIgnorada] = useState(false);
  const [infoModeloAberto, setInfoModeloAberto] = useState<CvModelo | null>(null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CvData>({ ...emptyCv });
  const [removingBg, setRemovingBg] = useState(false);
  const [fotoQualidadeAviso, setFotoQualidadeAviso] = useState<string | null>(null);
  const [newCompTecnica, setNewCompTecnica] = useState("");
  const [newCompInfo, setNewCompInfo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const scrollPosRef = useRef(0);
  const compraGateRef = useRef<HTMLDivElement>(null);
  const criarCvEnt = useEntitlement("criar-cv-ia");
  const { withAuth: withAuthCv, showAuth: showAuthCv, onAuthSuccess: onAuthSuccessCv, onAuthClose: onAuthCloseCv } = useAuthGate();
  const [compraPendenteCv, setCompraPendenteCv] = useState(false);
  const [ferramentaAberta, setFerramentaAberta] = useState<string | null>(null);
  const toggleFerramenta = (id: string) => setFerramentaAberta(prev => prev === id ? null : id);

  // Preserve scroll position on re-renders
  useLayoutEffect(() => {
    scrollPosRef.current = window.scrollY;
  });

  useLayoutEffect(() => {
    const timer = requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosRef.current);
    });
    return () => cancelAnimationFrame(timer);
  }, [data, step]);

  // O botão de descarregar pode estar longe do bloco de compra (que fica perto
  // do selector de modelo) — sem isto, clicar em "Descarregar" lá em baixo não
  // dá reacção visível nenhuma, porque o bloco aparece fora do ecrã lá em cima.
  useEffect(() => {
    if (compraPendenteCv) {
      compraGateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [compraPendenteCv]);

  const steps = stepsNacional;
  const totalSteps = steps.length;

  /* helpers */
  const set = <K extends keyof CvData>(key: K, val: CvData[K]) =>
    setData(prev => ({ ...prev, [key]: val }));

  const updateFormacao = (i: number, field: keyof Formacao, val: string) =>
    set("formacao", data.formacao.map((f, idx) => idx === i ? { ...f, [field]: val } : f));

  const updateExperiencia = (i: number, field: keyof Experiencia, val: string | boolean) =>
    set("experiencia", data.experiencia.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  const updateLingua = (i: number, field: keyof Lingua, val: string) =>
    set("linguas", data.linguas.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const updateReferencia = (i: number, field: keyof Referencia, val: string) =>
    set("referencias", data.referencias.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  /* Photo */
  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    checkPhotoQuality(file).then(({ warning }) => setFotoQualidadeAviso(warning));
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      set("foto", url);
      set("fotoOriginal", url);
      set("fotoProcessada", null);
    };
    reader.readAsDataURL(file);
  };

  const removeBg = async () => {
    if (!data.fotoOriginal) return;
    setRemovingBg(true);
    try {
      const blob = await fetch(data.fotoOriginal).then(r => r.blob());
      const fd = new FormData();
      // Nome com a extensão real (o servidor valida por MIME, mas mantém consistência)
      const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
      fd.append("image", blob, `photo.${ext}`);
      const res = await authFetch("/api/remove-bg", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.image) throw new Error(json.error || "Erro ao remover fundo.");
      set("fotoProcessada", json.image);
      set("foto", json.image);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao remover o fundo. Tenta novamente.");
    } finally {
      setRemovingBg(false);
    }
  };

  const applyBgColor = (color: string) => {
    if (!data.fotoProcessada) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const result = canvas.toDataURL("image/png");
      set("foto", result);
    };
    img.src = data.fotoProcessada;
  };

  const handlePrint = () => {
    if (criarCvEnt.checking) return;
    if (!criarCvEnt.unlocked) { setCompraPendenteCv(true); return; }
    window.print();
  };

  const [gerandoDocx, setGerandoDocx] = useState(false);
  const handleDownloadWord = async () => {
    if (criarCvEnt.checking) return;
    if (!criarCvEnt.unlocked) { setCompraPendenteCv(true); return; }
    setGerandoDocx(true);
    try {
      const accentHex = coresActuais.accentColor.replace("#", "");
      const blob = await gerarCvDocx(data, accentHex);
      const nomeFicheiro = `CV_${(data.nome || "curriculo").replace(/\s+/g, "_")}.docx`;
      downloadBlob(blob, nomeFicheiro);
      guardarDocumento("cv", nomeFicheiro, blob);
    } catch {
      alert("Erro ao gerar o ficheiro Word. Tenta novamente.");
    } finally {
      setGerandoDocx(false);
    }
  };

  /* ─── IMPORT MERGE ─── */
  function handleImported(extraido: Record<string, unknown>) {
    setData(prev => {
      const next = { ...prev };
      const strFields: (keyof CvData)[] = ["nome", "titulo", "telefone", "email", "endereco", "cidade", "linkedin", "objectivo"];
      strFields.forEach(f => {
        const v = extraido[f as string];
        if (typeof v === "string" && v.trim()) (next[f] as string) = v;
      });
      if (Array.isArray(extraido.formacao) && extraido.formacao.length) {
        next.formacao = (extraido.formacao as Partial<Formacao>[]).map(f => ({ ...emptyFormacao, ...f }));
      }
      if (Array.isArray(extraido.experiencia) && extraido.experiencia.length) {
        next.experiencia = (extraido.experiencia as Partial<Experiencia>[]).map(e => ({ ...emptyExperiencia, ...e }));
      }
      if (Array.isArray(extraido.competenciasTecnicas) && extraido.competenciasTecnicas.length) {
        next.competenciasTecnicas = extraido.competenciasTecnicas as string[];
      }
      if (Array.isArray(extraido.competenciasInformaticas) && extraido.competenciasInformaticas.length) {
        next.competenciasInformaticas = extraido.competenciasInformaticas as string[];
      }
      if (Array.isArray(extraido.linguas) && extraido.linguas.length) {
        next.linguas = (extraido.linguas as Partial<Lingua>[]).map(l => ({ ...emptyLinguaNacional, ...l }));
      }
      return next;
    });
    setCvType("nacional");
    setStep(0);
  }

  /* ─── TYPE SELECTION ─── */
  if (!cvType) {
    return (
      <main className="min-h-screen bg-gray-50 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D20001]/10 text-[#D20001] text-xs font-semibold mb-6">
            <FileUser className="w-4 h-4" /> CRIADOR DE CV
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#2A0001] mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Um CV melhor dá mais chances de aceitação
          </h1>
          <p className="text-gray-500 mb-3 max-w-xl mx-auto">
            É por isso que a MUIANGA existe: aqui não encontras só vagas, crias, melhoras e adaptas o teu CV para te destacares na candidatura. Experimenta grátis; por <span className="font-semibold text-[#2A0001]">59 MT</span> desbloqueias o download e todas as ferramentas de IA por 8 horas.
          </p>
          <p className="text-gray-300 text-xs mb-8 max-w-xl mx-auto">
            Motor: MUIANGA IA, sistema dedicado a carreiras, desenvolvido por Fredson Muianga.
          </p>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            Preenche os dados em minutos e sai com um CV pronto a enviar, no formato que os recrutadores em Moçambique esperam ver.
          </p>

          <div className="max-w-md mx-auto mb-10">
            <ImportarCv onImported={handleImported} />
          </div>

          <div className="max-w-md mx-auto">
            <button
              onClick={() => setCvType("nacional")}
              className="group w-full bg-white rounded-2xl border border-gray-100 p-8 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#D20001]/30"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#D20001]/10 flex items-center justify-center mb-4 group-hover:bg-[#D20001]/20 transition-colors">
                <Flag className="w-7 h-7 text-[#D20001]" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Criar o meu CV</h3>
              <p className="text-sm text-gray-500 mb-4">
                Formato que os recrutadores em Moçambique esperam ver, ideal para candidaturas em empresas nacionais, ONGs e instituições públicas.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="badge bg-emerald-50 text-emerald-700">Foto</span>
                <span className="badge bg-emerald-50 text-emerald-700">Referências</span>
                <span className="badge bg-emerald-50 text-emerald-700">BI/DIRE</span>
                <span className="badge bg-emerald-50 text-emerald-700">Estado Civil</span>
              </div>
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ─── STEP INDICATOR ─── */
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1 mb-8 print:hidden">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <button
            onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              i === step
                ? "bg-[#D20001] text-white"
                : i < step
                ? "bg-[#D20001]/10 text-[#D20001]"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
            <span className="hidden sm:inline">{s}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
          {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300" />}
        </div>
      ))}
    </div>
  );

  /* ─── NAV BUTTONS ─── */
  const NavButtons = () => (
    <div className="flex items-center justify-between mt-8 print:hidden">
      <button
        onClick={() => step === 0 ? setCvType(null) : setStep(step - 1)}
        className="btn-ghost text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        {step === 0 ? "Voltar" : "Anterior"}
      </button>
      {step < totalSteps - 1 && (
        <button onClick={() => setStep(step + 1)} className="btn-primary text-sm">
          Próximo <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  /* Card is defined outside — see top of file */

  /* ─── STEP 0: DADOS PESSOAIS ─── */
  const stepDadosPessoais = (
    <Card title="Dados Pessoais e Foto" icon={FileUser}>
      {/* Photo upload */}
      <div className="mb-6">
        <label className="label-xs mb-2">Fotografia</label>
        <div className="flex items-start gap-4">
          <div className="w-28 h-36 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
            {data.foto ? (
              <img src={data.foto} alt="Foto" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-gray-300" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            {/* Sem capture=""  → abre o selector nativo (galeria + ficheiros) */}
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            {/* Com capture="user" → abre a câmara directamente (selfie) */}
            <input ref={cameraRef} type="file" accept="image/*" capture="user" onChange={handlePhoto} className="hidden" />
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs py-2 px-4">
                <Upload className="w-3.5 h-3.5" /> Carregar foto
              </button>
              <button onClick={() => cameraRef.current?.click()} className="btn-ghost text-xs py-2 px-4">
                <Camera className="w-3.5 h-3.5" /> Tirar foto
              </button>
            </div>
            {data.fotoOriginal && (
              <button onClick={() => withAuthCv(removeBg)} disabled={removingBg} className="btn-primary text-xs py-2 px-4 disabled:opacity-50">
                {removingBg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                {removingBg ? "A processar..." : "Remover fundo"}
              </button>
            )}
            {data.fotoProcessada && data.fotoOriginal && (
              <div className="space-y-2 mt-1">
                <div className="flex gap-2">
                  <button
                    onClick={() => set("foto", data.fotoOriginal)}
                    className={`text-xs px-3 py-1 rounded-lg border transition-all ${data.foto === data.fotoOriginal ? "border-[#D20001] bg-[#D20001]/10 text-[#D20001]" : "border-gray-200 text-gray-500"}`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => set("foto", data.fotoProcessada)}
                    className={`text-xs px-3 py-1 rounded-lg border transition-all ${data.foto === data.fotoProcessada ? "border-[#D20001] bg-[#D20001]/10 text-[#D20001]" : "border-gray-200 text-gray-500"}`}
                  >
                    Transparente
                  </button>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block mb-1.5">Cor de fundo:</span>
                  <div className="flex flex-wrap gap-1.5">
                  {[
                    { color: "#FFFFFF", label: "Branco" },
                    { color: "#E5E7EB", label: "Cinza claro" },
                    { color: "#9CA3AF", label: "Cinza médio" },
                    { color: "#DBEAFE", label: "Azul claro" },
                    { color: "#1E3A8A", label: "Azul marinho" },
                    { color: "#D1FAE5", label: "Verde claro" },
                    { color: "#065F46", label: "Verde escuro" },
                    { color: "#FEE2E2", label: "Rosa claro" },
                    { color: "#C9A84C", label: "Dourado" },
                    { color: "#0D0D0D", label: "Preto" },
                  ].map(({ color, label }) => (
                    <button key={color} onClick={() => applyBgColor(color)} title={label}
                      className="w-7 h-7 rounded-full border-2 border-gray-200 hover:border-[#D20001] transition-all hover:scale-110"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  </div>
                </div>
                <FotoVersoes
                  fotoProcessada={data.fotoProcessada}
                  qualidadeAviso={fotoQualidadeAviso}
                  onSelect={(url) => set("foto", url)}
                />
              </div>
            )}
            {data.foto && (
              <button onClick={() => { set("foto", null); set("fotoOriginal", null); set("fotoProcessada", null); }} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 mt-1">
                <Trash2 className="w-3 h-3" /> Remover foto
              </button>
            )}
          </div>
        </div>
        <Tip text="Usa uma foto profissional, de rosto bem visível. Podes remover o fundo automaticamente e escolher uma cor neutra depois." />
      </div>

      {/* Fields */}
      <div className="space-y-5">

        {/* Identidade */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b border-gray-100">Identidade</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label-xs mb-1">Nome completo *</label>
              <input className="input-field" value={data.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: João Manuel da Silva" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-xs mb-1">Título profissional</label>
              <input className="input-field" value={data.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Ex: Gestor de Projectos · Engenheiro Civil" />
              <p className="text-[10px] text-gray-400 mt-1">Cargo ou área profissional. Aparece destacado abaixo do nome.</p>
            </div>
          </div>
        </div>

        {/* Contactos */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b border-gray-100">Contactos</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1">Telefone principal *</label>
              <input className="input-field" value={data.telefone} onChange={e => set("telefone", e.target.value)} placeholder="+258 84 000 0000" />
            </div>
            <div>
              <label className="label-xs mb-1">Telefone alternativo</label>
              <input className="input-field" value={data.telefone2} onChange={e => set("telefone2", e.target.value)} placeholder="+258 86 000 0000" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-xs mb-1">Email *</label>
              <input type="email" className="input-field" value={data.email} onChange={e => set("email", e.target.value)} placeholder="joao@email.com" />
            </div>
            <div>
              <label className="label-xs mb-1">LinkedIn</label>
              <input className="input-field" value={data.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="linkedin.com/in/joaosilva" />
            </div>
            <div>
              <label className="label-xs mb-1">Website / Portfolio</label>
              <input className="input-field" value={data.website} onChange={e => set("website", e.target.value)} placeholder="joaosilva.com" />
            </div>
          </div>
        </div>

        {/* Localização */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b border-gray-100">Localização</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1">Cidade</label>
              <input className="input-field" value={data.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Maputo" />
            </div>
            <div>
              <label className="label-xs mb-1">Província / País</label>
              <input className="input-field" value={data.provincia} onChange={e => set("provincia", e.target.value)} placeholder="Maputo, Moçambique" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-xs mb-1">Endereço (opcional)</label>
              <input className="input-field" value={data.endereco} onChange={e => set("endereco", e.target.value)} placeholder="Av. Julius Nyerere, 123" />
            </div>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b border-gray-100">Dados Pessoais</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1">Data de nascimento</label>
              <input type="date" className="input-field" value={data.dataNascimento} onChange={e => set("dataNascimento", e.target.value)} />
            </div>
            <div>
              <label className="label-xs mb-1">Local de nascimento</label>
              <input className="input-field" value={data.localNascimento} onChange={e => set("localNascimento", e.target.value)} placeholder="Maputo, Moçambique" />
            </div>
            <div>
              <label className="label-xs mb-1">Nacionalidade</label>
              <input className="input-field" value={data.nacionalidade} onChange={e => set("nacionalidade", e.target.value)} />
            </div>
            <div>
              <label className="label-xs mb-1">Género</label>
              <select className="input-field" value={data.genero} onChange={e => set("genero", e.target.value)}>
                <option value="">Seleccionar</option>
                <option>Masculino</option><option>Feminino</option><option>Outro</option>
              </select>
            </div>
            <div>
              <label className="label-xs mb-1">Estado civil</label>
              <select className="input-field" value={data.estadoCivil} onChange={e => set("estadoCivil", e.target.value)}>
                <option value="">Seleccionar</option>
                <option>Solteiro(a)</option><option>Casado(a)</option><option>Divorciado(a)</option><option>Viúvo(a)</option><option>União de facto</option>
              </select>
            </div>
            <div>
              <label className="label-xs mb-1">N.º BI / DIRE</label>
              <input className="input-field" value={data.biDire} onChange={e => set("biDire", e.target.value)} placeholder="Ex: 1234567890A" />
            </div>
            <div>
              <label className="label-xs mb-1">NUIT</label>
              <input className="input-field" value={data.nuit} onChange={e => set("nuit", e.target.value)} placeholder="Ex: 123456789" />
            </div>
          </div>
        </div>

        {/* Objectivo */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b border-gray-100">Perfil Profissional</h3>
          <label className="label-xs mb-1 block">Objectivo / Sumário</label>
          <AiTextarea value={data.objectivo} onChange={v => set("objectivo", v)} contexto="Objectivo profissional do CV" placeholder="Descreve em 2-3 linhas o que procuras..." />
          <Tip text="Escreve em 2-3 linhas o que procuras e o que ofereces. Ex: 'Profissional com 5 anos de experiência em gestão de projectos, à procura de uma posição que me permita aplicar as minhas competências de liderança.'" />
        </div>
      </div>
    </Card>
  );

  /* ─── STEP 1: FORMACAO ─── */
  const stepFormacao = (
    <Card title="Formação Académica" icon={GraduationCap}>
      {data.formacao.length === 0 && (
        <p className="text-sm text-gray-400 mb-4">Nenhuma formação adicionada. Clica em &quot;Adicionar&quot; para começar.</p>
      )}
      {data.formacao.map((f, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4 mb-4 relative">
          <button onClick={() => set("formacao", data.formacao.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 text-red-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label-xs mb-1">Instituição</label>
              <input className="input-field" value={f.instituicao} onChange={e => updateFormacao(i, "instituicao", e.target.value)} placeholder="Ex: Universidade Eduardo Mondlane" />
            </div>
            <div>
              <label className="label-xs mb-1">Curso</label>
              <input className="input-field" value={f.curso} onChange={e => updateFormacao(i, "curso", e.target.value)} placeholder="Ex: Engenharia Informática" />
            </div>
            <div>
              <label className="label-xs mb-1">Grau</label>
              <select className="input-field" value={f.grau} onChange={e => updateFormacao(i, "grau", e.target.value)}>
                {graus.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs mb-1">Ano início</label>
              <input className="input-field" value={f.anoInicio} onChange={e => updateFormacao(i, "anoInicio", e.target.value)} placeholder="2018" />
            </div>
            <div>
              <label className="label-xs mb-1">Ano fim</label>
              <input className="input-field" value={f.anoFim} onChange={e => updateFormacao(i, "anoFim", e.target.value)} placeholder="2022" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-xs mb-1">Descrição</label>
              <AiTextarea value={f.descricao} onChange={v => updateFormacao(i, "descricao", v)} contexto="Descrição da formação académica no CV" placeholder="Principais disciplinas, trabalhos de destaque..." rows={2} />
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => set("formacao", [...data.formacao, { ...emptyFormacao }])} className="btn-ghost text-sm">
        <Plus className="w-4 h-4" /> Adicionar formação
      </button>
    </Card>
  );

  /* ─── STEP 2: EXPERIENCIA ─── */
  const stepExperiencia = (
    <Card title="Experiência Profissional" icon={Briefcase}>
      <Tip text="Começa pela experiência mais recente. Descreve as tuas responsabilidades com verbos de acção (ex: geri, coordenei, implementei)." />
      {data.experiencia.length === 0 && (
        <p className="text-sm text-gray-400 mb-4 mt-4">Nenhuma experiência adicionada.</p>
      )}
      {data.experiencia.map((exp, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4 mb-4 mt-4 relative">
          <button onClick={() => set("experiencia", data.experiencia.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 text-red-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1">Empresa</label>
              <input className="input-field" value={exp.empresa} onChange={e => updateExperiencia(i, "empresa", e.target.value)} placeholder="Ex: Vodacom Moçambique" />
            </div>
            <div>
              <label className="label-xs mb-1">Cargo</label>
              <input className="input-field" value={exp.cargo} onChange={e => updateExperiencia(i, "cargo", e.target.value)} placeholder="Ex: Gestor de Projectos" />
            </div>
            <div>
              <label className="label-xs mb-1">Local</label>
              <input className="input-field" value={exp.local} onChange={e => updateExperiencia(i, "local", e.target.value)} placeholder="Maputo, Moçambique" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label-xs mb-1">Data início</label>
                <input className="input-field" value={exp.dataInicio} onChange={e => updateExperiencia(i, "dataInicio", e.target.value)} placeholder="Jan 2020" />
              </div>
              <div className="flex-1">
                <label className="label-xs mb-1">Data fim</label>
                <input className="input-field" value={exp.dataFim} onChange={e => updateExperiencia(i, "dataFim", e.target.value)} placeholder="Dez 2023" disabled={exp.actualmente} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={exp.actualmente} onChange={e => updateExperiencia(i, "actualmente", e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#D20001] focus:ring-[#D20001]" />
                <span className="text-sm text-gray-600">Actualmente nesta posição</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="label-xs mb-1">Descrição das funções</label>
              <AiTextarea value={exp.descricao} onChange={v => updateExperiencia(i, "descricao", v)} contexto="Descrição de experiência profissional no CV - responsabilidades e conquistas" placeholder="- Gestão de equipa de 10 pessoas&#10;- Coordenação de projectos..." />
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => set("experiencia", [...data.experiencia, { ...emptyExperiencia }])} className="btn-ghost text-sm mt-2">
        <Plus className="w-4 h-4" /> Adicionar experiência
      </button>
    </Card>
  );

  /* ─── STEP 3: COMPETENCIAS ─── */
  const stepCompetencias = (
    <Card title="Competências" icon={Wrench}>
      {/* Comp Tecnicas */}
      <div className="mb-6">
        <label className="label-xs mb-2">Competências Técnicas</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.competenciasTecnicas.map((c, i) => (
            <span key={i} className="badge bg-gray-100 text-gray-700 flex items-center gap-1">
              {c}
              <button onClick={() => set("competenciasTecnicas", data.competenciasTecnicas.filter((_, idx) => idx !== i))}>
                <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input-field flex-1" value={newCompTecnica} onChange={e => setNewCompTecnica(e.target.value)} placeholder="Ex: Gestão de projectos" onKeyDown={e => { if (e.key === "Enter" && newCompTecnica.trim()) { set("competenciasTecnicas", [...data.competenciasTecnicas, newCompTecnica.trim()]); setNewCompTecnica(""); } }} />
          <button onClick={() => { if (newCompTecnica.trim()) { set("competenciasTecnicas", [...data.competenciasTecnicas, newCompTecnica.trim()]); setNewCompTecnica(""); } }} className="btn-ghost text-xs py-2 px-3">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comp Informaticas */}
      <div className="mb-6">
        <label className="label-xs mb-2">Competências Informáticas</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.competenciasInformaticas.map((c, i) => (
            <span key={i} className="badge bg-gray-100 text-gray-700 flex items-center gap-1">
              {c}
              <button onClick={() => set("competenciasInformaticas", data.competenciasInformaticas.filter((_, idx) => idx !== i))}>
                <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input-field flex-1" value={newCompInfo} onChange={e => setNewCompInfo(e.target.value)} placeholder="Ex: Microsoft Office, AutoCAD" onKeyDown={e => { if (e.key === "Enter" && newCompInfo.trim()) { set("competenciasInformaticas", [...data.competenciasInformaticas, newCompInfo.trim()]); setNewCompInfo(""); } }} />
          <button onClick={() => { if (newCompInfo.trim()) { set("competenciasInformaticas", [...data.competenciasInformaticas, newCompInfo.trim()]); setNewCompInfo(""); } }} className="btn-ghost text-xs py-2 px-3">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Linguas */}
      <div className="mb-6">
        <label className="label-xs mb-2">Línguas</label>
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">Língua materna</label>
          <input className="input-field" value={data.linguaMaterna} onChange={e => set("linguaMaterna", e.target.value)} placeholder="Português" />
        </div>

        {data.linguas.map((l, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-3 mb-3 mt-3 relative">
            <button onClick={() => set("linguas", data.linguas.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label-xs mb-1">Língua</label>
                <input className="input-field" value={l.lingua} onChange={e => updateLingua(i, "lingua", e.target.value)} placeholder="Ex: Inglês" />
              </div>
              <div>
                <label className="label-xs mb-1">Nível</label>
                <select className="input-field" value={l.nivel} onChange={e => updateLingua(i, "nivel", e.target.value)}>
                  {niveisNacional.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        <button onClick={() => set("linguas", [...data.linguas, { ...emptyLinguaNacional }])} className="btn-ghost text-xs mt-1">
          <Plus className="w-4 h-4" /> Adicionar língua
        </button>
      </div>
    </Card>
  );

  /* ─── STEP 4: INFO ADICIONAL ─── */
  const stepInfoAdicional = (
    <Card title="Informação Adicional" icon={Info}>
      <div className="space-y-4">
        <div>
          <label className="label-xs mb-1">Carta de condução</label>
          <input className="input-field" value={data.cartaConducao} onChange={e => set("cartaConducao", e.target.value)} placeholder="Ex: Categoria B" />
        </div>

        <div>
          <label className="label-xs mb-1">Actividades extracurriculares</label>
          <textarea className="input-field min-h-[60px]" value={data.actividadesExtra} onChange={e => set("actividadesExtra", e.target.value)} placeholder="Voluntariado, desporto, associações..." />
        </div>
        {/* Referencias */}
        <div>
          <label className="label-xs mb-2">Referências</label>
          <Tip text="Inclui pelo menos 2 referências. Pede autorização antes de incluir alguém." />
          {data.referencias.map((r, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 mb-3 mt-3 relative">
              <button onClick={() => set("referencias", data.referencias.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label-xs mb-1">Nome</label>
                  <input className="input-field" value={r.nome} onChange={e => updateReferencia(i, "nome", e.target.value)} placeholder="Nome completo" />
                </div>
                <div>
                  <label className="label-xs mb-1">Cargo</label>
                  <input className="input-field" value={r.cargo} onChange={e => updateReferencia(i, "cargo", e.target.value)} placeholder="Director de RH" />
                </div>
                <div>
                  <label className="label-xs mb-1">Empresa</label>
                  <input className="input-field" value={r.empresa} onChange={e => updateReferencia(i, "empresa", e.target.value)} placeholder="Empresa" />
                </div>
                <div>
                  <label className="label-xs mb-1">Telefone</label>
                  <input className="input-field" value={r.telefone} onChange={e => updateReferencia(i, "telefone", e.target.value)} placeholder="+258 84 000 0000" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-xs mb-1">Email</label>
                  <input className="input-field" value={r.email} onChange={e => updateReferencia(i, "email", e.target.value)} placeholder="email@empresa.com" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => set("referencias", [...data.referencias, { ...emptyReferencia }])} className="btn-ghost text-xs mt-1">
            <Plus className="w-4 h-4" /> Adicionar referência
          </button>
        </div>
      </div>
    </Card>
  );

  /* ─── STEP 5: PREVIEW ─── */
  const PreviewNacional = () => {
    const accent = coresActuais.accentColor;
    const fontFam = modeloActual.fontFamily;
    const isMinimal = cvModelo === "minimalista";
    const dens = DENSIDADE_ESCALA[modeloActual.densidade];
    const nomeFontSize = data.nome.length > 28 ? "19pt" : "26pt";
    const estilo = modeloActual.estiloTitulo;
    const centrado = modeloActual.headerAlign === "centrado";
    let numeroSeccao = 0;
    const proximoNumero = () => ++numeroSeccao;
    const localizacao = [data.cidade, data.provincia].filter(Boolean).join(", ");
    const dadosPessoais = [
      data.dataNascimento && `Nasc. ${data.dataNascimento}`,
      data.localNascimento && `Natural de ${data.localNascimento}`,
      data.nacionalidade,
      data.estadoCivil,
      data.biDire && `BI/DIRE ${data.biDire}`,
      data.nuit && `NUIT ${data.nuit}`,
      data.cartaConducao && `Carta ${data.cartaConducao}`,
    ].filter(Boolean);

    const Contacto = ({ icon: Ico, children }: { icon: React.ElementType; children: React.ReactNode }) => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "1.5mm", whiteSpace: "nowrap" }}>
        <Ico style={{ width: "9pt", height: "9pt", color: accent, flexShrink: 0 }} />
        <span>{children}</span>
      </span>
    );

    const colunaLateral = !!modeloActual.colunaLateral;

    const secPerfil = data.objectivo && (
      <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
        <ThemedSectionTitle accent={accent} font={fontFam} size={dens.tituloSize} estilo={estilo} numero={proximoNumero()}>Perfil Profissional</ThemedSectionTitle>
        <p style={{ textAlign: "justify", margin: 0, color: "#333", fontStyle: isMinimal ? "normal" : "italic" }}>{data.objectivo}</p>
      </section>
    );

    const secExperiencia = data.experiencia.length > 0 && (
      <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
        <ThemedSectionTitle accent={accent} font={fontFam} size={dens.tituloSize} estilo={estilo} numero={proximoNumero()}>Experiência Profissional</ThemedSectionTitle>
        {data.experiencia.map((e, i) => (
          <div key={i} className="cv-entry" style={{ marginBottom: "5mm", display: "flex", gap: "6mm" }}>
            <div style={{ width: "28mm", flexShrink: 0, fontSize: "9pt", color: accent, fontWeight: 700, paddingTop: "1pt", letterSpacing: "0.3px" }}>
              {e.dataInicio}{e.actualmente ? " - Presente" : e.dataFim ? ` - ${e.dataFim}` : ""}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "11pt", color: "#0D0D0D", overflowWrap: "break-word" }}>{e.cargo}</div>
              <div style={{ fontSize: "10pt", color: "#555", fontStyle: "italic", marginBottom: "1mm", overflowWrap: "break-word" }}>
                {e.empresa}{e.local ? `, ${e.local}` : ""}
              </div>
              {e.descricao && (
                <div style={{ margin: 0, color: "#333" }}>
                  {e.descricao.split("\n").filter(l => l.trim()).map((l, j) => {
                    const clean = l.replace(/^[-•·*]\s*/, "").trim();
                    return <div key={j} style={{ display: "flex", gap: "2mm", marginTop: "0.8mm" }}><span>•</span><span>{clean}</span></div>;
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </section>
    );

    const secFormacao = data.formacao.length > 0 && (
      <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
        <ThemedSectionTitle accent={accent} font={fontFam} size={dens.tituloSize} estilo={estilo} numero={proximoNumero()}>Formação Académica</ThemedSectionTitle>
        {data.formacao.map((f, i) => (
          <div key={i} className="cv-entry" style={{ marginBottom: "4mm", display: "flex", gap: "6mm" }}>
            <div style={{ width: "28mm", flexShrink: 0, fontSize: "9pt", color: accent, fontWeight: 700, paddingTop: "1pt", letterSpacing: "0.3px" }}>
              {f.anoInicio}{f.anoFim ? ` - ${f.anoFim}` : ""}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "11pt", color: "#0D0D0D", overflowWrap: "break-word" }}>
                {f.curso}{f.grau ? ` (${f.grau})` : ""}
              </div>
              <div style={{ fontSize: "10pt", color: "#555", fontStyle: "italic", overflowWrap: "break-word" }}>{f.instituicao}</div>
              {f.descricao && <p style={{ margin: "1mm 0 0", color: "#333" }}>{f.descricao}</p>}
            </div>
          </div>
        ))}
      </section>
    );

    const secCompetencias = (data.competenciasTecnicas.length > 0 || data.competenciasInformaticas.length > 0) && (
      <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
        <ThemedSectionTitle accent={accent} font={fontFam} size={dens.tituloSize} estilo={estilo} numero={proximoNumero()}>Competências</ThemedSectionTitle>
        {data.competenciasTecnicas.length > 0 && (
          <div style={{ marginBottom: "2mm", display: colunaLateral ? "block" : "flex", gap: "6mm" }}>
            <div style={{ width: colunaLateral ? "auto" : "28mm", flexShrink: 0, fontWeight: 600, color: "#555" }}>Técnicas</div>
            <div style={{ flex: 1, color: "#333" }}>{data.competenciasTecnicas.join(" · ")}</div>
          </div>
        )}
        {data.competenciasInformaticas.length > 0 && (
          <div style={{ marginBottom: "2mm", display: colunaLateral ? "block" : "flex", gap: "6mm" }}>
            <div style={{ width: colunaLateral ? "auto" : "28mm", flexShrink: 0, fontWeight: 600, color: "#555" }}>Informáticas</div>
            <div style={{ flex: 1, color: "#333" }}>{data.competenciasInformaticas.join(" · ")}</div>
          </div>
        )}
      </section>
    );

    const secLinguas = (data.linguaMaterna || data.linguas.length > 0) && (
      <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
        <ThemedSectionTitle accent={accent} font={fontFam} size={dens.tituloSize} estilo={estilo} numero={proximoNumero()}>Línguas</ThemedSectionTitle>
        {data.linguaMaterna && (
          <div style={{ marginBottom: "1.5mm", display: colunaLateral ? "block" : "flex", gap: "6mm" }}>
            <div style={{ width: colunaLateral ? "auto" : "28mm", flexShrink: 0, fontWeight: 600, color: "#0D0D0D" }}>{data.linguaMaterna}</div>
            <div style={{ flex: 1, color: "#555", fontStyle: "italic" }}>Língua materna</div>
          </div>
        )}
        {data.linguas.map((l, i) => (
          <div key={i} style={{ marginBottom: "1.5mm", display: colunaLateral ? "block" : "flex", gap: "6mm" }}>
            <div style={{ width: colunaLateral ? "auto" : "28mm", flexShrink: 0, fontWeight: 600, color: "#0D0D0D" }}>{l.lingua}</div>
            <div style={{ flex: 1, color: "#555" }}>{l.nivel}</div>
          </div>
        ))}
      </section>
    );

    const secDadosPessoais = dadosPessoais.length > 0 && (
      <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
        <ThemedSectionTitle accent={accent} font={fontFam} size={dens.tituloSize} estilo={estilo} numero={proximoNumero()}>Dados Pessoais</ThemedSectionTitle>
        <p style={{ margin: 0, color: "#333", whiteSpace: colunaLateral ? "pre-line" : "normal" }}>{dadosPessoais.join(colunaLateral ? "\n" : "  ·  ")}</p>
      </section>
    );

    const secActividades = data.actividadesExtra && (
      <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
        <ThemedSectionTitle accent={accent} font={fontFam} size={dens.tituloSize} estilo={estilo} numero={proximoNumero()}>Actividades Extra-curriculares</ThemedSectionTitle>
        <p style={{ margin: 0, color: "#333" }}>{data.actividadesExtra}</p>
      </section>
    );

    const secReferencias = data.referencias.length > 0 && (
      <section className="cv-section">
        <ThemedSectionTitle accent={accent} font={fontFam} size={dens.tituloSize} estilo={estilo} numero={proximoNumero()}>Referências</ThemedSectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5mm 8mm" }}>
          {data.referencias.map((r, i) => (
            <div key={i}>
              <div style={{ fontWeight: 700, color: "#0D0D0D" }}>{r.nome}</div>
              {r.cargo && <div style={{ fontSize: "9.5pt", color: "#555", fontStyle: "italic" }}>{r.cargo}{r.empresa ? `, ${r.empresa}` : ""}</div>}
              {r.telefone && <div style={{ fontSize: "9.5pt", color: "#444" }}>Tel.: {r.telefone}</div>}
              {r.email && <div style={{ fontSize: "9.5pt", color: "#444" }}>{r.email}</div>}
            </div>
          ))}
        </div>
      </section>
    );

    return (
      <div className={`cv-preview bg-white mx-auto shadow-lg border border-gray-200 print:shadow-none print:border-0 ${criarCvEnt.unlocked ? "desbloqueado" : ""}`}
        style={{
          position: "relative",
          fontFamily: fontFam,
          fontSize: dens.fontBase,
          lineHeight: dens.lineHeight,
          color: "#1a1a1a",
          width: "210mm",
          minHeight: "297mm",
          padding: "18mm 20mm",
        }}>
        {!criarCvEnt.unlocked && <MarcaDagua />}

        {/* ─── Cabeçalho ─── */}
        <header className="cv-section" style={{ marginBottom: dens.secMargin }}>
          <div style={{
            display: "flex",
            alignItems: centrado ? "center" : "flex-start",
            flexDirection: centrado ? "column" : "row",
            gap: "8mm",
          }}>
            {centrado && data.foto && (
              <div style={{
                width: "30mm",
                height: "30mm",
                borderRadius: "50%",
                overflow: "hidden",
                border: `1.5pt solid ${accent}`,
              }}>
                <img src={data.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ flex: centrado ? undefined : 1, minWidth: 0, textAlign: centrado ? "center" : "left" }}>
              <h1 style={{
                fontFamily: fontFam,
                fontSize: nomeFontSize,
                fontWeight: 700,
                letterSpacing: centrado ? "1.5px" : "-0.5px",
                lineHeight: 1.05,
                margin: 0,
                color: modeloActual.textColor,
                overflowWrap: "break-word",
                textTransform: centrado ? "uppercase" : "none",
              }}>
                {data.nome || "Nome Completo"}
              </h1>
              {(data.titulo || data.experiencia[0]?.cargo) && (
                <p style={{
                  fontSize: "12pt",
                  color: accent,
                  fontWeight: 600,
                  letterSpacing: "0.8px",
                  margin: "2mm 0 0",
                  textTransform: "uppercase",
                  overflowWrap: "break-word",
                }}>
                  {data.titulo || data.experiencia[0]?.cargo}
                </p>
              )}

              {/* Contactos linha 1: telefone, email, localização */}
              <div style={{
                fontSize: "9.5pt",
                color: "#444",
                marginTop: "4mm",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: centrado ? "center" : "flex-start",
                gap: "2mm 5mm",
                lineHeight: 1.4,
              }}>
                {data.telefone && <Contacto icon={Phone}>{data.telefone}</Contacto>}
                {data.telefone2 && <Contacto icon={Phone}>{data.telefone2}</Contacto>}
                {data.email && <Contacto icon={Mail}>{data.email}</Contacto>}
                {localizacao && <Contacto icon={MapPin}>{localizacao}</Contacto>}
              </div>

              {/* Contactos linha 2: web/social */}
              {(data.linkedin || data.website || data.github) && (
                <div style={{
                  fontSize: "9.5pt",
                  color: "#444",
                  marginTop: "2mm",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: centrado ? "center" : "flex-start",
                  gap: "2mm 5mm",
                  lineHeight: 1.4,
                }}>
                  {data.linkedin && <Contacto icon={Globe2}>{data.linkedin}</Contacto>}
                  {data.website && <Contacto icon={Globe2}>{data.website}</Contacto>}
                  {data.github && <Contacto icon={Globe2}>{data.github}</Contacto>}
                </div>
              )}
            </div>
            {!centrado && data.foto && (
              <div style={{
                width: "32mm",
                height: "40mm",
                overflow: "hidden",
                border: isMinimal ? "0.5pt solid #ccc" : `1pt solid ${accent}`,
                flexShrink: 0,
              }}>
                <img src={data.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
          </div>
          {/* Separador */}
          <div style={{
            marginTop: "5mm",
            height: isMinimal ? "0.5pt" : "2pt",
            width: centrado ? "40mm" : "auto",
            marginLeft: centrado ? "auto" : 0,
            marginRight: centrado ? "auto" : 0,
            background: centrado
              ? accent
              : isMinimal
              ? "#0D0D0D"
              : `linear-gradient(to right, ${accent} 0%, ${accent} 40mm, #e5e5e5 40mm, #e5e5e5 100%)`,
          }} />
        </header>

        {colunaLateral ? (
          <div style={{ display: "flex", gap: "10mm" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {secPerfil}
              {secExperiencia}
              {secFormacao}
            </div>
            <div style={{ width: "52mm", flexShrink: 0, borderLeft: `0.5pt solid ${accent}55`, paddingLeft: "6mm" }}>
              {secCompetencias}
              {secLinguas}
              {secDadosPessoais}
              {secActividades}
            </div>
          </div>
        ) : (
          <>
            {secPerfil}
            {secExperiencia}
            {secFormacao}
            {secCompetencias}
            {secLinguas}
            {secDadosPessoais}
            {secActividades}
          </>
        )}
        {secReferencias}
      </div>
    );
  };

  const PreviewSidebar = () => {
    const accent = coresActuais.accentColor;
    const fontFam = modeloActual.fontFamily;
    const sidebarBg = coresActuais.sidebarBg ?? "#0D0D0D";
    const sidebarColor = coresActuais.sidebarColor ?? "#fff";
    const dens = DENSIDADE_ESCALA[modeloActual.densidade];
    const nomeFontSize = data.nome.length > 28 ? "17pt" : "22pt";
    const sidebarDireita = modeloActual.sidebarPos === "direita";
    const tituloCaixa = modeloActual.estiloTitulo === "caixa";
    const localizacao = [data.cidade, data.provincia].filter(Boolean).join(", ");

    const SideTitle = ({ children }: { children: React.ReactNode }) => (
      <h3 style={{
        fontSize: "9pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        color: accent,
        margin: "0 0 2mm",
        paddingBottom: "1mm",
        borderBottom: `0.5pt solid ${accent}55`,
        overflowWrap: "break-word",
      }}>{children}</h3>
    );
    const MainTitle = ({ children }: { children: React.ReactNode }) => tituloCaixa ? (
      <h2 style={{
        fontFamily: fontFam,
        fontSize: dens.tituloSize,
        fontWeight: 700,
        color: "#fff",
        background: accent,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        display: "inline-block",
        padding: "1.5mm 4mm",
        borderRadius: "1.5mm",
        margin: "0 0 4mm",
        overflowWrap: "break-word",
      }}>{children}</h2>
    ) : (
      <h2 style={{
        fontFamily: fontFam,
        fontSize: dens.tituloSize,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "2px",
        color: "#0D0D0D",
        margin: "0 0 3mm",
        paddingBottom: "1.5mm",
        borderBottom: `0.5pt solid ${accent}`,
        overflowWrap: "break-word",
      }}>{children}</h2>
    );

    return (
      <div className={`cv-preview bg-white mx-auto shadow-lg border border-gray-200 print:shadow-none print:border-0 ${criarCvEnt.unlocked ? "desbloqueado" : ""}`}
        style={{
          position: "relative",
          fontFamily: fontFam,
          fontSize: dens.fontBase,
          lineHeight: dens.lineHeight,
          color: "#1a1a1a",
          width: "210mm",
          minHeight: "297mm",
        }}>
        {!criarCvEnt.unlocked && <MarcaDagua />}
        <div style={{ display: "flex", flexDirection: sidebarDireita ? "row-reverse" : "row", minHeight: "297mm" }}>
          {/* ─── Sidebar ─── */}
          <aside style={{
            width: "68mm",
            background: sidebarBg,
            color: sidebarColor,
            padding: "15mm 8mm",
            flexShrink: 0,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}>
            {data.foto && (
              <div style={{
                width: "42mm",
                height: "52mm",
                overflow: "hidden",
                margin: "0 auto 6mm",
                border: `1pt solid ${accent}`,
              }}>
                <img src={data.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}

            {/* Contacto */}
            <div style={{ marginBottom: "6mm" }}>
              <SideTitle>Contacto</SideTitle>
              <div style={{ fontSize: "9pt", lineHeight: 1.6 }}>
                {data.telefone && (
                  <div style={{ display: "flex", gap: "2mm", alignItems: "flex-start", marginBottom: "1mm" }}>
                    <Phone style={{ width: "9pt", height: "9pt", color: accent, marginTop: "1.5pt", flexShrink: 0 }} />
                    <span>{data.telefone}</span>
                  </div>
                )}
                {data.telefone2 && (
                  <div style={{ display: "flex", gap: "2mm", alignItems: "flex-start", marginBottom: "1mm" }}>
                    <Phone style={{ width: "9pt", height: "9pt", color: accent, marginTop: "1.5pt", flexShrink: 0 }} />
                    <span>{data.telefone2}</span>
                  </div>
                )}
                {data.email && (
                  <div style={{ display: "flex", gap: "2mm", alignItems: "flex-start", marginBottom: "1mm" }}>
                    <Mail style={{ width: "9pt", height: "9pt", color: accent, marginTop: "1.5pt", flexShrink: 0 }} />
                    <span style={{ wordBreak: "break-all" }}>{data.email}</span>
                  </div>
                )}
                {(data.endereco || data.cidade) && (
                  <div style={{ display: "flex", gap: "2mm", alignItems: "flex-start", marginBottom: "1mm" }}>
                    <MapPin style={{ width: "9pt", height: "9pt", color: accent, marginTop: "1.5pt", flexShrink: 0 }} />
                    <span>{data.endereco}{data.endereco && data.cidade ? ", " : ""}{data.cidade}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dados Pessoais */}
            {(data.dataNascimento || data.nacionalidade || data.genero || data.cartaConducao) && (
              <div style={{ marginBottom: "6mm" }}>
                <SideTitle>Informação Pessoal</SideTitle>
                <div style={{ fontSize: "9pt", lineHeight: 1.6, color: "#d4d4d4" }}>
                  {data.dataNascimento && <div style={{ marginBottom: "1mm" }}><span style={{ color: accent }}>Nascido(a):</span> {data.dataNascimento}</div>}
                  {data.localNascimento && <div style={{ marginBottom: "1mm" }}><span style={{ color: accent }}>Natural de:</span> {data.localNascimento}</div>}
                  {data.nacionalidade && <div style={{ marginBottom: "1mm" }}><span style={{ color: accent }}>Nacionalidade:</span> {data.nacionalidade}</div>}
                  {data.genero && <div style={{ marginBottom: "1mm" }}><span style={{ color: accent }}>Género:</span> {data.genero}</div>}
                  {data.cartaConducao && <div style={{ marginBottom: "1mm" }}><span style={{ color: accent }}>Carta:</span> {data.cartaConducao}</div>}
                  {data.linkedin && <div style={{ marginBottom: "1mm", wordBreak: "break-all" }}><span style={{ color: accent }}>LinkedIn:</span> {data.linkedin}</div>}
                  {data.website && <div style={{ marginBottom: "1mm", wordBreak: "break-all" }}><span style={{ color: accent }}>Web:</span> {data.website}</div>}
                </div>
              </div>
            )}

            {/* Línguas — barras de progresso */}
            {(data.linguaMaterna || data.linguas.length > 0) && (
              <div style={{ marginBottom: "6mm" }}>
                <SideTitle>Línguas</SideTitle>
                <div style={{ fontSize: "9pt" }}>
                  {data.linguaMaterna && (
                    <div style={{ marginBottom: "2.5mm" }}>
                      <div style={{ fontWeight: 600, marginBottom: "0.5mm" }}>{data.linguaMaterna}</div>
                      <div style={{ fontSize: "8pt", color: accent, fontStyle: "italic" }}>Língua materna</div>
                    </div>
                  )}
                  {data.linguas.map((l, i) => (
                    <div key={i} style={{ marginBottom: "2.5mm" }}>
                      <div style={{ fontWeight: 600, marginBottom: "0.5mm" }}>{l.lingua}</div>
                      <div style={{ fontSize: "8pt", color: accent, fontStyle: "italic" }}>{l.nivel}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competências Digitais */}
            {data.competenciasInformaticas.length > 0 && (
              <div style={{ marginBottom: "6mm" }}>
                <SideTitle>Competências Digitais</SideTitle>
                <div style={{ fontSize: "9pt", lineHeight: 1.7 }}>
                  {data.competenciasInformaticas.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: "2mm" }}>
                      <span style={{ color: accent }}>›</span><span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ─── Conteúdo principal ─── */}
          <main style={{ flex: 1, padding: "15mm 13mm" }}>
            {/* Nome */}
            <header style={{ marginBottom: dens.secMargin, paddingBottom: "4mm", borderBottom: "0.5pt solid #ddd" }}>
              <h1 style={{
                fontSize: nomeFontSize,
                fontWeight: 300,
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
                margin: 0,
                color: "#0D0D0D",
                overflowWrap: "break-word",
              }}>{data.nome || "Nome Completo"}</h1>
              {(data.titulo || data.experiencia[0]?.cargo) && (
                <p style={{
                  fontSize: "12pt",
                  color: accent,
                  fontWeight: 600,
                  letterSpacing: "1px",
                  margin: "2mm 0 0",
                  textTransform: "uppercase",
                  overflowWrap: "break-word",
                }}>{data.titulo || data.experiencia[0]?.cargo}</p>
              )}
            </header>

            {/* Perfil */}
            {data.objectivo && (
              <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
                <MainTitle>Perfil Profissional</MainTitle>
                <p style={{ textAlign: "justify", margin: 0, color: "#333" }}>{data.objectivo}</p>
              </section>
            )}

            {/* Experiência */}
            {data.experiencia.length > 0 && (
              <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
                <MainTitle>Experiência Profissional</MainTitle>
                {data.experiencia.map((e, i) => (
                  <div key={i} className="cv-entry" style={{ marginBottom: "4mm" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5mm", flexWrap: "wrap", gap: "1mm 3mm" }}>
                      <strong style={{ fontSize: "10.5pt", color: "#0D0D0D", overflowWrap: "break-word" }}>{e.cargo}</strong>
                      <span style={{ fontSize: "9pt", color: accent, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {e.dataInicio}{e.actualmente ? " - Presente" : e.dataFim ? ` - ${e.dataFim}` : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: "9.5pt", color: "#555", fontStyle: "italic", marginBottom: "1mm", overflowWrap: "break-word" }}>
                      {e.empresa}{e.local ? `, ${e.local}` : ""}
                    </div>
                    {e.descricao && (
                      <div style={{ color: "#333" }}>
                        {e.descricao.split("\n").filter(l => l.trim()).map((l, j) => {
                          const clean = l.replace(/^[-•·*]\s*/, "").trim();
                          return <div key={j} style={{ display: "flex", gap: "2mm", marginTop: "0.8mm" }}><span style={{ color: accent }}>•</span><span>{clean}</span></div>;
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* Formação */}
            {data.formacao.length > 0 && (
              <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
                <MainTitle>Formação Académica</MainTitle>
                {data.formacao.map((f, i) => (
                  <div key={i} className="cv-entry" style={{ marginBottom: "3.5mm" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5mm", flexWrap: "wrap", gap: "1mm 3mm" }}>
                      <strong style={{ fontSize: "10.5pt", color: "#0D0D0D", overflowWrap: "break-word" }}>{f.curso}{f.grau ? ` (${f.grau})` : ""}</strong>
                      <span style={{ fontSize: "9pt", color: accent, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {f.anoInicio}{f.anoFim ? ` - ${f.anoFim}` : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: "9.5pt", color: "#555", fontStyle: "italic", overflowWrap: "break-word" }}>{f.instituicao}</div>
                    {f.descricao && <p style={{ margin: "1mm 0 0", color: "#444" }}>{f.descricao}</p>}
                  </div>
                ))}
              </section>
            )}

            {/* Competências chave (técnicas) */}
            {data.competenciasTecnicas.length > 0 && (
              <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
                <MainTitle>Competências Chave</MainTitle>
                <p style={{ margin: 0, color: "#333" }}>{data.competenciasTecnicas.join(" · ")}</p>
              </section>
            )}

          </main>
        </div>
      </div>
    );
  };

  /* Layout "banner" (modelo Criativo) — faixa colorida a toda a largura no
     topo em vez de sidebar ou cabeçalho neutro: silhueta deliberadamente
     diferente das outras duas famílias de layout. */
  const PreviewBanner = () => {
    const accent = coresActuais.accentColor;
    const fontFam = modeloActual.fontFamily;
    const dens = DENSIDADE_ESCALA[modeloActual.densidade];
    const nomeFontSize = data.nome.length > 28 ? "18pt" : "24pt";
    const localizacao = [data.cidade, data.provincia].filter(Boolean).join(", ");
    const tags = [...data.competenciasTecnicas, ...data.competenciasInformaticas];

    const BannerTitle = ({ children }: { children: React.ReactNode }) => (
      <h2 style={{
        fontFamily: fontFam,
        fontSize: dens.tituloSize,
        fontWeight: 700,
        color: accent,
        margin: "0 0 3mm",
        overflowWrap: "break-word",
      }}>{children}</h2>
    );

    return (
      <div className={`cv-preview bg-white mx-auto shadow-lg border border-gray-200 print:shadow-none print:border-0 ${criarCvEnt.unlocked ? "desbloqueado" : ""}`}
        style={{
          position: "relative",
          fontFamily: fontFam,
          fontSize: dens.fontBase,
          lineHeight: dens.lineHeight,
          color: "#1a1a1a",
          width: "210mm",
          minHeight: "297mm",
        }}>
        {!criarCvEnt.unlocked && <MarcaDagua />}
        {/* ─── Faixa colorida ─── */}
        <header style={{
          background: accent,
          color: "#fff",
          padding: "14mm 18mm",
          display: "flex",
          alignItems: "center",
          gap: "8mm",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}>
          {data.foto && (
            <div style={{
              width: "30mm",
              height: "30mm",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              border: "2pt solid rgba(255,255,255,0.6)",
            }}>
              <img src={data.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: nomeFontSize, fontWeight: 700, margin: 0, lineHeight: 1.1, overflowWrap: "break-word" }}>
              {data.nome || "Nome Completo"}
            </h1>
            {(data.titulo || data.experiencia[0]?.cargo) && (
              <p style={{ fontSize: "12pt", fontWeight: 500, margin: "2mm 0 0", opacity: 0.92, overflowWrap: "break-word" }}>
                {data.titulo || data.experiencia[0]?.cargo}
              </p>
            )}
            <div style={{ fontSize: "9pt", marginTop: "3mm", display: "flex", flexWrap: "wrap", gap: "1.5mm 5mm", opacity: 0.9 }}>
              {data.telefone && <span>{data.telefone}</span>}
              {data.email && <span style={{ wordBreak: "break-all" }}>{data.email}</span>}
              {localizacao && <span>{localizacao}</span>}
            </div>
          </div>
        </header>

        {/* ─── Tags de competências ─── */}
        {tags.length > 0 && (
          <div style={{ padding: "5mm 18mm 0", display: "flex", flexWrap: "wrap", gap: "2mm" }}>
            {tags.map((t, i) => (
              <span key={i} style={{
                fontSize: "8.5pt",
                fontWeight: 600,
                color: accent,
                background: `${accent}18`,
                borderRadius: "999px",
                padding: "1.5mm 3.5mm",
              }}>{t}</span>
            ))}
          </div>
        )}

        {/* ─── Corpo ─── */}
        <div style={{ padding: "6mm 18mm 15mm" }}>
          {data.objectivo && (
            <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
              <BannerTitle>Perfil</BannerTitle>
              <p style={{ textAlign: "justify", margin: 0, color: "#333" }}>{data.objectivo}</p>
            </section>
          )}

          {data.experiencia.length > 0 && (
            <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
              <BannerTitle>Experiência</BannerTitle>
              {data.experiencia.map((e, i) => (
                <div key={i} className="cv-entry" style={{ marginBottom: "4mm" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1mm 3mm" }}>
                    <strong style={{ fontSize: "11pt", color: "#0D0D0D", overflowWrap: "break-word" }}>{e.cargo}</strong>
                    <span style={{ fontSize: "9pt", color: accent, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {e.dataInicio}{e.actualmente ? " - Presente" : e.dataFim ? ` - ${e.dataFim}` : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: "10pt", color: "#555", fontStyle: "italic", marginBottom: "1mm", overflowWrap: "break-word" }}>
                    {e.empresa}{e.local ? `, ${e.local}` : ""}
                  </div>
                  {e.descricao && (
                    <div style={{ color: "#333" }}>
                      {e.descricao.split("\n").filter(l => l.trim()).map((l, j) => {
                        const clean = l.replace(/^[-•·*]\s*/, "").trim();
                        return <div key={j} style={{ display: "flex", gap: "2mm", marginTop: "0.8mm" }}><span style={{ color: accent }}>•</span><span>{clean}</span></div>;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {data.formacao.length > 0 && (
            <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
              <BannerTitle>Formação</BannerTitle>
              {data.formacao.map((f, i) => (
                <div key={i} className="cv-entry" style={{ marginBottom: "3.5mm" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1mm 3mm" }}>
                    <strong style={{ fontSize: "11pt", color: "#0D0D0D", overflowWrap: "break-word" }}>{f.curso}{f.grau ? ` (${f.grau})` : ""}</strong>
                    <span style={{ fontSize: "9pt", color: accent, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {f.anoInicio}{f.anoFim ? ` - ${f.anoFim}` : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: "10pt", color: "#555", fontStyle: "italic", overflowWrap: "break-word" }}>{f.instituicao}</div>
                  {f.descricao && <p style={{ margin: "1mm 0 0", color: "#333" }}>{f.descricao}</p>}
                </div>
              ))}
            </section>
          )}

          {(data.linguaMaterna || data.linguas.length > 0) && (
            <section className="cv-section" style={{ marginBottom: dens.secMargin }}>
              <BannerTitle>Línguas</BannerTitle>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2mm 6mm" }}>
                {data.linguaMaterna && (
                  <span><strong style={{ color: "#0D0D0D" }}>{data.linguaMaterna}</strong> <span style={{ color: "#777", fontStyle: "italic" }}>— Língua materna</span></span>
                )}
                {data.linguas.map((l, i) => (
                  <span key={i}><strong style={{ color: "#0D0D0D" }}>{l.lingua}</strong> <span style={{ color: "#777" }}>— {l.nivel}</span></span>
                ))}
              </div>
            </section>
          )}

          {data.referencias.length > 0 && (
            <section className="cv-section">
              <BannerTitle>Referências</BannerTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5mm 8mm" }}>
                {data.referencias.map((r, i) => (
                  <div key={i}>
                    <div style={{ fontWeight: 700, color: "#0D0D0D" }}>{r.nome}</div>
                    {r.cargo && <div style={{ fontSize: "9.5pt", color: "#555", fontStyle: "italic" }}>{r.cargo}{r.empresa ? `, ${r.empresa}` : ""}</div>}
                    {r.telefone && <div style={{ fontSize: "9.5pt", color: "#444" }}>Tel.: {r.telefone}</div>}
                    {r.email && <div style={{ fontSize: "9.5pt", color: "#444" }}>{r.email}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  };

  const modeloActual = MODELOS.find(m => m.id === cvModelo) ?? MODELOS[0];
  const paletaBase = modeloActual.paletas[0];
  const coresActuais = {
    accentColor: corCustom ?? paletaBase?.accentColor ?? modeloActual.accentColor,
    sidebarBg: paletaBase?.sidebarBg ?? modeloActual.sidebarBg,
    sidebarColor: paletaBase?.sidebarColor ?? modeloActual.sidebarColor,
  };
  const sugestaoModelo = !modeloEscolhidoManualmente && !sugestaoIgnorada ? recomendarModelo(data.titulo) : null;
  const modeloSugerido = sugestaoModelo ? MODELOS.find(m => m.id === sugestaoModelo.modeloId) : null;

  const escolherModelo = (id: CvModelo) => {
    setCvModelo(id);
    setCorCustom(null);
    setModeloEscolhidoManualmente(true);
  };

  const stepPreview = (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D20001]/10 flex items-center justify-center">
            <Eye className="w-5 h-5 text-[#D20001]" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>Pré-visualização</h2>
            <p className="text-xs text-gray-400">Revê o teu CV antes de descarregar</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-primary">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={handleDownloadWord} disabled={gerandoDocx} className="btn-vivid-outline text-sm px-4 py-3 disabled:opacity-60">
            {gerandoDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Word
          </button>
        </div>
      </div>

      {/* Selector de modelo */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 print:hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#D20001]/10 flex items-center justify-center">
            <FileUser className="w-3.5 h-3.5 text-[#D20001]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2A0001]">Escolhe o modelo</h3>
            <p className="text-[11px] text-gray-400">{MODELOS.length} designs profissionais para diferentes contextos</p>
          </div>
        </div>

        {modeloSugerido && modeloSugerido.id !== cvModelo && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 mb-3">
            <Sparkles size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-800">
                <span className="font-bold">Sugerimos: {modeloSugerido.nome}</span> — {sugestaoModelo?.motivo}
              </p>
              <div className="flex gap-3 mt-1.5">
                <button onClick={() => escolherModelo(modeloSugerido.id)} className="text-xs font-bold text-amber-700 hover:underline">Usar</button>
                <button onClick={() => setSugestaoIgnorada(true)} className="text-xs text-amber-500 hover:underline">Ignorar</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {MODELOS.map(m => (
            <div
              key={m.id}
              className={`text-left rounded-xl border-2 transition-all overflow-hidden ${cvModelo === m.id ? "border-[#D20001] bg-[#D20001]/5" : "border-gray-100 hover:border-gray-300"}`}
            >
              <button onClick={() => escolherModelo(m.id)} className="w-full text-left p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.accentColor }} />
                  <span className="text-sm font-bold text-[#2A0001]">{m.nome}</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">{m.descricao}</p>
              </button>
              <button
                onClick={() => setInfoModeloAberto(infoModeloAberto === m.id ? null : m.id)}
                className="w-full flex items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-[#D20001] border-t border-gray-50 py-1"
              >
                <Info className="w-3 h-3" /> {infoModeloAberto === m.id ? "Ocultar" : "Detalhes"}
              </button>
              {infoModeloAberto === m.id && (
                <div className="px-3 pb-3 pt-1 text-[10px] text-gray-500 space-y-1 border-t border-gray-50">
                  <p><span className="font-bold text-gray-600">Área recomendada:</span> {m.areaRecomendada.join(", ")}</p>
                  <p><span className="font-bold text-gray-600">Experiência:</span> {m.nivelExperiencia}</p>
                  <p><span className="font-bold text-gray-600">Compatibilidade ATS:</span> {m.ats}</p>
                  <p className="italic leading-relaxed">{m.justificativa}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-[11px] font-bold text-gray-500 mb-2">Cor do modelo</p>
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl border-2 border-gray-100 overflow-hidden shrink-0" style={{ backgroundColor: coresActuais.accentColor }}>
              <input
                type="color"
                value={coresActuais.accentColor}
                onChange={(e) => setCorCustom(e.target.value)}
                title="Arrasta ou toca para escolher a cor"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-600">Toca no quadrado para abrir a paleta</p>
              <p className="text-[10px] text-gray-400">Arrasta o dedo ou o cursor para escolher qualquer cor</p>
            </div>
            {corCustom && (
              <button onClick={() => setCorCustom(null)} className="text-[10px] font-semibold text-gray-400 hover:text-[#D20001] underline underline-offset-2 shrink-0">
                Repor cor padrão
              </button>
            )}
          </div>
        </div>
      </div>

      {compraPendenteCv && (
        <div ref={compraGateRef} className="mb-5 print:hidden">
          <CompraGate servicoSlug="criar-cv-ia" servicoNome="Criar CV" onUnlock={() => setCompraPendenteCv(false)}>
            {null}
          </CompraGate>
        </div>
      )}

      {/* Cada família de layout (single/sidebar/banner) tem a sua própria função de
          preview; a densidade do modelo controla espaçamento/tamanho de fonte dentro dela. */}
      {/* O documento tem largura real de A4 (210mm) — em ecrãs estreitos isso
          teria de "sair" da página; contém-se o overflow aqui, num scroll
          horizontal só desta caixa, para a página nunca ganhar scroll lateral. */}
      <div className="overflow-x-auto max-w-full print:overflow-visible">
        {modeloActual.layout === "sidebar" ? <PreviewSidebar /> : modeloActual.layout === "banner" ? <PreviewBanner /> : <PreviewNacional />}
      </div>
      <div className="text-center mt-6 print:hidden flex flex-wrap justify-center gap-3">
        <button onClick={handlePrint} className="btn-green">
          <Download className="w-4 h-4" /> Descarregar / Imprimir CV
        </button>
        <button onClick={handleDownloadWord} disabled={gerandoDocx} className="btn-vivid-outline disabled:opacity-60">
          {gerandoDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Word (.docx)
        </button>
      </div>

      {/* Ferramentas extra — em acordeão, para não competir por espaço com o modelo e a pré-visualização */}
      <div className="mt-10 print:hidden">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">Mais ferramentas</h3>
        <div className="space-y-2">
          <Ferramenta title="Análise Inteligente do CV" desc="Auditoria completa: ATS, ortografia, layout" icon={Sparkles} open={ferramentaAberta === "analise"} onToggle={() => toggleFerramenta("analise")}>
            <CvAnaliseIA cvData={data as unknown as Record<string, unknown>} />
          </Ferramenta>
          <Ferramenta title="CV Match com MUIANGA IA" desc="Compara o teu CV com uma vaga específica" icon={Award} open={ferramentaAberta === "match"} onToggle={() => toggleFerramenta("match")}>
            <CvMatchingVaga cvData={data as unknown as Record<string, unknown>} />
          </Ferramenta>
          <Ferramenta title="Cartas & Requerimento" desc="Gerados automaticamente a partir do teu CV" icon={Mail} open={ferramentaAberta === "cartas"} onToggle={() => toggleFerramenta("cartas")}>
            <DocumentosGerados cvData={data as unknown as Record<string, unknown>} />
          </Ferramenta>
          <Ferramenta title="Conversão para ATS" desc="Reescreve o CV para sistemas automáticos de triagem" icon={CheckCircle2} open={ferramentaAberta === "ats"} onToggle={() => toggleFerramenta("ats")}>
            <ConversaoATS cvData={data as unknown as Record<string, unknown>} />
          </Ferramenta>
          <Ferramenta title="Tradução de CV" desc="Para candidaturas internacionais" icon={Languages} open={ferramentaAberta === "traducao"} onToggle={() => toggleFerramenta("traducao")}>
            <TraducaoCv cvData={data as unknown as Record<string, unknown>} />
          </Ferramenta>
          <Ferramenta title="Simulação de Entrevista" desc="Perguntas prováveis e dicas de resposta" icon={Users} open={ferramentaAberta === "entrevista"} onToggle={() => toggleFerramenta("entrevista")}>
            <SimulacaoEntrevista cvData={data as unknown as Record<string, unknown>} />
          </Ferramenta>
          <Ferramenta title="Os teus documentos" desc="Documentos já gerados, prontos a re-descarregar" icon={FileUser} open={ferramentaAberta === "meus"} onToggle={() => toggleFerramenta("meus")}>
            <MeusDocumentos />
          </Ferramenta>
        </div>
      </div>
    </div>
  );

  /* ─── RENDER ─── */
  const stepContent = [stepDadosPessoais, stepFormacao, stepExperiencia, stepCompetencias, stepInfoAdicional, stepPreview];

  return (
    <>
      <style jsx global>{`
        .cv-preview {
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
        @media print {
          .cv-preview.desbloqueado {
            user-select: text;
            -webkit-user-select: text;
          }
          body * { visibility: hidden; }
          .cv-preview, .cv-preview * { visibility: visible !important; }
          .cv-preview {
            position: absolute; left: 0; top: 0;
            width: 210mm; margin: 0; padding: 0;
          }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 10mm 12mm; }

          /* Evitar secções cortadas entre páginas */
          .cv-preview h2, .cv-preview h3, .cv-preview h4 {
            page-break-after: avoid;
            break-after: avoid;
          }
          .cv-preview .cv-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .cv-preview .cv-entry {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Nunca começar parágrafo no fim da página */
          .cv-preview p, .cv-preview li {
            orphans: 3;
            widows: 3;
          }
        }
      `}</style>
      <main className="min-h-screen bg-gray-50 py-12 px-4 print:py-0 print:px-0 print:bg-white">
        <div className="max-w-3xl mx-auto print:max-w-none">
          {/* Header */}
          <div className="text-center mb-8 print:hidden">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D20001]/10 text-[#D20001] text-xs font-semibold mb-4">
              <FileUser className="w-4 h-4" />
              CV NACIONAL
            </div>
            <h1 className="text-2xl font-bold text-[#2A0001]" style={{ fontFamily: "var(--font-display)" }}>
              Criador de Curriculum Vitae
            </h1>
          </div>

          <StepIndicator />
          {stepContent[step]}
          <NavButtons />
        </div>
      </main>
      {showAuthCv && <AuthModal onClose={onAuthCloseCv} onSuccess={onAuthSuccessCv} />}
    </>
  );
}
