import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FolderPlus, Users, Calendar, MapPin } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { EventThumbnail } from "@/components/ui/event-thumbnail";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import EmptyState from "@/components/EmptyState";
import {
  getMyCollections,
  getPublicCollections as fetchPublicCollectionsApi,
  createCollection,
  getCollectionById,
  EventCollectionData,
  CollectionWithEvents,
} from "@/lib/event-collection-api";

const EventCollections: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<EventCollectionData[]>([]);
  const [publicCollections, setPublicCollections] = useState<EventCollectionData[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<CollectionWithEvents | null>(null);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [creating, setCreating] = useState(false);
  const [collectionData, setCollectionData] = useState({
    name: "",
    description: "",
    isPublic: false,
    coverImage: "",
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  // const { user } = useAuth();

  useEffect(() => {
    fetchCollections();
    fetchPublicCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await getMyCollections();
      if (response.success) {
        setCollections(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicCollections = async () => {
    try {
      const response = await fetchPublicCollectionsApi();
      if (response.success) {
        setPublicCollections(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching public collections:", error);
      setPublicCollections([]);
    }
  };

  const handleSelectCollection = async (collection: EventCollectionData) => {
    try {
      setLoadingCollection(true);
      const response = await getCollectionById(collection.id);
      if (response.success) {
        setSelectedCollection(response.data);
      }
    } catch (error) {
      console.error("Error fetching collection details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load collection details",
      });
    } finally {
      setLoadingCollection(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!collectionData.name.trim()) {
      toast({
        title: "Error",
        description: "Collection name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const response = await createCollection({
        name: collectionData.name,
        description: collectionData.description || undefined,
        isPublic: collectionData.isPublic,
        coverImage: collectionData.coverImage || undefined,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Collection created successfully",
        });
        setCollectionData({ name: "", description: "", isPublic: false, coverImage: "" });
        setShowCreateDialog(false);
        fetchCollections();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to create collection",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="xl" className="text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Event Collections</h1>
          <p className="text-muted-foreground">
            Organize and share your favorite events
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
              <DialogDescription>
                Create a collection to organize your favorite events
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Collection Name</Label>
                <Input
                  id="name"
                  value={collectionData.name}
                  onChange={(e) => setCollectionData({ ...collectionData, name: e.target.value })}
                  placeholder="My Favorite Events"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={collectionData.description}
                  onChange={(e) => setCollectionData({ ...collectionData, description: e.target.value })}
                  placeholder="Describe your collection..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={collectionData.isPublic}
                  onChange={(e) => setCollectionData({ ...collectionData, isPublic: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isPublic">Make this collection public</Label>
              </div>
              <Button
                className="w-full"
                onClick={handleCreateCollection}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Creating collection...
                  </>
                ) : (
                  "Create Collection"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my-collections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-collections">My Collections</TabsTrigger>
          <TabsTrigger value="public">Public Collections</TabsTrigger>
        </TabsList>

        <TabsContent value="my-collections" className="space-y-6">
          {collections.length === 0 ? (
            <EmptyState
              icon={FolderPlus}
              title="No Collections Yet"
              description="Create your first collection to organize your favorite events!"
              action={{
                label: "Create Collection",
                onClick: () => setShowCreateDialog(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card
                  key={collection.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSelectCollection(collection)}
                >
                  {collection.coverImage && (
                    <div className="h-32 overflow-hidden rounded-t-lg">
                      <img
                        src={collection.coverImage}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{collection.name}</CardTitle>
                      {collection.isPublic && (
                        <Badge variant="secondary">Public</Badge>
                      )}
                    </div>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {collection._count?.events || collection.eventCount || 0} events
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {collection._count?.followers || collection.followerCount || 0} followers
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public" className="space-y-6">
          {publicCollections.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No public collections found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicCollections.map((collection) => (
                <Card
                  key={collection.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSelectCollection(collection)}
                >
                  {collection.coverImage && (
                    <div className="h-32 overflow-hidden rounded-t-lg">
                      <img
                        src={collection.coverImage}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{collection.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          by {collection.user?.firstName} {collection.user?.lastName}
                        </p>
                      </div>
                      <Badge variant="secondary">Public</Badge>
                    </div>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {collection._count?.events || collection.eventCount || 0} events
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {collection._count?.followers || collection.followerCount || 0} followers
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Collection Detail Dialog */}
      <Dialog open={!!selectedCollection || loadingCollection} onOpenChange={() => setSelectedCollection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {loadingCollection ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="xl" className="text-primary" />
            </div>
          ) : selectedCollection && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCollection.name}</DialogTitle>
                <DialogDescription>
                  {selectedCollection.description || "Event collection"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Collection Info */}
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {selectedCollection._count?.events || selectedCollection.eventCount || 0} events
                  </Badge>
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {selectedCollection._count?.followers || selectedCollection.followerCount || 0} followers
                  </Badge>
                  {selectedCollection.isPublic && (
                    <Badge>Public</Badge>
                  )}
                </div>

                {/* Events in Collection */}
                <div>
                  <h3 className="font-semibold mb-3">Events in this Collection</h3>
                  {selectedCollection.events && selectedCollection.events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCollection.events.map((item) => (
                        <Card
                          key={item.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/event/${item.event.id}`)}
                        >
                          <div className="relative">
                            <EventThumbnail
                              src={item.event.coverImage || ""}
                              alt={item.event.title}
                              category={item.event.category || ""}
                              size="md"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                              {item.event.title}
                            </h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(item.event.startDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{item.event.location || item.event.venueName || "Online"}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No events in this collection yet</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCollections;
