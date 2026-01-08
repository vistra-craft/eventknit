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
 * Unified BackButton Component
 *
 * A consistent back navigation button used across the application.
 * Style: text-sm, subtle gray hover background, muted text that darkens on hover.
 *
 * Usage:
 * - <BackButton /> - Goes back one page
 * - <BackButton to="/dashboard" /> - Navigates to specific route
 * - <BackButton label="Back to events" /> - Custom label
 * - <BackButton onClick={() => handleBack()} /> - Custom handler
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
      className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
