interface Props {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'inline' | 'fullscreen';
}

export default function Loader({
  text = 'Invocation en cours...',
  size = 'md',
  variant = 'default',
}: Props) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const containerClasses = {
    default: 'flex justify-center items-center py-16',
    inline: 'flex justify-center items-center py-4',
    fullscreen: 'fixed inset-0 flex justify-center items-center bg-metal-black/80 backdrop-blur-sm z-modal',
  };

  return (
    <div
      className={containerClasses[variant]}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="flex flex-col items-center gap-4">
        <div className={`animate-spin ${sizeClasses[size]}`}>
          <svg viewBox="0 0 24 24" className="text-metal-fire w-full h-full">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>
        {text && (
          <p className={`text-metal-fire font-serif ${textSizes[size]}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}
