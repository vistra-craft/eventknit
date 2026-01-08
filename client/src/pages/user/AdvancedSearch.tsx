/* eslint-disable @typescript-eslint/no-explicit-any, no-case-declarations */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Save, Trash2, Bell, Filter, X } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { useNavigate } from "react-router-dom";
import { getEvents } from "@/lib/event-api";
import { createSavedSearch, getUserSavedSearches, deleteSavedSearch, executeSavedSearch } from "@/lib/user-dashboard-api";
import { EventThumbnail } from "@/components/ui/event-thumbnail";
import EmptyState from "@/components/EmptyState";

const AdvancedSearch: React.FC = () => {
  const [searching, setSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    location: "",
    dateRange: "",
    priceRange: "",
    eventType: "",
  });
  const [savedSearchName, setSavedSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const response = await getUserSavedSearches();
      if (response.success && response.data) {
        setSavedSearches(response.data.searches || []);
      }
    } catch (error) {
      console.error("Error fetching saved searches:", error);
    }
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      const searchFilters: any = {
        status: "APPROVED",
        type: "PUBLIC",
      };

      if (filters.search) searchFilters.search = filters.search;
      if (filters.category && filters.category !== "all") searchFilters.category = filters.category;
      if (filters.location) {
        // Location filtering will be done client-side for now
      }

      const response = await getEvents(searchFilters);
      if (response.success && response.data) {
        let results = response.data.events || [];

        // Apply client-side filters
        if (filters.location) {
          results = results.filter((event: any) =>
            event.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
            event.venue?.toLowerCase().includes(filters.location.toLowerCase())
          );
        }

        if (filters.priceRange && filters.priceRange !== "any") {
          results = results.filter((event: any) => {
            const price = typeof event.price === "number" ? event.price : 0;
            const isFree = event.isFree || price === 0;

            switch (filters.priceRange) {
              case "free":
                return isFree;
              case "under-25":
                return !isFree && price < 25;
              case "25-50":
                return !isFree && price >= 25 && price <= 50;
              case "50-100":
                return !isFree && price >= 50 && price <= 100;
              case "100-plus":
                return !isFree && price > 100;
              default:
                return true;
            }
          });
        }

        if (filters.eventType && filters.eventType !== "all") {
          results = results.filter((event: any) => {
            if (filters.eventType === "online") return event.isOnline;
            if (filters.eventType === "in-person") return !event.isOnline;
            return true;
          });
        }

        if (filters.dateRange && filters.dateRange !== "anytime") {
          const now = new Date();
          results = results.filter((event: any) => {
            const eventDate = new Date(event.startDate);
            switch (filters.dateRange) {
              case "today":
                return eventDate.toDateString() === now.toDateString();
              case "tomorrow":
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return eventDate.toDateString() === tomorrow.toDateString();
              case "this-week":
                const weekEnd = new Date(now);
                weekEnd.setDate(weekEnd.getDate() + 7);
                return eventDate >= now && eventDate <= weekEnd;
              case "this-weekend":
                const saturday = new Date(now);
                saturday.setDate(saturday.getDate() + (6 - now.getDay()));
                const sunday = new Date(saturday);
                sunday.setDate(sunday.getDate() + 1);
                return eventDate >= saturday && eventDate <= sunday;
              case "next-week":
                const nextWeekStart = new Date(now);
                nextWeekStart.setDate(nextWeekStart.getDate() + 7);
                const nextWeekEnd = new Date(nextWeekStart);
                nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
                return eventDate >= nextWeekStart && eventDate <= nextWeekEnd;
              case "next-month":
                const nextMonth = new Date(now);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                return eventDate >= now && eventDate <= nextMonth;
              default:
                return true;
            }
          });
        }

        setSearchResults(results);
      }
    } catch (error) {
      console.error("Error searching:", error);
      toast({
        title: "Error",
        description: "Failed to search events",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!savedSearchName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your saved search",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await createSavedSearch({
        name: savedSearchName,
        searchQuery: filters.search || "",
        filters: filters,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Search saved successfully",
        });
        setSavedSearchName("");
        setShowSaveDialog(false);
        fetchSavedSearches();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save search",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSavedSearch = async (searchId: string) => {
    try {
      const response = await deleteSavedSearch(searchId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Saved search deleted",
        });
        fetchSavedSearches();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete search",
        variant: "destructive",
      });
    }
  };

  const handleExecuteSavedSearch = async (searchId: string) => {
    try {
      const response = await executeSavedSearch(searchId);
      if (response.success && response.data) {
        setFilters({
          ...filters,
          search: response.data.searchQuery || "",
          ...response.data.filters,
        });
        handleSearch();
      }
    } catch (error) {
      console.error("Error executing saved search:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Advanced Search</h1>
        <p className="text-muted-foreground">
          Find events with advanced filters and save your searches
        </p>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList>
          <TabsTrigger value="search">Search Events</TabsTrigger>
          <TabsTrigger value="saved">Saved Searches</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Search Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Search Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search events..."
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters({ ...filters, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Music">Music</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    placeholder="City, State, or Venue"
                  />
                </div>
                <div>
                  <Label htmlFor="dateRange">Date Range</Label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anytime">Any Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-weekend">This Weekend</SelectItem>
                      <SelectItem value="next-week">Next Week</SelectItem>
                      <SelectItem value="next-month">Next Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priceRange">Price Range</Label>
                  <Select
                    value={filters.priceRange}
                    onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Price</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="under-25">Under $25</SelectItem>
                      <SelectItem value="25-50">$25 - $50</SelectItem>
                      <SelectItem value="50-100">$50 - $100</SelectItem>
                      <SelectItem value="100-plus">$100+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={filters.eventType}
                    onValueChange={(value) => setFilters({ ...filters, eventType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="in-person">In-Person</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!filters.search && Object.values(filters).every(v => !v || v === "all" || v === "anytime" || v === "any")}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilters({
                      search: "",
                      category: "",
                      location: "",
                      dateRange: "",
                      priceRange: "",
                      eventType: "",
                    });
                    setSearchResults([]);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {searchResults.length} {searchResults.length === 1 ? "event" : "events"} found
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((event) => (
                  <Card
                    key={event.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    <div className="relative">
                      <EventThumbnail
                        src={event.image}
                        alt={event.title}
                        category={event.category || ""}
                        size="lg"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{new Date(event.startDate).toLocaleDateString()}</p>
                        <p>{event.location}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          {savedSearches.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No Saved Searches"
              description="Save your search filters to quickly find events later!"
            />
          ) : (
            <div className="space-y-4">
              {savedSearches.map((search) => (
                <Card key={search.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{search.name}</h3>
                          {search.notifyOnNewEvents && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              Notifications On
                            </Badge>
                          )}
                        </div>
                        {search.searchQuery && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Query: {search.searchQuery}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {search.filters && Object.entries(search.filters).map(([key, value]: [string, any]) => {
                            if (!value || value === "all" || value === "anytime" || value === "any") return null;
                            return (
                              <Badge key={key} variant="outline">
                                {key}: {value}
                              </Badge>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Last searched: {search.lastSearchedAt ? new Date(search.lastSearchedAt).toLocaleDateString() : "Never"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExecuteSavedSearch(search.id)}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Run
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSavedSearch(search.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="searchName">Search Name</Label>
                <Input
                  id="searchName"
                  value={savedSearchName}
                  onChange={(e) => setSavedSearchName(e.target.value)}
                  placeholder="e.g., Tech Events in NYC"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notify"
                  className="rounded"
                />
                <Label htmlFor="notify">Notify me when new events match this search</Label>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSaveSearch}>
                  Save
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSavedSearchName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
