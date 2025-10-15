import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to user type selection immediately
    navigate('/auth/user-type', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eventknit mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to registration...</p>
      </div>
    </div>
  );
};

export default SignUp;