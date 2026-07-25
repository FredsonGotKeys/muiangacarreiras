function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex justify-between">
        <div className="w-10 h-10 bg-gray-100 rounded-xl" />
        <div className="w-20 h-5 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <div className="h-5 bg-gray-100 rounded-full w-20" />
        <div className="h-5 bg-gray-100 rounded-full w-24" />
      </div>
    </div>
  );
}

export default function LoadingEmprego() {
  return (
    <div className="bg-white min-h-screen">
      {/* ── HERO (esqueleto) ── */}
      <section className="pt-24 sm:pt-32 pb-8 sm:pb-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#D20001]/10 text-[#D20001] border border-[#D20001]/20 mb-3">
            Vagas de Emprego
          </span>
          <div className="h-8 sm:h-10 bg-gray-100 rounded-lg w-full max-w-md animate-pulse" />
        </div>
      </section>

      {/* ── Grid de vagas (esqueleto) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    </div>
  );
}
