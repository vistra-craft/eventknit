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

interface DashboardSpeakersProps {
  eventData: EventData;
}

const DashboardSpeakers: React.FC<DashboardSpeakersProps> = ({ eventData }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Speakers</h1>
      <div className="bg-card rounded-lg shadow-card p-6">
        <p className="text-muted-foreground">Speakers section coming soon...</p>
      </div>
    </div>
  );
};

export default DashboardSpeakers;

