import React from "react";

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
}

interface User {
  name: string;
  email: string;
  initials: string;
}

interface Registration {
  ticketId?: string;
  status?: string;
}

interface DashboardAbstractsProps {
  eventData: EventData;
  user: User;
  registration?: Registration;
}

const DashboardAbstracts: React.FC<DashboardAbstractsProps> = ({ eventData, user, registration }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Submit Abstract</h1>
      <div className="bg-card rounded-lg shadow-card p-6">
        <p className="text-muted-foreground">Abstract submission section coming soon...</p>
      </div>
    </div>
  );
};

export default DashboardAbstracts;

