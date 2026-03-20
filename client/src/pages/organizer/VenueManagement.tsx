import { useState, useEffect, useCallback } from 'react';
import { Loader } from '@/components/ui/loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  type Venue,
} from '@/lib/venue-api';
import { Plus, Trash2, Edit, MapPin, Building } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const VenueManagement = () => {
  const { toast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [confirmDeleteVenue, setConfirmDeleteVenue] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    capacity: '',
    venueType: '',
    amenities: [] as string[],
  });

  const loadVenues = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVenues();
      setVenues(data);
    } catch (error: unknown) {
      showErrorToast(toast, error, 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const handleSubmit = async () => {
    try {
      if (editingVenue) {
        await updateVenue(editingVenue.id, {
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        });
        toast({
          title: 'Success',
          description: 'Venue updated successfully',
        });
      } else {
        await createVenue({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        });
        toast({
          title: 'Success',
          description: 'Venue created successfully',
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadVenues();
    } catch (error: unknown) {
      showErrorToast(toast, error, 'Failed to save venue');
    }
  };

  const handleDelete = async (venueId: string) => {
    try {
      await deleteVenue(venueId);
      toast({
        title: 'Success',
        description: 'Venue deleted successfully',
      });
      loadVenues();
    } catch (error: unknown) {
      showErrorToast(toast, error, 'Failed to delete venue');
    }
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      description: venue.description || '',
      address: venue.address || '',
      city: venue.city || '',
      state: venue.state || '',
      country: venue.country || '',
      postalCode: venue.postalCode || '',
      capacity: venue.capacity?.toString() || '',
      venueType: venue.venueType || '',
      amenities: venue.amenities || [],
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingVenue(null);
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      capacity: '',
      venueType: '',
      amenities: [],
    });
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader size="lg" className="mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading venues...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Venue Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your venues and create reusable venue configurations
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Venue
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVenue ? 'Edit Venue' : 'Create Venue'}</DialogTitle>
                <DialogDescription>
                  {editingVenue ? 'Update venue information' : 'Add a new venue to your account'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Venue Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Convention Center"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Venue description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="USA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="10001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venueType">Venue Type</Label>
                    <Input
                      id="venueType"
                      value={formData.venueType}
                      onChange={(e) => setFormData({ ...formData, venueType: e.target.value })}
                      placeholder="theatre, stadium, conference, etc."
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.name}>
                  {editingVenue ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {venues.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Venues</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first venue to use for events with reserved seating.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Venue
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {venues.map((venue) => (
              <Card key={venue.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        {venue.name}
                      </CardTitle>
                      {venue.venueType && (
                        <Badge variant="secondary" className="mt-2">
                          {venue.venueType}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(venue)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteVenue(venue.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {venue.description && (
                      <p className="text-muted-foreground">{venue.description}</p>
                    )}
                    {venue.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p>{venue.address}</p>
                          {(venue.city || venue.state || venue.country) && (
                            <p className="text-muted-foreground">
                              {[venue.city, venue.state, venue.country].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {venue.capacity && (
                      <p>
                        <span className="font-medium">Capacity:</span> {venue.capacity.toLocaleString()}
                      </p>
                    )}
                    {venue.amenities && venue.amenities.length > 0 && (
                      <div>
                        <span className="font-medium">Amenities:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {venue.amenities.map((amenity, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!confirmDeleteVenue} onOpenChange={() => setConfirmDeleteVenue(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this venue?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. The venue will be permanently deleted.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { handleDelete(confirmDeleteVenue!); setConfirmDeleteVenue(null); }}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

export default VenueManagement;

