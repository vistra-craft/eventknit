import React from 'react';
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

type LogoProps = {
  text?: string;
  textOnly?: boolean;
  to?: string;
  className?: string;
  onClick?: () => void;
};

/**
 * EventKnit Logo Component
 * Always displays with coral color for both icon and text (matching signup page style)
 */
const Logo: React.FC<LogoProps> = ({ 
  text = 'EventKnit', 
  textOnly = false, 
  to = '/', 
  className = '',
  onClick
}) => {
  const content = textOnly ? (
    <span className={`text-xl font-bold text-accent-coral ${className}`}>{text}</span>
  ) : (
    <div 
      className={`flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="w-8 h-8 bg-accent-coral rounded-lg flex items-center justify-center">
        <Calendar className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-bold text-accent-coral">{text}</span>
    </div>
  );

  if (onClick) {
    return <>{content}</>;
  }

  return to ? <Link to={to}>{content}</Link> : <>{content}</>;
};

export default Logo;
