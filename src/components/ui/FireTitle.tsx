'use client';

import { useEffect, useRef, useState } from 'react';

interface FireTitleProps {
  text: string;
  color?: string; // La couleur du pilier (ex: '#c9a227')
  className?: string;
  autoIgnite?: boolean;
  igniteOnHover?: boolean;
}

export default function FireTitle({ 
  text, 
  color = '#e8a84c', 
  className = '', 
  autoIgnite = true, 
  igniteOnHover = false 
}: FireTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isIgnited, setIsIgnited] = useState(!autoIgnite);

  useEffect(() => {
    if (autoIgnite && titleRef.current) {
      // ✅ Délai optimisé à 400ms pour un équilibre parfait entre effet dramatique et réactivité
      const timer = setTimeout(() => {
        setIsIgnited(true);
      }, 400);
      
      return () => clearTimeout(timer);
    }
  }, [autoIgnite]);

  return (
    <h1
      ref={titleRef}
      className={`fire-text ${isIgnited ? 'ignited' : ''} ${className}`}
      // Injection de la variable CSS dynamique pour l'harmonie chromatique
      style={{ '--fire-color': color } as React.CSSProperties}
      onMouseEnter={() => igniteOnHover && setIsIgnited(true)}
      onMouseLeave={() => igniteOnHover && !autoIgnite && setIsIgnited(false)}
    >
      {text}
    </h1>
  );
}
