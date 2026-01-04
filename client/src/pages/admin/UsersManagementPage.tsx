import { useState } from "react";
import { Users, Shield, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "./AdminLayout";
import StaffManagementContent from "./StaffManagementContent";
import OrganizersContent from "./OrganizersContent";
import AttendeesPage from "./AttendeesPage";

const UsersManagementPage = () => {
  const [activeTab, setActiveTab] = useState("staff");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage staff, organizers, and attendees</p>
          </div>
        </div>

        {/* Tabs */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="staff"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 data-[state=inactive]:hover:bg-accent-coral data-[state=inactive]:hover:text-white transition-colors"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Staff
                </TabsTrigger>
                <TabsTrigger
                  value="organizers"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 data-[state=inactive]:hover:bg-accent-coral data-[state=inactive]:hover:text-white transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Organizers
                </TabsTrigger>
                <TabsTrigger
                  value="attendees"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 data-[state=inactive]:hover:bg-accent-coral data-[state=inactive]:hover:text-white transition-colors"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Attendees
                </TabsTrigger>
              </TabsList>

              <TabsContent value="staff" className="m-0 p-6">
                <StaffManagementContent />
              </TabsContent>

              <TabsContent value="organizers" className="m-0 p-6">
                <OrganizersContent />
              </TabsContent>

              <TabsContent value="attendees" className="m-0 p-6">
                <AttendeesPage />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default UsersManagementPage;

