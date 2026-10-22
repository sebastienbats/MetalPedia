'use client';

interface MistTitleProps {
  text: string;
  color?: string;
  className?: string;
}

export default function MistTitle({ 
  text, 
  color = '#4a148c', 
  className = '' 
}: MistTitleProps) {
  return (
    <h1
      className={`mist-text ${className}`}
      style={{ '--theme-color': color } as React.CSSProperties}
    >
      {text}
    </h1>
  );
}
