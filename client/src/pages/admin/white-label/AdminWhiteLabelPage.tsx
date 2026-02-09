import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Palette, Globe, Plus } from 'lucide-react';
import BrandingTab from './BrandingTab';
import CustomDomainsTab from './CustomDomainsTab';
import BrandingSetupDialog from './BrandingSetupDialog';
import type { WhiteLabelBranding, OrganizerInfo } from '@/lib/white-label-api';

type BrandingWithOrg = WhiteLabelBranding & { organizer?: OrganizerInfo };

const AdminWhiteLabelPage = () => {
  const [activeTab, setActiveTab] = useState('branding');
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [editBranding, setEditBranding] = useState<BrandingWithOrg | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEditBranding = (branding: BrandingWithOrg) => {
    setEditBranding(branding);
    setShowSetupDialog(true);
  };

  const handleSetupNew = () => {
    setEditBranding(null);
    setShowSetupDialog(true);
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">White Label Management</h1>
            <p className="text-page-subtitle mt-1">
              Manage organizer branding, custom domains, and white-label settings
            </p>
          </div>
          <Button onClick={handleSetupNew}>
            <Plus className="h-4 w-4 mr-2" />
            Set Up Branding
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="branding" className="flex items-center gap-1.5">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="domains" className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              Custom Domains
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="mt-4">
            <BrandingTab onEditBranding={handleEditBranding} refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="domains" className="mt-4">
            <CustomDomainsTab refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Branding Setup/Edit Dialog */}
      <BrandingSetupDialog
        open={showSetupDialog}
        onOpenChange={setShowSetupDialog}
        editBranding={editBranding}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default AdminWhiteLabelPage;
