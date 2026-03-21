import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  BarChart3,
  MessageSquare,
  Plus,
  Trash2,
  Settings,
  Users,
  TrendingUp,
  Loader2,
  Save,
  AlertCircle,
  ClipboardList,
  Power,
} from "lucide-react";
import {
  getSurveyForOrganizer,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyResults,
} from "@/lib/survey-api";
import type {
  EventSurvey,
  SurveyResults,
  CustomQuestion,
  CreateSurveyData,
} from "@/lib/survey-api";
import { useToast } from "@/hooks/useToast";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CUSTOM_QUESTIONS = 5;

const RATING_TOGGLES: {
  key: keyof Pick<
    EventSurvey,
    | "includeNps"
    | "includeVenueRating"
    | "includeSpeakerRating"
    | "includeContentRating"
    | "includeOrgRating"
    | "includeValueRating"
  >;
  label: string;
  description: string;
}[] = [
  {
    key: "includeNps",
    label: "Net Promoter Score (NPS)",
    description: "How likely are you to recommend this event?",
  },
  {
    key: "includeVenueRating",
    label: "Venue Rating",
    description: "Rate the event venue and facilities",
  },
  {
    key: "includeSpeakerRating",
    label: "Speaker Rating",
    description: "Rate the quality of speakers and presentations",
  },
  {
    key: "includeContentRating",
    label: "Content Rating",
    description: "Rate the quality and relevance of content",
  },
  {
    key: "includeOrgRating",
    label: "Organization Rating",
    description: "Rate the event organization and logistics",
  },
  {
    key: "includeValueRating",
    label: "Value Rating",
    description: "Rate the overall value for the price",
  },
];

// ─── Form State ───────────────────────────────────────────────────────────────

interface SurveyFormState {
  title: string;
  description: string;
  includeNps: boolean;
  includeVenueRating: boolean;
  includeSpeakerRating: boolean;
  includeContentRating: boolean;
  includeOrgRating: boolean;
  includeValueRating: boolean;
  customQuestions: CustomQuestion[];
  triggerAfterHours: number;
  isActive: boolean;
}

function getDefaultFormState(): SurveyFormState {
  return {
    title: "Post-Event Survey",
    description: "",
    includeNps: true,
    includeVenueRating: true,
    includeSpeakerRating: true,
    includeContentRating: true,
    includeOrgRating: true,
    includeValueRating: true,
    customQuestions: [],
    triggerAfterHours: 24,
    isActive: true,
  };
}

function surveyToFormState(survey: EventSurvey): SurveyFormState {
  return {
    title: survey.title,
    description: survey.description ?? "",
    includeNps: survey.includeNps,
    includeVenueRating: survey.includeVenueRating,
    includeSpeakerRating: survey.includeSpeakerRating,
    includeContentRating: survey.includeContentRating,
    includeOrgRating: survey.includeOrgRating,
    includeValueRating: survey.includeValueRating,
    customQuestions: survey.customQuestions ?? [],
    triggerAfterHours: survey.triggerAfterHours,
    isActive: survey.isActive,
  };
}

// ─── Helper: generate unique ID ───────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Component ────────────────────────────────────────────────────────────────

const EventSurveyManagement = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();

  // Data state
  const [survey, setSurvey] = useState<EventSurvey | null>(null);
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [surveyExists, setSurveyExists] = useState<boolean | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  // Form state
  const [form, setForm] = useState<SurveyFormState>(getDefaultFormState());

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchSurvey = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const response = await getSurveyForOrganizer(eventId);
      if (response.success && response.data?.survey) {
        const s = response.data.survey;
        setSurvey(s);
        setSurveyExists(true);
        setForm(surveyToFormState(s));
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) {
        setSurveyExists(false);
        setSurvey(null);
        setForm(getDefaultFormState());
      } else {
        toast({
          title: "Error",
          description: "Failed to load survey configuration.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  const fetchResults = useCallback(async () => {
    if (!eventId) return;
    try {
      setResultsLoading(true);
      const response = await getSurveyResults(eventId);
      if (response.success && response.data) {
        setResults(response.data);
      }
    } catch {
      setResults(null);
    } finally {
      setResultsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  useEffect(() => {
    if (activeTab === "results" && surveyExists) {
      fetchResults();
    }
  }, [activeTab, surveyExists, fetchResults]);

  // ─── Form Handlers ───────────────────────────────────────────────────────

  const updateField = <K extends keyof SurveyFormState>(
    key: K,
    value: SurveyFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addCustomQuestion = () => {
    if (form.customQuestions.length >= MAX_CUSTOM_QUESTIONS) {
      toast({
        title: "Limit reached",
        description: `You can add up to ${MAX_CUSTOM_QUESTIONS} custom questions.`,
        variant: "destructive",
      });
      return;
    }
    const newQuestion: CustomQuestion = {
      id: generateId(),
      question: "",
      type: "text",
    };
    updateField("customQuestions", [...form.customQuestions, newQuestion]);
  };

  const updateCustomQuestion = (
    index: number,
    updates: Partial<CustomQuestion>
  ) => {
    const updated = form.customQuestions.map((q, i) =>
      i === index ? { ...q, ...updates } : q
    );
    updateField("customQuestions", updated);
  };

  const removeCustomQuestion = (index: number) => {
    updateField(
      "customQuestions",
      form.customQuestions.filter((_, i) => i !== index)
    );
  };

  const addOptionToQuestion = (questionIndex: number) => {
    const question = form.customQuestions[questionIndex];
    const options = question.options ?? [];
    if (options.length >= 10) return;
    updateCustomQuestion(questionIndex, { options: [...options, ""] });
  };

  const updateQuestionOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const question = form.customQuestions[questionIndex];
    const options = [...(question.options ?? [])];
    options[optionIndex] = value;
    updateCustomQuestion(questionIndex, { options });
  };

  const removeQuestionOption = (
    questionIndex: number,
    optionIndex: number
  ) => {
    const question = form.customQuestions[questionIndex];
    const options = (question.options ?? []).filter(
      (_, i) => i !== optionIndex
    );
    updateCustomQuestion(questionIndex, { options });
  };

  // ─── Validation ───────────────────────────────────────────────────────────

  const validate = (): string | null => {
    if (!form.title.trim()) {
      return "Survey title is required.";
    }
    if (form.triggerAfterHours < 0) {
      return "Trigger timing must be 0 or more hours.";
    }
    for (const q of form.customQuestions) {
      if (!q.question.trim()) {
        return "All custom questions must have text.";
      }
      if (q.type === "multiple_choice") {
        const validOptions = (q.options ?? []).filter((o) => o.trim());
        if (validOptions.length < 2) {
          return `Multiple choice question "${q.question}" needs at least 2 options.`;
        }
      }
    }
    return null;
  };

  // ─── Save / Create ───────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!eventId) return;

    const error = validate();
    if (error) {
      toast({ title: "Validation Error", description: error, variant: "destructive" });
      return;
    }

    try {
      setSaving(true);

      // Clean up custom questions: filter empty options
      const cleanedQuestions = form.customQuestions.map((q) => ({
        ...q,
        options:
          q.type === "multiple_choice"
            ? (q.options ?? []).filter((o) => o.trim())
            : undefined,
      }));

      if (surveyExists && survey) {
        // Update existing survey
        await updateSurvey(survey.id, {
          title: form.title,
          description: form.description || undefined,
          includeNps: form.includeNps,
          includeVenueRating: form.includeVenueRating,
          includeSpeakerRating: form.includeSpeakerRating,
          includeContentRating: form.includeContentRating,
          includeOrgRating: form.includeOrgRating,
          includeValueRating: form.includeValueRating,
          customQuestions: cleanedQuestions,
          triggerAfterHours: form.triggerAfterHours,
          isActive: form.isActive,
        });
        toast({ title: "Saved", description: "Survey settings updated." });
      } else {
        // Create new survey
        const data: CreateSurveyData = {
          eventId,
          title: form.title,
          description: form.description || undefined,
          includeNps: form.includeNps,
          includeVenueRating: form.includeVenueRating,
          includeSpeakerRating: form.includeSpeakerRating,
          includeContentRating: form.includeContentRating,
          includeOrgRating: form.includeOrgRating,
          includeValueRating: form.includeValueRating,
          customQuestions: cleanedQuestions,
          triggerAfterHours: form.triggerAfterHours,
        };
        await createSurvey(data);
        toast({ title: "Created", description: "Survey created successfully." });
      }

      await fetchSurvey();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save survey.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!survey) return;
    try {
      setDeleting(true);
      await deleteSurvey(survey.id);
      toast({ title: "Deleted", description: "Survey has been deleted." });
      setSurvey(null);
      setSurveyExists(false);
      setForm(getDefaultFormState());
      setResults(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete survey. It may already have responses.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // ─── Loading State ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle className="h-10 w-10 mb-3" />
        <p>No event ID found. Please navigate here from an event page.</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-section-header">
            Survey Management
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {surveyExists
              ? "Configure your post-event survey settings and view responses."
              : "Create a post-event survey to collect attendee feedback."}
          </p>
        </div>
        {surveyExists && survey && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                survey.isActive
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Power className="h-3 w-3" />
              {survey.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="gap-1.5"
            disabled={!surveyExists}
          >
            <BarChart3 className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* ─── Settings Tab ──────────────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-6 mt-4">
          {/* Basic Info */}
          <Card className="border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="survey-title" className="text-foreground">
                  Survey Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="survey-title"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. Post-Event Feedback Survey"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="survey-description" className="text-foreground">
                  Description
                </Label>
                <Textarea
                  id="survey-description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="A short description shown to attendees before they fill out the survey..."
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rating Categories */}
          <Card className="border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                Rating Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Choose which rating categories to include in the survey. Each
                enabled category adds a 1-5 star rating question.
              </p>
              <div className="space-y-4">
                {RATING_TOGGLES.map(({ key, label, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-card p-4"
                  >
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-medium text-foreground">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                    <Switch
                      checked={form[key]}
                      onCheckedChange={(checked) =>
                        updateField(key, checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Questions */}
          <Card className="border-border/40 bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-foreground">
                Custom Questions
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomQuestion}
                disabled={form.customQuestions.length >= MAX_CUSTOM_QUESTIONS}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent>
              {form.customQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/40 py-10 text-center">
                  <ClipboardList className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No custom questions yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add up to {MAX_CUSTOM_QUESTIONS} custom questions to gather
                    specific feedback.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {form.customQuestions.map((question, qIndex) => (
                    <div
                      key={question.id}
                      className="relative rounded-lg border border-border/40 bg-card p-4 space-y-3"
                    >
                      {/* Remove button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeCustomQuestion(qIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex items-start gap-3 pr-10">
                        <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {qIndex + 1}
                        </span>
                        <div className="flex-1 space-y-3">
                          {/* Question text */}
                          <div className="space-y-1.5">
                            <Label className="text-foreground text-xs">
                              Question Text
                            </Label>
                            <Input
                              value={question.question}
                              onChange={(e) =>
                                updateCustomQuestion(qIndex, {
                                  question: e.target.value,
                                })
                              }
                              placeholder="Enter your question..."
                              maxLength={500}
                            />
                          </div>

                          {/* Question type */}
                          <div className="space-y-1.5">
                            <Label className="text-foreground text-xs">
                              Answer Type
                            </Label>
                            <Select
                              value={question.type}
                              onValueChange={(
                                value: "multiple_choice" | "text" | "rating"
                              ) => {
                                const updates: Partial<CustomQuestion> = {
                                  type: value,
                                };
                                if (
                                  value === "multiple_choice" &&
                                  !question.options?.length
                                ) {
                                  updates.options = ["", ""];
                                }
                                if (value !== "multiple_choice") {
                                  updates.options = undefined;
                                }
                                updateCustomQuestion(qIndex, updates);
                              }}
                            >
                              <SelectTrigger className="w-full sm:w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">
                                  Free Text
                                </SelectItem>
                                <SelectItem value="rating">
                                  Rating (1-5)
                                </SelectItem>
                                <SelectItem value="multiple_choice">
                                  Multiple Choice
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Multiple choice options */}
                          {question.type === "multiple_choice" && (
                            <div className="space-y-2">
                              <Label className="text-foreground text-xs">
                                Options
                              </Label>
                              {(question.options ?? []).map(
                                (option, oIndex) => (
                                  <div
                                    key={oIndex}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="text-xs text-muted-foreground w-5 text-right">
                                      {oIndex + 1}.
                                    </span>
                                    <Input
                                      value={option}
                                      onChange={(e) =>
                                        updateQuestionOption(
                                          qIndex,
                                          oIndex,
                                          e.target.value
                                        )
                                      }
                                      placeholder={`Option ${oIndex + 1}`}
                                      className="flex-1"
                                      maxLength={200}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() =>
                                        removeQuestionOption(qIndex, oIndex)
                                      }
                                      disabled={
                                        (question.options?.length ?? 0) <= 2
                                      }
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )
                              )}
                              {(question.options?.length ?? 0) < 10 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addOptionToQuestion(qIndex)}
                                  className="gap-1 text-xs text-muted-foreground"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add Option
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trigger Timing & Status */}
          <Card className="border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                Delivery Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trigger-hours" className="text-foreground">
                  Send survey after event ends (hours)
                </Label>
                <Input
                  id="trigger-hours"
                  type="number"
                  min={0}
                  max={720}
                  value={form.triggerAfterHours}
                  onChange={(e) =>
                    updateField(
                      "triggerAfterHours",
                      Math.max(0, parseInt(e.target.value) || 0)
                    )
                  }
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  The survey link will be sent to attendees this many hours after
                  the event ends. Set to 0 to send immediately.
                </p>
              </div>

              {surveyExists && (
                <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Survey Status
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {form.isActive
                        ? "Survey is active and will be sent to attendees."
                        : "Survey is inactive and will not be sent."}
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      updateField("isActive", checked)
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div>
              {surveyExists && survey && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting || saving}
                  className="gap-1.5"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete Survey
                </Button>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || deleting}
              className="gap-1.5"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {surveyExists ? "Save Changes" : "Create Survey"}
            </Button>
          </div>
        </TabsContent>

        {/* ─── Results Tab ───────────────────────────────────────────────── */}
        <TabsContent value="results" className="space-y-6 mt-4">
          {resultsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !results || results.totalResponses === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/40 bg-card py-20 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-lg font-medium text-foreground">
                No responses yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Once attendees complete the survey, their feedback will appear
                here with aggregated statistics.
              </p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatsCard
                  icon={Users}
                  label="Total Responses"
                  value={results.totalResponses.toString()}
                  gradient="from-blue-500 to-blue-600"
                />
                <StatsCard
                  icon={Star}
                  label="Average Rating"
                  value={
                    results.averages.overall != null
                      ? results.averages.overall.toFixed(1)
                      : "--"
                  }
                  suffix="/5"
                  gradient="from-amber-500 to-orange-500"
                />
                <StatsCard
                  icon={TrendingUp}
                  label="NPS Score"
                  value={
                    results.npsBreakdown?.score != null
                      ? results.npsBreakdown.score.toString()
                      : "--"
                  }
                  gradient="from-emerald-500 to-green-600"
                />
              </div>

              {/* NPS Breakdown */}
              {results.npsBreakdown && results.npsBreakdown.total > 0 && (
                <Card className="border-border/40 bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">
                      NPS Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <NpsSegment
                        label="Promoters (9-10)"
                        count={results.npsBreakdown.promoters}
                        total={results.npsBreakdown.total}
                        color="bg-green-500"
                      />
                      <NpsSegment
                        label="Passives (7-8)"
                        count={results.npsBreakdown.passives}
                        total={results.npsBreakdown.total}
                        color="bg-amber-500"
                      />
                      <NpsSegment
                        label="Detractors (0-6)"
                        count={results.npsBreakdown.detractors}
                        total={results.npsBreakdown.total}
                        color="bg-red-500"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Category Ratings */}
              <Card className="border-border/40 bg-card">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">
                    Category Ratings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Venue", value: results.averages.venue },
                    { label: "Speakers", value: results.averages.speakers },
                    { label: "Content", value: results.averages.content },
                    {
                      label: "Organization",
                      value: results.averages.organization,
                    },
                    { label: "Value", value: results.averages.value },
                  ]
                    .filter((c) => c.value != null)
                    .map((category) => (
                      <RatingBar
                        key={category.label}
                        label={category.label}
                        value={category.value!}
                        max={5}
                      />
                    ))}
                  {[
                    results.averages.venue,
                    results.averages.speakers,
                    results.averages.content,
                    results.averages.organization,
                    results.averages.value,
                  ].every((v) => v == null) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No category ratings were collected for this survey.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Individual Responses */}
              <Card className="border-border/40 bg-card">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">
                    Individual Responses ({results.responses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.responses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No individual responses to display.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {results.responses.map((response) => {
                        const name = [
                          response.attendee?.firstName,
                          response.attendee?.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || "Anonymous";

                        return (
                          <div
                            key={response.id}
                            className="rounded-lg border border-border/40 bg-card p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {response.attendee?.avatar ? (
                                  <img
                                    src={response.attendee.avatar}
                                    alt={name}
                                    className="h-9 w-9 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                    {name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(
                                      response.submittedAt
                                    ).toLocaleDateString(undefined, {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span className="text-sm font-semibold text-foreground">
                                  {response.overallRating}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  /5
                                </span>
                              </div>
                            </div>
                            {response.comment && (
                              <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                                {response.comment}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatsCard({
  icon: Icon,
  label,
  value,
  suffix,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix?: string;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {value}
              {suffix && (
                <span className="text-sm font-normal text-muted-foreground">
                  {suffix}
                </span>
              )}
            </p>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${gradient}`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NpsSegment({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {count}{" "}
          <span className="text-muted-foreground font-normal">
            ({percentage}%)
          </span>
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function RatingBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {value.toFixed(1)}
          <span className="text-muted-foreground font-normal">/{max}</span>
        </p>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default EventSurveyManagement;
