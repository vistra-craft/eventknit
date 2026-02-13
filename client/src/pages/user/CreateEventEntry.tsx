/**
 * Create Event Entry Point
 * Role-aware routing for event creation
 * - ORGANIZER: Navigate to event creation
 * - ATTENDEE: Show "Become an Organizer" modal
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';
import { BecomeOrganizerModal } from '../../components/BecomeOrganizerModal';
import { Loader } from '../../components/ui/loader';

const CreateEventEntry = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) {
      // Not authenticated, redirect to login
      navigate('/auth/signin');
      return;
    }

    // Check if user can organize
    const canOrganize =
      user.role === UserRole.ORGANIZER ||
      user.role === UserRole.ORGANIZER_STAFF ||
      user.role === UserRole.ORGANIZER_TELLER;

    if (canOrganize) {
      // User is already an organizer, navigate to event creation
      navigate('/organizer/events/create');
    } else {
      // User is an attendee, show upgrade modal
      setShowModal(true);
    }
  }, [user, navigate]);

  const handleModalClose = () => {
    setShowModal(false);
    // Navigate back to dashboard
    navigate('/user/dashboard');
  };

  const handleUpgradeSuccess = () => {
    // After successful upgrade, navigate to event creation
    setShowModal(false);
    navigate('/organizer/events/create');
  };

  // Show loading while checking user role
  if (!showModal && user && user.role !== UserRole.ORGANIZER) {
    return (
      <div className="container mx-auto px-6 py-16">
        <div className="flex items-center justify-center">
          <Loader size="default" />
        </div>
      </div>
    );
  }

  return (
    <>
      <BecomeOrganizerModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleUpgradeSuccess}
      />
    </>
  );
};

export default CreateEventEntry;
