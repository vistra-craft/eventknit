import React from "react";
import CreateEvent from "../CreateEvent";
import OrganizerLayout from "./OrganizerLayout";

const CreateEventPage: React.FC = () => {
  return (
    <OrganizerLayout>
      <CreateEvent showLayout={false} />
    </OrganizerLayout>
  );
};

export default CreateEventPage;
