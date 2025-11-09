import React from "react";
import CreateEventStepwise from "../CreateEventStepwise";
import OrganizerLayout from "./OrganizerLayout";

const CreateEventPage: React.FC = () => {
  return (
    <OrganizerLayout>
      <CreateEventStepwise />
    </OrganizerLayout>
  );
};

export default CreateEventPage;
