import React from "react";
import CreateEventStepwise from "../CreateEventStepwise";
import AdminLayout from "./AdminLayout";

const AdminCreateEventPage: React.FC = () => {
  return (
    <AdminLayout>
      <CreateEventStepwise />
    </AdminLayout>
  );
};

export default AdminCreateEventPage;


