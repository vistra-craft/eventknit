import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const VerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get redirect path from location state or query params
    const redirectPath = (location.state as { redirectAfterVerification?: string } | null)?.redirectAfterVerification ||
                        new URLSearchParams(location.search).get('redirect');
    
    // Redirect to KYCVerificationPage with the same redirect path
    navigate('/organizer/kyc', {
      state: redirectPath ? { redirectAfterVerification: redirectPath } : {},
      replace: true
    });
  }, [navigate, location]);

  return null; // No UI needed as we're redirecting
};

export default VerificationPage;
