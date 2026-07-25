export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-16">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#D20001]/10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#D20001] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-xs font-semibold text-gray-400 tracking-wide">A carregar...</p>
      </div>
    </div>
  );
}
