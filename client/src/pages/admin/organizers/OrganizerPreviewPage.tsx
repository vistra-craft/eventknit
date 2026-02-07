import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Mail, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { getUserById, type User } from "@/lib/admin-api";
import { getEventStatusBadgeClass } from "@/lib/utils/event-badge-helpers";
import { useToast } from "@/hooks/useToast";

const OrganizerPreviewPage = () => {
  const { organizerId } = useParams<{ organizerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizer, setOrganizer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizer = async () => {
      if (!organizerId) return;

      try {
        setLoading(true);
        const response = await getUserById(organizerId);
        if (response.success && response.data) {
          setOrganizer(response.data.user);
        } else {
          toast({
            title: "Error",
            description: "Failed to load organizer details",
            variant: "destructive",
          });
          navigate("/admin/users/organizers");
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load organizer details";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        navigate("/admin/users/organizers");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizer();
  }, [organizerId, navigate, toast]);

  const getStatusBadge = (status: string) => {
    return getEventStatusBadgeClass(status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading organizer details...</p>
          </div>
        </div>
    );
  }

  if (!organizer) {
    return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Organizer not found</p>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/users/organizers")}
            className="mt-4"
          >
            Back to Organizers
          </Button>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/users/organizers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Organizer Preview</h1>
            <p className="text-sm text-muted-foreground">View organizer details</p>
          </div>
          <Button
            variant="default"
            onClick={() => navigate(`/admin/users/organizers/${organizerId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Organizer
          </Button>
        </div>

        {/* Organizer Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Organizer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar
                  src={undefined}
                  name={`${organizer.firstName} ${organizer.lastName}`}
                  alt={`${organizer.firstName} ${organizer.lastName}`}
                  size="xl"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    {organizer.firstName} {organizer.lastName}
                  </h2>
                  <Badge className={getStatusBadge(organizer.status)}>
                    {organizer.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{organizer.email}</p>
                  </div>
                </div>
                {organizer.businessEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Business Email</p>
                      <p className="font-medium">{organizer.businessEmail}</p>
                    </div>
                  </div>
                )}
                {organizer.organizationName && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Organization</p>
                      <p className="font-medium">{organizer.organizationName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{formatDate(organizer.createdAt)}</p>
                  </div>
                </div>
                {organizer.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{organizer.phoneNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default OrganizerPreviewPage;



