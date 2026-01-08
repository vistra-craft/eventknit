/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Star, Tag } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/useToast";
import { getUserInterests, upsertInterest, removeInterest, updateInterestWeight } from "@/lib/user-dashboard-api";
import EmptyState from "@/components/EmptyState";

const InterestManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newWeight, setNewWeight] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      setLoading(true);
      const response = await getUserInterests();
      if (response.success && response.data) {
        setInterests(response.data.interests || []);
      }
    } catch (error) {
      console.error("Error fetching interests:", error);
      toast({
        title: "Error",
        description: "Failed to load interests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterest = async () => {
    if (!newCategory.trim()) {
      toast({
        title: "Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const tagsArray = newTags.split(",").map(t => t.trim()).filter(t => t);
      const response = await upsertInterest({
        category: newCategory.trim(),
        subcategory: newSubcategory.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        weight: newWeight,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Interest added successfully",
        });
        setNewCategory("");
        setNewSubcategory("");
        setNewTags("");
        setNewWeight(5);
        fetchInterests();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add interest",
        variant: "destructive",
      });
    }
  };

  const handleRemoveInterest = async (category: string) => {
    try {
      const response = await removeInterest(category);
      if (response.success) {
        toast({
          title: "Success",
          description: "Interest removed successfully",
        });
        fetchInterests();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove interest",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWeight = async (category: string, weight: number) => {
    try {
      const response = await updateInterestWeight(category, weight);
      if (response.success) {
        fetchInterests();
      }
    } catch (error) {
      console.error("Error updating weight:", error);
    }
  };

  const renderStars = (weight: number, onChange?: (weight: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 cursor-pointer transition-colors ${
              star <= weight
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
            onClick={() => onChange && onChange(star)}
          />
        ))}
      </div>
    );
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Interest Management</h1>
        <p className="text-muted-foreground">
          Manage your event interests to get better personalized recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Interest Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add Interest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g., Technology, Music, Sports"
              />
            </div>
            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                placeholder="e.g., AI, Jazz, Football"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="e.g., startup, networking, workshop"
              />
            </div>
            <div>
              <Label>Interest Level (1-10)</Label>
              <div className="mt-2">
                {renderStars(newWeight, setNewWeight)}
                <p className="text-xs text-muted-foreground mt-1">
                  {newWeight}/10
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={handleAddInterest}>
              <Plus className="h-4 w-4 mr-2" />
              Add Interest
            </Button>
          </CardContent>
        </Card>

        {/* Interests List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Interests</CardTitle>
          </CardHeader>
          <CardContent>
            {interests.length === 0 ? (
              <EmptyState
                icon={Tag}
                title="No Interests Yet"
                description="Add your interests to get personalized event recommendations!"
              />
            ) : (
              <div className="space-y-4">
                {interests.map((interest) => (
                  <div
                    key={interest.id}
                    className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{interest.category}</h3>
                        {interest.subcategory && (
                          <Badge variant="secondary">{interest.subcategory}</Badge>
                        )}
                      </div>
                      {interest.tags && interest.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {interest.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Interest Level:</span>
                        {renderStars(interest.weight, (weight) => handleUpdateWeight(interest.category, weight))}
                        <span className="text-sm text-muted-foreground">({interest.weight}/10)</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveInterest(interest.category)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterestManagement;
