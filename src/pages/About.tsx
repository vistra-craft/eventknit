import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Target, Award, Heart, MapPin, Mail, Phone, Linkedin, Twitter, Instagram, Play, CheckCircle, TrendingUp, Globe, Zap, Shield, Star, ArrowRight, Calendar, Ticket, Sparkles, Settings, Clock, DollarSign, Rocket, Smartphone, QrCode, BarChart3, Bell, Palette, Smartphone as Mobile, CheckCircle2, Eye, BarChart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";

const About = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0, 0]);

  useEffect(() => {
    setIsVisible(true);
    
    // Animate stats on load
    const animateStats = () => {
      const targets = [500, 2500, 150, 50];
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        setAnimatedStats(targets.map(target => Math.floor(target * easeOut)));
        
        if (step >= steps) {
          clearInterval(timer);
          setAnimatedStats(targets);
        }
      }, stepDuration);
    };

    const timer = setTimeout(animateStats, 500);
    return () => clearTimeout(timer);
  }, []);

  const teamMembers = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
      description: "Passionate about bringing people together through unforgettable experiences.",
      linkedin: "https://linkedin.com/in/sarah-johnson",
      twitter: "https://twitter.com/sarah_j"
    },
    {
      name: "Michael Chen",
      role: "Head of Events",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      description: "Expert event coordinator with 10+ years of experience in large-scale productions.",
      linkedin: "https://linkedin.com/in/michael-chen",
      twitter: "https://twitter.com/michael_c"
    },
    {
      name: "Emily Rodriguez",
      role: "Creative Director",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      description: "Innovative designer who transforms spaces into magical experiences.",
      linkedin: "https://linkedin.com/in/emily-rodriguez",
      twitter: "https://twitter.com/emily_r"
    },
    {
      name: "David Thompson",
      role: "Technology Lead",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
      description: "Building the future of event discovery and ticketing technology.",
      linkedin: "https://linkedin.com/in/david-thompson",
      twitter: "https://twitter.com/david_t"
    }
  ];

  const stats = [
    { number: animatedStats[0], suffix: "K+", label: "Happy Attendees", icon: <Users className="w-6 h-6" /> },
    { number: animatedStats[1], suffix: "+", label: "Events Hosted", icon: <Calendar className="w-6 h-6" /> },
    { number: animatedStats[2], suffix: "+", label: "Partner Venues", icon: <MapPin className="w-6 h-6" /> },
    { number: animatedStats[3], suffix: "+", label: "Cities Worldwide", icon: <Globe className="w-6 h-6" /> }
  ];

  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Community First",
      description: "We believe in the power of bringing people together and creating lasting connections through shared experiences.",
      color: "text-red-500"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Excellence",
      description: "Every event we curate meets the highest standards of quality, ensuring memorable experiences for all attendees.",
      color: "text-blue-500"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Innovation",
      description: "We continuously push boundaries to create unique, cutting-edge experiences that inspire and delight.",
      color: "text-purple-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Inclusivity",
      description: "Our events welcome everyone, celebrating diversity and fostering an environment where all feel valued.",
      color: "text-green-500"
    }
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast Booking",
      description: "Secure your spot in seconds with our streamlined booking process"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Payments",
      description: "Bank-level security for all transactions with fraud protection"
    },
    {
      icon: <Ticket className="w-6 h-6" />,
      title: "Digital Tickets",
      description: "No more paper tickets - everything is digital and eco-friendly"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Smart Recommendations",
      description: "AI-powered suggestions based on your interests and preferences"
    }
  ];

  const tabs = [
    { id: 0, label: "Our Story", icon: <Heart className="w-4 h-4" /> },
    { id: 1, label: "Mission", icon: <Target className="w-4 h-4" /> },
    { id: 2, label: "Impact", icon: <TrendingUp className="w-4 h-4" /> }
  ];

  const eventCreationSteps = [
    {
      step: 1,
      title: "Basic Details",
      description: "Add your event title, description, and category",
      icon: <Settings className="w-6 h-6" />,
      color: "text-blue-500"
    },
    {
      step: 2,
      title: "Schedule & Location",
      description: "Set date, time, and venue details",
      icon: <Clock className="w-6 h-6" />,
      color: "text-green-500"
    },
    {
      step: 3,
      title: "Pricing & Tickets",
      description: "Configure pricing and ticket types",
      icon: <DollarSign className="w-6 h-6" />,
      color: "text-purple-500"
    },
    {
      step: 4,
      title: "Launch & Manage",
      description: "Publish and monitor your event",
      icon: <Rocket className="w-6 h-6" />,
      color: "text-orange-500"
    }
  ];

  const organizerBenefits = [
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Customize Freely",
      description: "Full control over your event settings, branding, and registration forms. Make it uniquely yours.",
      color: "text-pink-500"
    },
    {
      icon: <Mobile className="w-8 h-8" />,
      title: "Mobile Power",
      description: "Seamlessly manage your events via our mobile app. Check-in attendees with QR codes on the go.",
      color: "text-blue-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Audience Ready",
      description: "Powerful tools to attract and engage attendees. From marketing to analytics, we've got you covered.",
      color: "text-green-500"
    }
  ];

  const ticketingFeatures = [
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "QR Check-in",
      description: "Fast, contactless entry"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Real-Time Analytics",
      description: "Track performance live"
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Instant Notifications",
      description: "Stay updated always"
    },
    {
      icon: <Ticket className="w-6 h-6" />,
      title: "Flexible Ticketing",
      description: "Custom pricing options"
    }
  ];

  const ticketingSteps = [
    {
      step: 1,
      title: "Create Your Event",
      description: "Set up your event details, pricing, and ticket types in minutes",
      icon: <Calendar className="w-8 h-8" />,
      color: "bg-blue-500"
    },
    {
      step: 2,
      title: "Share & Promote",
      description: "Distribute your event link and QR codes to reach your audience",
      icon: <Share2 className="w-8 h-8" />,
      color: "bg-green-500"
    },
    {
      step: 3,
      title: "Manage Registrations",
      description: "Track attendees, send updates, and handle last-minute changes",
      icon: <Users className="w-8 h-8" />,
      color: "bg-purple-500"
    },
    {
      step: 4,
      title: "Check-in & Analytics",
      description: "Scan QR codes for entry and monitor real-time event performance",
      icon: <BarChart className="w-8 h-8" />,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with Fading Image - PRESERVED AS REQUESTED */}
      <div className="relative h-[70vh] overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=1080&fit=crop"
          alt="About EventKnit - Creating Unforgettable Experiences"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for fading effect - PRESERVED */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40"></div>
        
        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <div className="max-w-4xl">
              <h1 className={`text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                About EventKnit
              </h1>
              <p className={`text-xl md:text-2xl text-foreground/90 leading-relaxed max-w-3xl transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                We're passionate about creating extraordinary experiences that bring people together, 
                inspire connections, and leave lasting memories.
              </p>
              <div className={`mt-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Our Story
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-primary/5 to-transparent"></div>
        
        <div className="relative container mx-auto px-6 py-20">
        {/* Interactive Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="p-6">
                <div className="text-primary mb-3 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.number}{stat.suffix}
                </div>
                <div className="text-lg text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Interactive Tabbed Content Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Discover what drives us and how we're transforming the event industry
            </p>
            
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-muted/50 rounded-lg p-1 flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              {activeTab === 0 && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold">Our Story</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Founded in 2018 by a team of passionate event enthusiasts, EventKnit began as a simple idea: 
                    make extraordinary experiences accessible to everyone. What started as a small platform has grown 
                    into a global community connecting millions of people through shared experiences.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We've learned that the best events aren't just about entertainment—they're about creating 
                    lasting memories, building communities, and bringing people together in meaningful ways.
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Founded 2018
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Star className="w-4 h-4 mr-1" />
                      Award Winning
                    </Badge>
                  </div>
                </div>
              )}
              
              {activeTab === 1 && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold">Our Mission</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    At EventKnit, we believe that life's most meaningful moments happen when people come together. 
                    Our mission is to democratize access to extraordinary experiences, making it easier than ever 
                    to discover, attend, and create events that matter.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We're building bridges between event organizers and attendees, fostering communities, 
                    and turning ordinary moments into extraordinary memories through technology and innovation.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Democratize event access</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Foster meaningful connections</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Innovate through technology</span>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 2 && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold">Our Impact</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Since our launch, we've facilitated over 2,500 events across 50+ cities worldwide, 
                    creating unforgettable experiences for more than 500,000 attendees. Our platform has 
                    become a catalyst for community building and cultural exchange.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We're proud to support local businesses, artists, and organizers while providing 
                    attendees with seamless, secure, and memorable event experiences.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">98%</div>
                      <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">$2M+</div>
                      <div className="text-sm text-muted-foreground">Revenue Generated</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <img 
                src={
                  activeTab === 0 
                    ? "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop"
                    : activeTab === 1
                    ? "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
                    : "https://images.unsplash.com/photo-1511795409834-47104e6f1dbd?w=800&h=600&fit=crop"
                }
                alt={
                  activeTab === 0 
                    ? "Our founding team"
                    : activeTab === 1
                    ? "Our mission in action"
                    : "Our global impact"
                }
                className="rounded-2xl shadow-2xl transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>

        {/* Interactive Features Section - Compact */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Why Choose EventKnit?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of event management with our cutting-edge features
            </p>
          </div>
          
          {/* Compact 2x2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <div className="text-primary">
                        {feature.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Event Creation Process Section - Compact */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Create Events in 4 Simple Steps</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From idea to launch, our streamlined process makes event creation effortless
            </p>
          </div>
          
          {/* Compact horizontal timeline */}
          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-primary/20 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {eventCreationSteps.map((step, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <div className="relative mb-4">
                      <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <div className="text-primary">
                          {step.icon}
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Creative Visual Separator */}
        <div className="relative py-20 mb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full transform -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full transform translate-x-24 translate-y-24"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-pink-500/10 rounded-full"></div>
          
          <div className="relative text-center">
            <div className="inline-block px-8 py-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse delay-200"></div>
                <span className="text-muted-foreground font-medium">Creating Amazing Experiences</span>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse delay-300"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-400"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-500"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile App Showcase Section */}
        <div className="mb-20">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">QR Code for mobile check-in</h3>
                  </div>
                  
                  <h2 className="text-3xl font-bold mb-4">Mobile App in Action</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    Our mobile app puts the power of event management in your pocket. Scan QR codes, check in attendees, 
                    monitor real-time stats, and handle last-minute changes — all from your smartphone.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    Whether you're at the venue or on the move, stay connected to your event with push notifications 
                    and instant updates.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="bg-blue-500 hover:bg-blue-600">
                      <Mobile className="w-5 h-5 mr-2" />
                      Download Mobile App
                    </Button>
                    <Button size="lg" variant="outline">
                      <Eye className="w-5 h-5 mr-2" />
                      Watch Demo
                    </Button>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="relative z-10">
                    <img 
                      src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=800&fit=crop"
                      alt="Mobile app interface showing QR code check-in"
                      className="rounded-2xl shadow-2xl mx-auto max-w-sm"
                    />
                  </div>
                  {/* Floating elements */}
                  <div className="absolute top-4 right-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute bottom-8 left-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How Our Ticketing System Works Section - Redesigned */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">How Our Ticketing System Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A seamless journey from event creation to attendee check-in
            </p>
          </div>
          
          {/* Creative circular flow layout */}
          <div className="relative max-w-4xl mx-auto mb-12">
            {/* Central hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center z-10">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Ticket className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* Flow steps in circular arrangement */}
            <div className="grid grid-cols-2 gap-8">
              {ticketingSteps.map((step, index) => (
                <div key={index} className={`${index % 2 === 0 ? 'text-right' : 'text-left'} ${index < 2 ? 'mb-8' : ''}`}>
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        {index % 2 === 0 ? (
                          <>
                            <div className="flex-1">
                              <div className="flex items-center justify-end gap-3 mb-2">
                                <h3 className="text-lg font-bold">{step.title}</h3>
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <div className="text-primary text-sm font-bold">{step.step}</div>
                                </div>
                              </div>
                              <p className="text-muted-foreground text-sm text-right">{step.description}</p>
                            </div>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <div className="text-primary">{step.icon}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <div className="text-primary">{step.icon}</div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <div className="text-primary text-sm font-bold">{step.step}</div>
                                </div>
                                <h3 className="text-lg font-bold">{step.title}</h3>
                              </div>
                              <p className="text-muted-foreground text-sm">{step.description}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
          
          {/* Compact benefits row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Instant Confirmation</h4>
                <p className="text-xs text-muted-foreground">Immediate QR codes & details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Real-Time Insights</h4>
                <p className="text-xs text-muted-foreground">Live metrics & analytics</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Smart Notifications</h4>
                <p className="text-xs text-muted-foreground">Automated updates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Values Section - Redesigned */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These core principles guide everything we do and shape the experiences we create
            </p>
          </div>
          
          {/* Creative list layout with icons */}
          <div className="max-w-4xl mx-auto space-y-6">
            {values.map((value, index) => (
              <div key={index} className="flex items-start gap-6 p-6 bg-muted/20 rounded-xl hover:bg-muted/30 transition-colors duration-300 group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <div className="text-primary">
                    {value.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="text-primary text-sm font-bold">{index + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* Interactive CTA Section */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">Ready to Join Our Community?</CardTitle>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're an attendee looking for amazing events or an organizer ready to create them, 
              EventKnit is your gateway to unforgettable experiences.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90">
                <Calendar className="w-5 h-5 mr-2" />
                Browse Events
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8">
                <Sparkles className="w-5 h-5 mr-2" />
                Create Event
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Creative Contact Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or want to partner with us? We'd love to hear from you.
            </p>
          </div>
          
          {/* Creative contact layout */}
          <div className="relative max-w-6xl mx-auto">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-3xl"></div>
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full transform -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full transform translate-x-12 translate-y-12"></div>
            
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center p-12">
              {/* Left side - Contact methods */}
              <div className="space-y-8">
                <div className="flex items-center gap-6 p-6 bg-white/50 backdrop-blur-sm rounded-2xl hover:bg-white/70 transition-all duration-300 group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Email Us</h3>
                    <p className="text-muted-foreground mb-1">hello@eventknit.com</p>
                    <p className="text-sm text-muted-foreground">Response within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 p-6 bg-white/50 backdrop-blur-sm rounded-2xl hover:bg-white/70 transition-all duration-300 group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Phone className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Call Us</h3>
                    <p className="text-muted-foreground mb-1">+1 (555) 123-4567</p>
                    <p className="text-sm text-muted-foreground">Mon-Fri 9AM-6PM PST</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 p-6 bg-white/50 backdrop-blur-sm rounded-2xl hover:bg-white/70 transition-all duration-300 group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Visit Us</h3>
                    <p className="text-muted-foreground mb-1">San Francisco, CA</p>
                    <p className="text-sm text-muted-foreground">Located in Silicon Valley</p>
                  </div>
                </div>
              </div>
              
              {/* Right side - Social media */}
              <div className="space-y-6">
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl font-bold mb-3">Follow Our Journey</h3>
                  <p className="text-muted-foreground mb-8">Stay updated with our latest events, features, and community stories</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <Button variant="outline" className="h-16 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group">
                    <Instagram className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Instagram</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group">
                    <Twitter className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Twitter</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group">
                    <Linkedin className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">LinkedIn</span>
                  </Button>
                </div>
                
                {/* Quick contact CTA */}
                <div className="p-6 bg-primary/5 rounded-2xl text-center">
                  <h4 className="font-bold mb-2">Quick Question?</h4>
                  <p className="text-sm text-muted-foreground mb-4">Send us a message and we'll get back to you ASAP</p>
                  <Button className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
























