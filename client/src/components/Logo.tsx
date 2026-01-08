import React from 'react';
import { Link } from 'react-router-dom';

type LogoProps = {
  text?: string;
  textOnly?: boolean;
  showText?: boolean;
  to?: string;
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'default' | 'lg';
};

/**
 * EventKnit Logo Component
 * Uses design system tokens: bg-primary for icon, text-foreground for text
 *
 * Usage:
 * - <Logo /> - Full logo with icon and text, links to home
 * - <Logo showText={false} /> - Icon only
 * - <Logo textOnly /> - Text only
 * - <Logo size="sm" /> - Small size (useful in headers)
 * - <Logo to="/dashboard" /> - Links to specific route
 * - <Logo onClick={() => {}} /> - Custom click handler
 */
const Logo: React.FC<LogoProps> = ({
  text = 'EventKnit',
  textOnly = false,
  showText = true,
  to = '/',
  className = '',
  onClick,
  size = 'default'
}) => {
  const sizeClasses = {
    sm: { icon: 'w-7 h-7', text: 'text-sm', letter: 'text-xs' },
    default: { icon: 'w-8 h-8', text: 'text-base', letter: 'text-sm' },
    lg: { icon: 'w-10 h-10', text: 'text-xl', letter: 'text-base' }
  };

  const sizes = sizeClasses[size];

  const content = textOnly ? (
    <span className={`font-semibold text-foreground ${sizes.text} ${className}`}>{text}</span>
  ) : (
    <div
      className={`inline-flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`${sizes.icon} bg-primary rounded-lg flex items-center justify-center`}>
        <span className={`text-primary-foreground font-bold ${sizes.letter}`}>E</span>
      </div>
      {showText && <span className={`font-semibold text-foreground ${sizes.text}`}>{text}</span>}
    </div>
  );

  if (onClick) {
    return <>{content}</>;
  }

  return to ? <Link to={to}>{content}</Link> : <>{content}</>;
};

export default Logo;
