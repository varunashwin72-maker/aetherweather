import type { HTMLAttributes, ReactNode } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  strong?: boolean;
  glow?: boolean;
  as?: 'div' | 'section' | 'article';
}

export function GlassCard({ children, strong, glow, className = '', ...rest }: GlassCardProps) {
  const base = strong ? 'glass-strong' : 'glass';
  const glowCls = glow ? 'shadow-glow' : 'shadow-glass';
  return (
    <div
      className={`${base} ${glowCls} rounded-2xl border border-white/10 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
