import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Standardized back button component matching the auth page style.
 * Uses ArrowLeft icon with small text, hover effect changes background to accent-coral.
 */
const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = 'Back',
  onClick,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-primary hover:bg-accent-coral hover:text-white transition-colors ${className}`}
    >
      <ArrowLeft className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
