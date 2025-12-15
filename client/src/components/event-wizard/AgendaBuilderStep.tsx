import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Calendar, Users, Briefcase, Award } from 'lucide-react';

interface AgendaItem {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  speakers: string[];
}

interface Speaker {
  id: string; // Temporary ID for UI tracking
  name: string;
  title: string;
  bio: string;
  image: string;
}

interface Exhibitor {
  name: string;
  description: string;
  logo: string;
  contactEmail: string;
  booth: string;
}

interface Sponsor {
  name: string;
  level: string;
  logo: string;
}

interface AgendaBuilderStepProps {
  agenda: AgendaItem[];
  speakers: Speaker[];
  exhibitors: Exhibitor[];
  sponsors: Sponsor[];
  onUpdate: (
    field: 'agenda' | 'speakers' | 'exhibitors' | 'sponsors',
    value: AgendaItem[] | Speaker[] | Exhibitor[] | Sponsor[]
  ) => void;
}

export const AgendaBuilderStep: React.FC<AgendaBuilderStepProps> = ({
  agenda,
  speakers,
  exhibitors,
  sponsors,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState('schedule');

  // --- Schedule Handlers ---
  const addAgendaItem = () => {
    onUpdate('agenda', [...agenda, { title: '', description: '', startTime: '', endTime: '', speakers: [] }]);
  };

  const updateAgendaItem = (index: number, field: keyof AgendaItem, value: AgendaItem[keyof AgendaItem]) => {
    const newAgenda = [...agenda];
    newAgenda[index] = { ...newAgenda[index], [field]: value };
    onUpdate('agenda', newAgenda);
  };

  const removeAgendaItem = (index: number) => {
    const newAgenda = [...agenda];
    newAgenda.splice(index, 1);
    onUpdate('agenda', newAgenda);
  };

  // --- Speaker Handlers ---
  const addSpeaker = () => {
    onUpdate('speakers', [...speakers, { id: crypto.randomUUID(), name: '', title: '', bio: '', image: '' }]);
  };

  const updateSpeaker = (index: number, field: keyof Speaker, value: Speaker[keyof Speaker]) => {
    const newSpeakers = [...speakers];
    newSpeakers[index] = { ...newSpeakers[index], [field]: value };
    onUpdate('speakers', newSpeakers);
  };

  const removeSpeaker = (index: number) => {
    const newSpeakers = [...speakers];
    newSpeakers.splice(index, 1);
    onUpdate('speakers', newSpeakers);
  };

  // --- Exhibitor Handlers ---
  const addExhibitor = () => {
    onUpdate('exhibitors', [...exhibitors, { name: '', description: '', logo: '', contactEmail: '', booth: '' }]);
  };

  const updateExhibitor = (index: number, field: keyof Exhibitor, value: Exhibitor[keyof Exhibitor]) => {
    const newExhibitors = [...exhibitors];
    newExhibitors[index] = { ...newExhibitors[index], [field]: value };
    onUpdate('exhibitors', newExhibitors);
  };

    const removeExhibitor = (index: number) => {
    const newExhibitors = [...exhibitors];
    newExhibitors.splice(index, 1);
    onUpdate('exhibitors', newExhibitors);
  };

  // --- Sponsor Handlers ---
  const addSponsor = () => {
    onUpdate('sponsors', [...sponsors, { name: '', level: 'bronze', logo: '' }]);
  };

  const updateSponsor = (index: number, field: keyof Sponsor, value: Sponsor[keyof Sponsor]) => {
    const newSponsors = [...sponsors];
    newSponsors[index] = { ...newSponsors[index], [field]: value };
    onUpdate('sponsors', newSponsors);
  };

  const removeSponsor = (index: number) => {
    const newSponsors = [...sponsors];
    newSponsors.splice(index, 1);
    onUpdate('sponsors', newSponsors);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Build Your Event Agenda</h2>
        <p className="text-muted-foreground">
          Create a detailed schedule and manage speakers, exhibitors, and sponsors.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Schedule
          </TabsTrigger>
          <TabsTrigger value="speakers" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Speakers
          </TabsTrigger>
          <TabsTrigger value="exhibitors" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Exhibitors
          </TabsTrigger>
          <TabsTrigger value="sponsors" className="flex items-center gap-2">
            <Award className="h-4 w-4" /> Sponsors
          </TabsTrigger>
        </TabsList>

        {/* --- Schedule Tab --- */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Event Schedule</CardTitle>
                <CardDescription>Plan your sessions and timeline.</CardDescription>
              </div>
              <Button 
                onClick={addAgendaItem} 
                variant="ghost"
                className="text-primary hover:bg-accent-coral hover:text-white transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Session
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {agenda.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sessions added yet. Click "Add Session" to start.
                </div>
              ) : (
                agenda.map((item, index) => (
                  <div key={index} className="relative border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-destructive hover:text-destructive/90"
                      onClick={() => removeAgendaItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => updateAgendaItem(index, 'startTime', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => updateAgendaItem(index, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Session Title</Label>
                        <Input
                          placeholder="Keynote Speech, Panel Discussion, etc."
                          value={item.title}
                          onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Brief description of this session..."
                          value={item.description}
                          onChange={(e) => updateAgendaItem(index, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Speakers Tab --- */}
        <TabsContent value="speakers" className="space-y-4">
           <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Speakers</CardTitle>
                <CardDescription>Add profiles for your event speakers (Max 20).</CardDescription>
              </div>
              <Button 
                onClick={addSpeaker} 
                variant="ghost"
                className="text-primary hover:bg-accent-coral hover:text-white transition-colors flex items-center gap-2"
                disabled={speakers.length >= 20}
              >
                <Plus className="h-4 w-4" /> Add Speaker
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {speakers.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                  No speakers added yet.
                </div>
              ) : (
                speakers.map((speaker, index) => (
                  <div key={speaker.id} className="relative border rounded-lg p-4 bg-card/50">
                     <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-destructive hover:text-destructive/90"
                      onClick={() => removeSpeaker(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={speaker.name}
                          onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Title / Role</Label>
                        <Input
                          value={speaker.title}
                          onChange={(e) => updateSpeaker(index, 'title', e.target.value)}
                          placeholder="CEO, TechCorp"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          value={speaker.bio}
                          onChange={(e) => updateSpeaker(index, 'bio', e.target.value)}
                          placeholder="Short biography..."
                        />
                      </div>
                       <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Image URL</Label>
                         <Input
                          value={speaker.image}
                          onChange={(e) => updateSpeaker(index, 'image', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Exhibitors Tab --- */}
        <TabsContent value="exhibitors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Exhibitors</CardTitle>
                <CardDescription>List companies or groups exhibiting at your event.</CardDescription>
              </div>
              <Button 
                onClick={addExhibitor} 
                variant="ghost"
                className="text-primary hover:bg-accent-coral hover:text-white transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Exhibitor
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
               {exhibitors.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                  No exhibitors added yet.
                </div>
              ) : (
                exhibitors.map((exhibitor, index) => (
                  <div key={index} className="relative border rounded-lg p-4 bg-card/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-destructive hover:text-destructive/90"
                      onClick={() => removeExhibitor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={exhibitor.name}
                          onChange={(e) => updateExhibitor(index, 'name', e.target.value)}
                          placeholder="Company/Organization name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Booth Number</Label>
                         <Input
                          value={exhibitor.booth}
                          onChange={(e) => updateExhibitor(index, 'booth', e.target.value)}
                          placeholder="A1, B2, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <Input
                          type="email"
                          value={exhibitor.contactEmail}
                          onChange={(e) => updateExhibitor(index, 'contactEmail', e.target.value)}
                          placeholder="contact@example.com"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Logo URL</Label>
                        <Input
                          value={exhibitor.logo}
                          onChange={(e) => updateExhibitor(index, 'logo', e.target.value)}
                          placeholder="https://..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter the URL of the exhibitor's logo image
                        </p>
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={exhibitor.description}
                          onChange={(e) => updateExhibitor(index, 'description', e.target.value)}
                          placeholder="Brief description of the exhibitor..."
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* --- Sponsors Tab --- */}
        <TabsContent value="sponsors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sponsors</CardTitle>
                <CardDescription>Add companies or organizations sponsoring your event.</CardDescription>
              </div>
              <Button 
                onClick={addSponsor} 
                variant="ghost"
                className="text-primary hover:bg-accent-coral hover:text-white transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Sponsor
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {sponsors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sponsors added yet.
                </div>
              ) : (
                sponsors.map((sponsor, index) => (
                  <div key={index} className="relative border rounded-lg p-4 bg-card/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-destructive hover:text-destructive/90"
                      onClick={() => removeSponsor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sponsor Name</Label>
                        <Input
                          value={sponsor.name}
                          onChange={(e) => updateSponsor(index, 'name', e.target.value)}
                          placeholder="Company/Organization name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sponsorship Level</Label>
                        <Select
                          value={sponsor.level}
                          onValueChange={(value) => updateSponsor(index, 'level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="bronze">Bronze</SelectItem>
                            <SelectItem value="platinum">Platinum</SelectItem>
                            <SelectItem value="title">Title Sponsor</SelectItem>
                            <SelectItem value="presenting">Presenting Sponsor</SelectItem>
                            <SelectItem value="partner">Community Partner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Logo URL</Label>
                        <Input
                          value={sponsor.logo}
                          onChange={(e) => updateSponsor(index, 'logo', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

    </div>
  );
};
