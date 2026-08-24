export default function Loader() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="flex items-center gap-3">
        <div className="animate-spin h-8 w-8">
          <svg viewBox="0 0 24 24" className="text-metal-fire">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
        <p className="text-metal-fire font-serif text-lg">Invocation en cours...</p>
      </div>
    </div>
  );
}
