'use client';

interface HaloTitleProps {
  text: string;
  color?: string;
  className?: string;
}

export default function HaloTitle({ 
  text, 
  color = '#e8a84c', 
  className = '' 
}: HaloTitleProps) {
  return (
    <h1
      className={`halo-text ${className}`}
      style={{ '--theme-color': color } as React.CSSProperties}
    >
      {text}
    </h1>
  );
}
