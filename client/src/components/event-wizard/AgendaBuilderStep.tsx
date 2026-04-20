import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreatableSelect } from '@/components/ui/creatable-select';
import { Plus, Trash2, Copy, Calendar, Users, Briefcase, Award, ArrowUpDown, Link2, Linkedin, Globe, Twitter, Coffee, UtensilsCrossed, Handshake, ClipboardCheck } from 'lucide-react';
import type { AgendaItem, SpeakerItem, ExhibitorItem, SponsorItem } from './types';
import { SESSION_TYPES, SPONSORSHIP_LEVELS } from './types';
import { ImageUploadField } from './ImageUploadField';

// Quick-add session templates
const QUICK_ADD_TEMPLATES: { label: string; icon: React.ReactNode; item: Partial<AgendaItem> }[] = [
  {
    label: 'Registration',
    icon: <ClipboardCheck className="h-3.5 w-3.5" />,
    item: { title: 'Registration & Check-in', sessionType: 'registration', startTime: '08:00', endTime: '09:00' },
  },
  {
    label: 'Break',
    icon: <Coffee className="h-3.5 w-3.5" />,
    item: { title: 'Coffee Break', sessionType: 'break', startTime: '10:30', endTime: '11:00' },
  },
  {
    label: 'Lunch',
    icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
    item: { title: 'Lunch Break', sessionType: 'lunch', startTime: '12:30', endTime: '13:30' },
  },
  {
    label: 'Networking',
    icon: <Handshake className="h-3.5 w-3.5" />,
    item: { title: 'Networking Hour', sessionType: 'networking', startTime: '17:00', endTime: '18:00' },
  },
];

interface AgendaBuilderStepProps {
  agenda: AgendaItem[];
  speakers: SpeakerItem[];
  exhibitors: ExhibitorItem[];
  sponsors: SponsorItem[];
  eventStartDate?: string;
  eventEndDate?: string;
  onUpdate: (
    field: 'agenda' | 'speakers' | 'exhibitors' | 'sponsors',
    value: AgendaItem[] | SpeakerItem[] | ExhibitorItem[] | SponsorItem[]
  ) => void;
}

export const AgendaBuilderStep: React.FC<AgendaBuilderStepProps> = ({
  agenda = [],
  speakers = [],
  exhibitors = [],
  sponsors = [],
  eventStartDate,
  eventEndDate,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState('schedule');

  // Ensure arrays are always defined (wrapped in useMemo to stabilize references)
  const safeAgenda = useMemo(() => agenda || [], [agenda]);
  const safeSpeakers = speakers || [];
  const safeExhibitors = exhibitors || [];
  const safeSponsors = sponsors || [];

  // Sort agenda items chronologically
  const sortedAgenda = useMemo(() => {
    return [...safeAgenda].sort((a, b) => {
      const dateA = a.date || eventStartDate || '';
      const dateB = b.date || eventStartDate || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }, [safeAgenda, eventStartDate]);

  // Get unique rooms/tracks from agenda
  const existingRooms = useMemo(() => {
    const rooms = new Set<string>();
    safeAgenda.forEach(item => {
      if (item.room) rooms.add(item.room);
    });
    return Array.from(rooms);
  }, [safeAgenda]);

  // Find the latest end time on a given date (for auto-suggest)
  const getLatestEndTime = (date: string): string => {
    let latest = '';
    for (const item of safeAgenda) {
      const itemDate = item.date || eventStartDate || '';
      if (itemDate === date && item.endTime && item.endTime > latest) {
        latest = item.endTime;
      }
    }
    return latest;
  };

  // --- Schedule Handlers ---
  const addAgendaItem = (template?: Partial<AgendaItem>) => {
    const date = template?.date || eventStartDate || '';
    const suggestedStart = template?.startTime || getLatestEndTime(date);

    const newItem: AgendaItem = {
      id: crypto.randomUUID(),
      title: template?.title || '',
      description: template?.description || '',
      date,
      startTime: suggestedStart,
      endTime: template?.endTime || '',
      sessionType: template?.sessionType || 'other',
      room: template?.room || '',
      speakerIds: [],
    };
    onUpdate('agenda', [...safeAgenda, newItem]);
  };

  const duplicateAgendaItem = (index: number) => {
    const source = safeAgenda[index];
    const duplicate: AgendaItem = {
      ...source,
      id: crypto.randomUUID(),
    };
    const newAgenda = [...safeAgenda];
    newAgenda.splice(index + 1, 0, duplicate);
    onUpdate('agenda', newAgenda);
  };

  const updateAgendaItem = (index: number, field: keyof AgendaItem, value: AgendaItem[keyof AgendaItem]) => {
    const newAgenda = [...safeAgenda];
    newAgenda[index] = { ...newAgenda[index], [field]: value };
    onUpdate('agenda', newAgenda);
  };

  const removeAgendaItem = (index: number) => {
    const newAgenda = [...safeAgenda];
    newAgenda.splice(index, 1);
    onUpdate('agenda', newAgenda);
  };

  const sortAgendaChronologically = () => {
    onUpdate('agenda', sortedAgenda);
  };

  // --- Speaker Handlers ---
  const addSpeaker = () => {
    const newSpeaker: SpeakerItem = {
      id: crypto.randomUUID(),
      name: '',
      title: '',
      bio: '',
      image: '',
      company: '',
      website: '',
      linkedin: '',
      twitter: '',
    };
    onUpdate('speakers', [...safeSpeakers, newSpeaker]);
  };

  const updateSpeaker = (index: number, field: keyof SpeakerItem, value: SpeakerItem[keyof SpeakerItem]) => {
    const newSpeakers = [...safeSpeakers];
    newSpeakers[index] = { ...newSpeakers[index], [field]: value };
    onUpdate('speakers', newSpeakers);
  };

  const removeSpeaker = (index: number) => {
    const newSpeakers = [...safeSpeakers];
    newSpeakers.splice(index, 1);
    onUpdate('speakers', newSpeakers);
  };

  // --- Exhibitor Handlers ---
  const addExhibitor = () => {
    const newExhibitor: ExhibitorItem = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      logo: '',
      contactEmail: '',
      booth: '',
      website: '',
      category: '',
    };
    onUpdate('exhibitors', [...safeExhibitors, newExhibitor]);
  };

  const updateExhibitor = (index: number, field: keyof ExhibitorItem, value: ExhibitorItem[keyof ExhibitorItem]) => {
    const newExhibitors = [...safeExhibitors];
    newExhibitors[index] = { ...newExhibitors[index], [field]: value };
    onUpdate('exhibitors', newExhibitors);
  };

  const removeExhibitor = (index: number) => {
    const newExhibitors = [...safeExhibitors];
    newExhibitors.splice(index, 1);
    onUpdate('exhibitors', newExhibitors);
  };

  // --- Sponsor Handlers ---
  const addSponsor = () => {
    const newSponsor: SponsorItem = {
      id: crypto.randomUUID(),
      name: '',
      level: 'bronze',
      logo: '',
      website: '',
      description: '',
    };
    onUpdate('sponsors', [...safeSponsors, newSponsor]);
  };

  const updateSponsor = (index: number, field: keyof SponsorItem, value: SponsorItem[keyof SponsorItem]) => {
    const newSponsors = [...safeSponsors];
    newSponsors[index] = { ...newSponsors[index], [field]: value };
    onUpdate('sponsors', newSponsors);
  };

  const removeSponsor = (index: number) => {
    const newSponsors = [...safeSponsors];
    newSponsors.splice(index, 1);
    onUpdate('sponsors', newSponsors);
  };

  // Get session type color for badges
  const getSessionTypeColor = (type?: string) => {
    switch (type) {
      case 'keynote':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'workshop':
      case 'tutorial':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'panel':
      case 'roundtable':
      case 'fireside-chat':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'breakout':
      case 'lightning-talk':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'networking':
      case 'social':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'demo':
      case 'qa':
        return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
      case 'opening-ceremony':
      case 'closing-ceremony':
      case 'awards':
      case 'entertainment':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      case 'break':
      case 'lunch':
        return 'bg-muted text-muted-foreground border-border';
      case 'registration':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default:
        // Custom types get a subtle teal badge
        return 'bg-teal-500/10 text-teal-600 border-teal-500/20';
    }
  };

  // Resolve session type label (predefined or custom value)
  const getSessionTypeLabel = (type?: string): string => {
    if (!type) return 'Other';
    const predefined = SESSION_TYPES.find(t => t.value === type);
    if (predefined) return predefined.label;
    // Custom type — capitalize first letter of each word
    return type.replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Schedule
            {safeAgenda.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {safeAgenda.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="speakers" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Speakers
            {safeSpeakers.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {safeSpeakers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="exhibitors" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Exhibitors
            {safeExhibitors.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {safeExhibitors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sponsors" className="flex items-center gap-2">
            <Award className="h-4 w-4" /> Sponsors
            {safeSponsors.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {safeSponsors.length}
              </Badge>
            )}
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
              <div className="flex items-center gap-2">
                {safeAgenda.length > 1 && (
                  <Button
                    onClick={sortAgendaChronologically}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" /> Sort by Time
                  </Button>
                )}
                <Button
                  onClick={() => addAgendaItem()}
                  variant="ghost"
                  className="text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Session
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick-add templates */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center mr-1">Quick add:</span>
                {QUICK_ADD_TEMPLATES.map((tpl) => (
                  <Button
                    key={tpl.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => addAgendaItem(tpl.item)}
                  >
                    {tpl.icon}
                    {tpl.label}
                  </Button>
                ))}
              </div>

              {safeAgenda.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sessions added yet. Click "Add Session" or use the quick-add buttons above.
                </div>
              ) : (
                safeAgenda.map((item, index) => (
                  <div key={item.id || index} className="relative border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors">
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => duplicateAgendaItem(index)}
                        title="Duplicate session"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                        onClick={() => removeAgendaItem(index)}
                        title="Delete session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Session Type Badge */}
                    {item.sessionType && (
                      <Badge className={`mb-3 ${getSessionTypeColor(item.sessionType)}`}>
                        {getSessionTypeLabel(item.sessionType)}
                      </Badge>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Session Type</Label>
                        <CreatableSelect
                          value={item.sessionType || 'other'}
                          onChange={(value) => updateAgendaItem(index, 'sessionType', value)}
                          options={SESSION_TYPES}
                          placeholder="Select type"
                          customLabel="Custom type..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date {eventStartDate && <span className="text-xs text-muted-foreground">(optional)</span>}</Label>
                        <Input
                          type="date"
                          value={item.date || eventStartDate || ''}
                          onChange={(e) => updateAgendaItem(index, 'date', e.target.value)}
                          min={eventStartDate || undefined}
                          max={eventEndDate || undefined}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={item.startTime || ''}
                          onChange={(e) => updateAgendaItem(index, 'startTime', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={item.endTime || ''}
                          onChange={(e) => updateAgendaItem(index, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Session Title <span className="text-destructive">*</span></Label>
                        <Input
                          placeholder="Keynote Speech, Panel Discussion, etc."
                          value={item.title || ''}
                          onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Room / Track</Label>
                        <Input
                          placeholder="Main Hall, Room A, Track 1, etc."
                          value={item.room || ''}
                          onChange={(e) => updateAgendaItem(index, 'room', e.target.value)}
                          list={`rooms-${index}`}
                        />
                        {existingRooms.length > 0 && (
                          <datalist id={`rooms-${index}`}>
                            {existingRooms.map((room) => (
                              <option key={room} value={room} />
                            ))}
                          </datalist>
                        )}
                      </div>
                    </div>

                    {/* Speaker Assignment */}
                    {safeSpeakers.length > 0 && item.sessionType !== 'break' && item.sessionType !== 'lunch' && item.sessionType !== 'registration' && (
                      <div className="space-y-2 mb-4">
                        <Label>Assigned Speakers</Label>
                        <Select
                          value=""
                          onValueChange={(speakerId) => {
                            const currentIds = item.speakerIds || [];
                            if (!currentIds.includes(speakerId)) {
                              updateAgendaItem(index, 'speakerIds', [...currentIds, speakerId]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Add a speaker to this session" />
                          </SelectTrigger>
                          <SelectContent>
                            {safeSpeakers
                              .filter(s => !(item.speakerIds || []).includes(s.id || ''))
                              .map((speaker) => (
                                <SelectItem key={speaker.id} value={speaker.id || ''}>
                                  {speaker.name} {speaker.title && `- ${speaker.title}`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {(item.speakerIds || []).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(item.speakerIds || []).map((speakerId) => {
                              const speaker = safeSpeakers.find(s => s.id === speakerId);
                              if (!speaker) return null;
                              return (
                                <Badge key={speakerId} variant="secondary" className="flex items-center gap-1">
                                  {speaker.name}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateAgendaItem(
                                        index,
                                        'speakerIds',
                                        (item.speakerIds || []).filter(id => id !== speakerId)
                                      );
                                    }}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Brief description of this session..."
                        value={item.description || ''}
                        onChange={(e) => updateAgendaItem(index, 'description', e.target.value)}
                      />
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
                className="text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-2"
                disabled={safeSpeakers.length >= 20}
              >
                <Plus className="h-4 w-4" /> Add Speaker
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {safeSpeakers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No speakers added yet. Add speakers first to assign them to sessions.
                </div>
              ) : (
                safeSpeakers.map((speaker, index) => (
                  <div key={speaker.id || index} className="relative border rounded-lg p-4 bg-card/50">
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
                        <Label>Name <span className="text-destructive">*</span></Label>
                        <Input
                          value={speaker.name || ''}
                          onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Title / Role</Label>
                        <Input
                          value={speaker.title || ''}
                          onChange={(e) => updateSpeaker(index, 'title', e.target.value)}
                          placeholder="CEO, Product Lead, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Company / Organization</Label>
                        <Input
                          value={speaker.company || ''}
                          onChange={(e) => updateSpeaker(index, 'company', e.target.value)}
                          placeholder="TechCorp, Startup Inc."
                        />
                      </div>
                      <div>
                        <ImageUploadField
                          label="Photo"
                          value={speaker.image || ''}
                          onChange={(value) => updateSpeaker(index, 'image', value)}
                          folder="speakers"
                          previewSize="md"
                          aspectRatio="square"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          value={speaker.bio || ''}
                          onChange={(e) => updateSpeaker(index, 'bio', e.target.value)}
                          placeholder="Short biography..."
                        />
                      </div>

                      {/* Social Links */}
                      <div className="col-span-1 md:col-span-2">
                        <Label className="flex items-center gap-2 mb-3">
                          <Link2 className="h-4 w-4" /> Social Links
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Globe className="h-3 w-3" /> Website
                            </Label>
                            <Input
                              value={speaker.website || ''}
                              onChange={(e) => updateSpeaker(index, 'website', e.target.value)}
                              placeholder="https://example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Linkedin className="h-3 w-3" /> LinkedIn
                            </Label>
                            <Input
                              value={speaker.linkedin || ''}
                              onChange={(e) => updateSpeaker(index, 'linkedin', e.target.value)}
                              placeholder="https://linkedin.com/in/..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Twitter className="h-3 w-3" /> Twitter/X
                            </Label>
                            <Input
                              value={speaker.twitter || ''}
                              onChange={(e) => updateSpeaker(index, 'twitter', e.target.value)}
                              placeholder="https://twitter.com/..."
                            />
                          </div>
                        </div>
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
                className="text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Exhibitor
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {safeExhibitors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No exhibitors added yet.
                </div>
              ) : (
                safeExhibitors.map((exhibitor, index) => (
                  <div key={exhibitor.id || index} className="relative border rounded-lg p-4 bg-card/50">
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
                        <Label>Company Name <span className="text-destructive">*</span></Label>
                        <Input
                          value={exhibitor.name || ''}
                          onChange={(e) => updateExhibitor(index, 'name', e.target.value)}
                          placeholder="Company/Organization name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Booth Number</Label>
                        <Input
                          value={exhibitor.booth || ''}
                          onChange={(e) => updateExhibitor(index, 'booth', e.target.value)}
                          placeholder="A1, B2, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <Input
                          type="email"
                          value={exhibitor.contactEmail || ''}
                          onChange={(e) => updateExhibitor(index, 'contactEmail', e.target.value)}
                          placeholder="contact@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Website
                        </Label>
                        <Input
                          value={exhibitor.website || ''}
                          onChange={(e) => updateExhibitor(index, 'website', e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category / Industry</Label>
                        <Input
                          value={exhibitor.category || ''}
                          onChange={(e) => updateExhibitor(index, 'category', e.target.value)}
                          placeholder="Technology, Healthcare, etc."
                        />
                      </div>
                      <div>
                        <ImageUploadField
                          label="Logo"
                          value={exhibitor.logo || ''}
                          onChange={(value) => updateExhibitor(index, 'logo', value)}
                          folder="exhibitors"
                          previewSize="md"
                          aspectRatio="square"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={exhibitor.description || ''}
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
                className="text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Sponsor
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {safeSponsors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sponsors added yet.
                </div>
              ) : (
                safeSponsors.map((sponsor, index) => (
                  <div key={sponsor.id || index} className="relative border rounded-lg p-4 bg-card/50">
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
                        <Label>Sponsor Name <span className="text-destructive">*</span></Label>
                        <Input
                          value={sponsor.name || ''}
                          onChange={(e) => updateSponsor(index, 'name', e.target.value)}
                          placeholder="Company/Organization name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sponsorship Level</Label>
                        <CreatableSelect
                          value={sponsor.level || 'bronze'}
                          onChange={(value) => updateSponsor(index, 'level', value)}
                          options={SPONSORSHIP_LEVELS}
                          placeholder="Select level"
                          customLabel="Custom level..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Website
                        </Label>
                        <Input
                          value={sponsor.website || ''}
                          onChange={(e) => updateSponsor(index, 'website', e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <ImageUploadField
                          label="Logo"
                          value={sponsor.logo || ''}
                          onChange={(value) => updateSponsor(index, 'logo', value)}
                          folder="sponsors"
                          previewSize="md"
                          aspectRatio="square"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={sponsor.description || ''}
                          onChange={(e) => updateSponsor(index, 'description', e.target.value)}
                          placeholder="Brief description of the sponsor..."
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
