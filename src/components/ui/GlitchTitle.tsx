'use client';

interface GlitchTitleProps {
  text: string;
  color?: string; // La couleur du pilier (ex: '#ff6f00' pour Thrash Metal)
  className?: string;
}

export default function GlitchTitle({ 
  text, 
  color = '#ff6f00', 
  className = '' 
}: GlitchTitleProps) {
  return (
    <h1
      className={`glitch-text ${className}`}
      // ✅ IMPORTANT : data-text est requis pour que les pseudo-éléments CSS puissent dupliquer le texte
      data-text={text}
      style={{ '--theme-color': color } as React.CSSProperties}
    >
      {text}
    </h1>
  );
}
