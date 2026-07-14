import { redirect } from "next/navigation";

/**
 * O catálogo de serviços de consultoria foi retirado do site por agora
 * (foco apenas em Emprego + Criar CV). Conteúdo original arquivado em
 * _archive/servicos-page.tsx.bak para reactivação futura.
 */
export default function ServicosPage() {
  redirect("/emprego");
}
