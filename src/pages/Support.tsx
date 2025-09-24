import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  MessageCircle, 
  Search, 
  HelpCircle, 
  Phone, 
  Mail, 
  Video, 
  Users, 
  Clock, 
  CheckCircle, 
  Star,
  Send,
  ArrowRight,
  Calendar,
  Ticket,
  CreditCard,
  Settings,
  Shield,
  Globe,
  Zap,
  BookOpen,
  Headphones,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const Support = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: "agent",
      message: "Hello! I'm Sarah from EventKnit Support. How can I help you today?",
      timestamp: "2:30 PM",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
    }
  ]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const supportTabs = [
    { id: "chat", label: "Live Chat", icon: MessageCircle, color: "text-primary" },
    { id: "knowledge", label: "Knowledge Base", icon: BookOpen, color: "text-accent-electric" },
    { id: "contact", label: "Contact Us", icon: Mail, color: "text-accent-neon" },
    { id: "community", label: "Community", icon: Users, color: "text-primary" }
  ];

  const quickActions = [
    {
      icon: Ticket,
      title: "Ticket Issues",
      description: "Problems with event tickets or registration",
      color: "bg-blue-100 text-blue-600",
      count: "Most Common"
    },
    {
      icon: CreditCard,
      title: "Payment Problems",
      description: "Billing, refunds, and payment questions",
      color: "bg-green-100 text-green-600",
      count: "Quick Fix"
    },
    {
      icon: Calendar,
      title: "Event Management",
      description: "Creating and managing events",
      color: "bg-purple-100 text-purple-600",
      count: "Popular"
    },
    {
      icon: Settings,
      title: "Account Settings",
      description: "Profile, preferences, and security",
      color: "bg-orange-100 text-orange-600",
      count: "Self-Service"
    }
  ];

  const faqCategories = [
    {
      category: "Getting Started",
      icon: Zap,
      questions: [
        {
          question: "How do I create my first event?",
          answer: "Creating an event is easy! Click 'Create Event' in the top navigation, fill in your event details, set your pricing, and publish. Our step-by-step wizard will guide you through the entire process."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through our trusted payment partners."
        },
        {
          question: "How do I register for an event?",
          answer: "Simply browse our events, click on one that interests you, select your ticket type, and complete the registration form. You'll receive a confirmation email with your ticket details."
        }
      ]
    },
    {
      category: "Event Management",
      icon: Calendar,
      questions: [
        {
          question: "Can I edit my event after publishing?",
          answer: "Yes! You can edit most event details after publishing. However, some changes like date/time may require attendee notification. Visit your event dashboard to make updates."
        },
        {
          question: "How do I manage attendees?",
          answer: "Use your organizer dashboard to view attendee lists, send communications, check-in attendees, and export attendee data. You can also manage waitlists and cancellations."
        },
        {
          question: "What analytics are available?",
          answer: "Get detailed insights on ticket sales, attendee demographics, revenue tracking, and event performance. Access real-time dashboards and downloadable reports."
        }
      ]
    },
    {
      category: "Technical Support",
      icon: Settings,
      questions: [
        {
          question: "The website is loading slowly. What should I do?",
          answer: "Try refreshing your browser, clearing your cache, or using a different browser. If the issue persists, check your internet connection or contact our technical support team."
        },
        {
          question: "I can't access my account. Help!",
          answer: "Try resetting your password using the 'Forgot Password' link. If you're still having trouble, contact support with your email address and we'll help you regain access."
        },
        {
          question: "Is my data secure?",
          answer: "Absolutely! We use industry-standard encryption, secure servers, and comply with GDPR and other privacy regulations. Your data is protected with bank-level security."
        }
      ]
    }
  ];

  const contactMethods = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "Available now",
      responseTime: "Usually responds in minutes",
      color: "text-primary"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message",
      availability: "24/7",
      responseTime: "Response within 4 hours",
      color: "text-accent-electric"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our team",
      availability: "Mon-Fri, 9AM-6PM EST",
      responseTime: "Immediate",
      color: "text-accent-neon"
    },
    {
      icon: Video,
      title: "Video Call",
      description: "Schedule a screen sharing session",
      availability: "By appointment",
      responseTime: "Same day booking",
      color: "text-primary"
    }
  ];

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        type: "user",
        message: chatMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage("");
      
      // Simulate agent response
      setTimeout(() => {
        const agentResponse = {
          id: chatMessages.length + 2,
          type: "agent",
          message: "Thank you for your message! I'm looking into this for you. Can you provide more details about the specific issue you're experiencing?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
        };
        setChatMessages(prev => [...prev, agentResponse]);
      }, 2000);
    }
  };

  const renderChatTab = () => (
    <div className="space-y-6">
      {/* Chat Interface */}
      <Card className="h-[500px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Live Chat Support</CardTitle>
                <p className="text-sm text-muted-foreground">Sarah is online now</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600">Online</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <img 
                    src={msg.avatar} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className={`rounded-2xl px-4 py-2 ${
                    msg.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Chat Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="sm">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderKnowledgeTab = () => (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search our knowledge base..."
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQ Categories */}
      <div className="space-y-6">
        {faqCategories.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <category.icon className="w-5 h-5 text-primary" />
                <span>{category.category}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.questions.map((faq, faqIndex) => {
                const isExpanded = expandedFaq === faqIndex;
                return (
                  <div key={faqIndex} className="border rounded-lg">
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : faqIndex)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium">{faq.question}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 text-muted-foreground">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-6">
      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contactMethods.map((method, index) => {
          const Icon = method.icon;
          return (
            <Card key={index} variant="interactive" className="group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 ${method.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {method.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {method.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{method.availability}</span>
                      <span>{method.responseTime}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send us a Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Your Name" />
            <Input placeholder="Your Email" type="email" />
          </div>
          <div>
            <Input placeholder="Subject" />
          </div>
          <div>
            <Textarea 
              placeholder="Describe your issue or question..."
              rows={6}
            />
          </div>
          <Button className="w-full">
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderCommunityTab = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            Join Our Community
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Connect with other event organizers and attendees. Share tips, ask questions, 
            and learn from the EventKnit community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button>
              <Users className="w-4 h-4 mr-2" />
              Join Community Forum
            </Button>
            <Button variant="outline">
              <Video className="w-4 h-4 mr-2" />
              Watch Tutorials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              How can we help you?
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get instant support, find answers in our knowledge base, or connect with our community. 
              We're here to make your EventKnit experience amazing.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={index}
                  variant="interactive"
                  className="group cursor-pointer hover:shadow-card-hover transition-all duration-300"
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {action.description}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {action.count}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Support Tabs */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                {supportTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      variant={isActive ? "default" : "outline"}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 ${
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-primary hover:text-primary-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </Button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === "chat" && renderChatTab()}
              {activeTab === "knowledge" && renderKnowledgeTab()}
              {activeTab === "contact" && renderContactTab()}
              {activeTab === "community" && renderCommunityTab()}
            </CardContent>
          </Card>

          {/* Support Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">98%</h3>
                <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">&lt; 2min</h3>
                <p className="text-sm text-muted-foreground">Average Response Time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">24/7</h3>
                <p className="text-sm text-muted-foreground">Support Available</p>
              </CardContent>
            </Card>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-10 w-24 h-24 bg-accent-electric/20 rounded-full blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-accent-neon/20 rounded-full blur-md"></div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Support;
