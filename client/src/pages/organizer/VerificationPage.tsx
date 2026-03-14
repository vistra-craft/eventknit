import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const VerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Get redirect path from location state or query params
    const redirectPath = (location.state as { redirectAfterVerification?: string } | null)?.redirectAfterVerification ||
                        new URLSearchParams(location.search).get('redirect');

    // Role-aware redirect to KYC page
    const isOrganizer = user && ['ORGANIZER', 'ORGANIZER_ADMIN', 'ORGANIZER_TELLER'].includes(user.role);
    const kycPath = isOrganizer ? '/organizer/kyc' : '/user/kyc';

    navigate(kycPath, {
      state: redirectPath ? { redirectAfterVerification: redirectPath } : {},
      replace: true
    });
  }, [navigate, location, user]);

  return null; // No UI needed as we're redirecting
};

export default VerificationPage;
