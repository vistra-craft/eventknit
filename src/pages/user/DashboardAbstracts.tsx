import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Alert } from '../../components/ui/alert';
import { FileText, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
}

interface User {
  name: string;
  email: string;
  initials: string;
  company?: string;
  designation?: string;
}

interface Registration {
  ticketId?: string;
  status?: string;
}

interface DashboardAbstractsProps {
  eventData: EventData;
  user: User;
  registration?: Registration;
}

interface AbstractSubmission {
  id: string;
  title: string;
  abstract: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt: string;
  reviewer?: string;
  feedback?: string;
}

const DashboardAbstracts: React.FC<DashboardAbstractsProps> = ({ eventData }) => {
  const [title, setTitle] = useState<string>('');
  const [abstract, setAbstract] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | null>(null);
  const [error, setError] = useState<string>('');
  const [submissions, setSubmissions] = useState<AbstractSubmission[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Here you would typically make an API call to submit the abstract
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSubmission: AbstractSubmission = {
        id: `ABS-${Date.now()}`,
        title,
        abstract,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      
      setSubmissions(prev => [newSubmission, ...prev]);
      setSubmissionStatus('success');
      setTitle('');
      setAbstract('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSubmissionStatus(null), 5000);
    } catch (err) {
      setError('Failed to submit abstract. Please try again.');
      setSubmissionStatus('error');
      console.error('Error submitting abstract:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: AbstractSubmission['status']) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'under_review':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          
          {/* Event Card Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={eventData.image} 
                      alt={eventData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{eventData.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{eventData.location}</p>
                    <p className="text-muted-foreground text-sm">{eventData.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Submit Abstract Form */}
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <FileText className="w-6 h-6 text-primary" />
                  Submit Abstract / Session Proposal
                </CardTitle>
                <p className="text-muted-foreground">
                  Submit your abstract or session proposal for {eventData.title}.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Status Messages */}
                {submissionStatus === 'success' && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <div>
                      <h4 className="font-medium">Abstract Submitted Successfully!</h4>
                      <p className="text-sm">We'll review it and get back to you soon.</p>
                    </div>
                  </Alert>
                )}
                
                {submissionStatus === 'error' && error && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <div>
                      <h4 className="font-medium">Submission Failed</h4>
                      <p className="text-sm">{error}</p>
                    </div>
                  </Alert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-foreground">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter your abstract/session title"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="abstract" className="text-sm font-medium text-foreground">
                      Abstract/Proposal <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="abstract"
                      required
                      rows={8}
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      placeholder="Enter your abstract or session proposal details (minimum 200 words)"
                      className="w-full resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 200 characters. Please include objectives, methodology, and expected outcomes.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      All fields marked with <span className="text-destructive">*</span> are required
                    </p>
                    <Button
                      type="submit"
                      disabled={submitting || !title.trim() || !abstract.trim()}
                      className="px-6 py-2"
                    >
                      {submitting ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Abstract
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* My Submissions */}
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-foreground">My Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">You haven't submitted any abstracts yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Submit your first abstract above to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <Card key={submission.id} className="bg-muted/30 border border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-2">{submission.title}</h4>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                                {submission.abstract}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Submitted: {formatDate(submission.submittedAt)}</span>
                                <span>ID: {submission.id}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              {getStatusBadge(submission.status)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAbstracts;
