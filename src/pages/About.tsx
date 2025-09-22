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

      <div className="container mx-auto px-6 py-16">
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

        {/* Interactive Features Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose EventKnit?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of event management with our cutting-edge features
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
                <CardContent className="p-8">
                  <div className="text-primary mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Event Creation Process Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Create Events in 4 Simple Steps</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From idea to launch, our streamlined process makes event creation effortless
            </p>
          </div>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 transform -translate-y-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {eventCreationSteps.map((step, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group bg-background/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="relative mb-4">
                      <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-white to-gray-100 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <div className={`${step.color} group-hover:scale-110 transition-transform duration-300`}>
                          {step.icon}
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Organizer Benefits Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Your Event, Your Brand, Your Rules</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              From registration to check-in, we've got you covered. Take control of every aspect of your event experience with our comprehensive platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {organizerBenefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
                <CardContent className="p-8">
                  <div className={`mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300 ${benefit.color}`}>
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ticketing Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {ticketingFeatures.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors duration-300 group">
                <div className="text-primary mb-3 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
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

        {/* How Our Ticketing System Works Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How Our Ticketing System Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A seamless journey from event creation to attendee check-in
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 transform -translate-y-1/2 z-0 rounded-full"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {ticketingSteps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Step Number Circle */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className={`w-12 h-12 ${step.color} rounded-full flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-lg">{step.step}</span>
                    </div>
                  </div>
                  
                  <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group mt-8 bg-background/80 backdrop-blur-sm">
                    <CardContent className="p-8 pt-12">
                      <div className="text-white mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                        <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center shadow-lg`}>
                          {step.icon}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Confirmation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Attendees receive immediate confirmation emails with QR codes and event details
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Real-Time Insights</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track attendance, revenue, and engagement metrics as they happen
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Smart Notifications</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Automated reminders and updates keep everyone informed and engaged
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Interactive Values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              These core principles guide everything we do and shape the experiences we create
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
                <CardContent className="p-8">
                  <div className={`mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300 ${value.color}`}>
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Interactive Team Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The passionate individuals behind EventKnit who work tirelessly to bring you 
              the best event experiences
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="relative mb-4">
                      <img 
                        src={member.image}
                        alt={member.name}
                        className="w-24 h-24 rounded-full mx-auto object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
                      onClick={() => window.open(member.linkedin, '_blank')}
                    >
                      <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
                      onClick={() => window.open(member.twitter, '_blank')}
                    >
                      <Twitter className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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

        {/* Interactive Contact Section */}
        <Card className="mt-20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">Get in Touch</CardTitle>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or want to partner with us? We'd love to hear from you.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Email Us</h4>
                <p className="text-muted-foreground">hello@eventknit.com</p>
              </div>
              <div className="text-center group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Call Us</h4>
                <p className="text-muted-foreground">+1 (555) 123-4567</p>
              </div>
              <div className="text-center group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Visit Us</h4>
                <p className="text-muted-foreground">San Francisco, CA</p>
              </div>
            </div>
            
            <Separator className="my-8" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-semibold mb-2">Follow Our Journey</h4>
                <p className="text-muted-foreground">Stay updated with our latest events and news</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
                  <Instagram className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
                  <Twitter className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
                  <Linkedin className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default About;
























// import { ArrowLeft, Users, Target, Award, Heart, MapPin, Mail, Phone, Linkedin, Twitter, Instagram, Play, CheckCircle, TrendingUp, Globe, Zap, Shield, Star, ArrowRight, Calendar, Ticket, Sparkles, Settings, Clock, DollarSign, Rocket, Smartphone, QrCode, BarChart3, Bell, Palette, CheckCircle2, Eye, BarChart, Share2, Camera, MessageSquare, ThumbsUp } from "lucide-react";
// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// // UI Components
// const Button = ({ children, size, variant = "default", className = "", onClick, ...props }: {
//   children: React.ReactNode;
//   size?: "lg" | "icon" | "default";
//   variant?: "default" | "outline";
//   className?: string;
//   onClick?: () => void;
//   [key: string]: any;
// }) => {
//   const sizeClasses = size === "lg" ? "h-12 px-6 text-base" : size === "icon" ? "h-10 w-10" : "h-10 px-4";
//   const variantClasses = variant === "outline" 
//     ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground" 
//     : "bg-primary text-primary-foreground hover:bg-primary/90";
  
//   return (
//     <button 
//       className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${sizeClasses} ${variantClasses} ${className}`}
//       onClick={onClick}
//       {...props}
//     >
//       {children}
//     </button>
//   );
// };

// const Card = ({ children, className = "", ...props }) => (
//   <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>
//     {children}
//   </div>
// );

// const CardContent = ({ children, className = "", ...props }) => (
//   <div className={`p-6 pt-0 ${className}`} {...props}>
//     {children}
//   </div>
// );

// const CardHeader = ({ children, className = "", ...props }) => (
//   <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
//     {children}
//   </div>
// );

// const CardTitle = ({ children, className = "", ...props }) => (
//   <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
//     {children}
//   </h3>
// );

// const Badge = ({ children, variant = "default", className = "", ...props }) => {
//   const variantClasses = variant === "secondary" 
//     ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" 
//     : "bg-primary text-primary-foreground hover:bg-primary/80";
  
//   return (
//     <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses} ${className}`} {...props}>
//       {children}
//     </div>
//   );
// };

// const Separator = ({ className = "", ...props }) => (
//   <div className={`shrink-0 bg-border h-[1px] w-full ${className}`} {...props} />
// );

// const Navbar = () => (
//   <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
//     <div className="container mx-auto px-6 py-4">
//       <div className="flex items-center justify-between">
//         <div className="text-2xl font-bold text-primary">EventKnit</div>
//         <div className="hidden md:flex items-center gap-8">
//           <a href="#" className="text-foreground hover:text-primary transition-colors">Events</a>
//           <a href="#" className="text-foreground hover:text-primary transition-colors">About</a>
//           <a href="#" className="text-foreground hover:text-primary transition-colors">Contact</a>
//           <Button>Get Started</Button>
//         </div>
//       </div>
//     </div>
//   </nav>
// );

// const Footer = () => (
//   <footer className="bg-muted/50 border-t">
//     <div className="container mx-auto px-6 py-12">
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//         <div className="col-span-1 md:col-span-2">
//           <div className="text-2xl font-bold text-primary mb-4">EventKnit</div>
//           <p className="text-muted-foreground mb-6">
//             Creating extraordinary experiences that bring people together and leave lasting memories.
//           </p>
//           <div className="flex gap-4">
//             <Button variant="outline" size="icon">
//               <Twitter className="w-4 h-4" />
//             </Button>
//             <Button variant="outline" size="icon">
//               <Instagram className="w-4 h-4" />
//             </Button>
//             <Button variant="outline" size="icon">
//               <Linkedin className="w-4 h-4" />
//             </Button>
//           </div>
//         </div>
//         <div>
//           <h4 className="font-semibold mb-4">Company</h4>
//           <div className="space-y-2 text-sm text-muted-foreground">
//             <div>About</div>
//             <div>Careers</div>
//             <div>Press</div>
//           </div>
//         </div>
//         <div>
//           <h4 className="font-semibold mb-4">Support</h4>
//           <div className="space-y-2 text-sm text-muted-foreground">
//             <div>Help Center</div>
//             <div>Contact Us</div>
//             <div>Privacy</div>
//           </div>
//         </div>
//       </div>
//       <Separator className="my-8" />
//       <div className="text-center text-sm text-muted-foreground">
//         © 2025 EventKnit. All rights reserved.
//       </div>
//     </div>
//   </footer>
// );

// const About = () => {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState(0);
//   const [isVisible, setIsVisible] = useState(false);
//   const [animatedStats, setAnimatedStats] = useState([0, 0, 0, 0]);
//   const [scrollY, setScrollY] = useState(0);
//   const [activeSection, setActiveSection] = useState(0);

//   useEffect(() => {
//     setIsVisible(true);
    
//     // Parallax scroll effect
//     const handleScroll = () => setScrollY(window.scrollY);
//     window.addEventListener("scroll", handleScroll);
    
//     // Animate stats on load
//     const animateStats = () => {
//       const targets = [500, 2500, 150, 50];
//       const duration = 2000;
//       const steps = 60;
//       const stepDuration = duration / steps;
      
//       let step = 0;
//       const timer = setInterval(() => {
//         step++;
//         const progress = step / steps;
//         const easeOut = 1 - Math.pow(1 - progress, 3);
        
//         setAnimatedStats(targets.map(target => Math.floor(target * easeOut)));
        
//         if (step >= steps) {
//           clearInterval(timer);
//           setAnimatedStats(targets);
//         }
//       }, stepDuration);
//     };

//     const timer = setTimeout(animateStats, 500);
//     return () => {
//       clearTimeout(timer);
//       window.removeEventListener("scroll", handleScroll);
//     };
//   }, []);

//   const teamMembers = [
//     {
//       name: "Sarah Johnson",
//       role: "CEO & Founder",
//       image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
//       description: "Passionate about bringing people together through unforgettable experiences.",
//       linkedin: "https://linkedin.com/in/sarah-johnson",
//       twitter: "https://twitter.com/sarah_j",
//       quote: "Every great event starts with a single spark of imagination"
//     },
//     {
//       name: "Michael Chen",
//       role: "Head of Events",
//       image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
//       description: "Expert event coordinator with 10+ years of experience in large-scale productions.",
//       linkedin: "https://linkedin.com/in/michael-chen",
//       twitter: "https://twitter.com/michael_c",
//       quote: "Attention to detail creates extraordinary experiences"
//     },
//     {
//       name: "Emily Rodriguez",
//       role: "Creative Director",
//       image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
//       description: "Innovative designer who transforms spaces into magical experiences.",
//       linkedin: "https://linkedin.com/in/emily-rodriguez",
//       twitter: "https://twitter.com/emily_r",
//       quote: "Design is the silent ambassador of your brand"
//     },
//     {
//       name: "David Thompson",
//       role: "Technology Lead",
//       image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
//       description: "Building the future of event discovery and ticketing technology.",
//       linkedin: "https://linkedin.com/in/david-thompson",
//       twitter: "https://twitter.com/david_t",
//       quote: "Innovation happens at the intersection of technology and creativity"
//     }
//   ];

//   const stats = [
//     { number: animatedStats[0], suffix: "K+", label: "Happy Attendees", icon: <Users className="w-6 h-6" /> },
//     { number: animatedStats[1], suffix: "+", label: "Events Hosted", icon: <Calendar className="w-6 h-6" /> },
//     { number: animatedStats[2], suffix: "+", label: "Partner Venues", icon: <MapPin className="w-6 h-6" /> },
//     { number: animatedStats[3], suffix: "+", label: "Cities Worldwide", icon: <Globe className="w-6 h-6" /> }
//   ];

//   const values = [
//     {
//       icon: <Heart className="w-8 h-8" />,
//       title: "Community First",
//       description: "We believe in the power of bringing people together and creating lasting connections through shared experiences.",
//       color: "text-red-500",
//       bgColor: "bg-red-50"
//     },
//     {
//       icon: <Target className="w-8 h-8" />,
//       title: "Excellence",
//       description: "Every event we curate meets the highest standards of quality, ensuring memorable experiences for all attendees.",
//       color: "text-blue-500",
//       bgColor: "bg-blue-50"
//     },
//     {
//       icon: <Award className="w-8 h-8" />,
//       title: "Innovation",
//       description: "We continuously push boundaries to create unique, cutting-edge experiences that inspire and delight.",
//       color: "text-purple-500",
//       bgColor: "bg-purple-50"
//     },
//     {
//       icon: <Users className="w-8 h-8" />,
//       title: "Inclusivity",
//       description: "Our events welcome everyone, celebrating diversity and fostering an environment where all feel valued.",
//       color: "text-green-500",
//       bgColor: "bg-green-50"
//     }
//   ];

//   const features = [
//     {
//       icon: <Zap className="w-6 h-6" />,
//       title: "Lightning Fast Booking",
//       description: "Secure your spot in seconds with our streamlined booking process",
//       color: "bg-yellow-500"
//     },
//     {
//       icon: <Shield className="w-6 h-6" />,
//       title: "Secure Payments",
//       description: "Bank-level security for all transactions with fraud protection",
//       color: "bg-green-500"
//     },
//     {
//       icon: <Ticket className="w-6 h-6" />,
//       title: "Digital Tickets",
//       description: "No more paper tickets - everything is digital and eco-friendly",
//       color: "bg-blue-500"
//     },
//     {
//       icon: <Sparkles className="w-6 h-6" />,
//       title: "Smart Recommendations",
//       description: "AI-powered suggestions based on your interests and preferences",
//       color: "bg-purple-500"
//     }
//   ];

//   const tabs = [
//     { id: 0, label: "Our Story", icon: <Heart className="w-4 h-4" /> },
//     { id: 1, label: "Mission", icon: <Target className="w-4 h-4" /> },
//     { id: 2, label: "Impact", icon: <TrendingUp className="w-4 h-4" /> }
//   ];

//   const milestones = [
//     { year: "2018", title: "Founded", description: "EventKnit was born from a simple idea", icon: <Star className="w-6 h-6" /> },
//     { year: "2019", title: "First 1K Events", description: "Reached our first major milestone", icon: <Calendar className="w-6 h-6" /> },
//     { year: "2021", title: "Global Expansion", description: "Expanded to 25+ cities worldwide", icon: <Globe className="w-6 h-6" /> },
//     { year: "2023", title: "500K Attendees", description: "Half a million happy event-goers", icon: <Users className="w-6 h-6" /> },
//     { year: "2025", title: "AI Integration", description: "Launched smart event recommendations", icon: <Sparkles className="w-6 h-6" /> }
//   ];

//   const testimonials = [
//     {
//       name: "Alex Rivera",
//       role: "Event Organizer",
//       content: "EventKnit transformed how we manage events. The platform is intuitive and our attendees love the seamless experience.",
//       avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
//     },
//     {
//       name: "Maria Santos",
//       role: "Conference Attendee",
//       content: "I've discovered amazing events through EventKnit. The recommendation system really understands my interests.",
//       avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
//     },
//     {
//       name: "James Wilson",
//       role: "Venue Manager",
//       content: "Working with EventKnit has significantly increased our bookings. Their team is professional and supportive.",
//       avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />
      
//       {/* Hero Section with Enhanced Fading Image */}
//       <div className="relative h-screen overflow-hidden">
//         <div 
//           className="absolute inset-0 bg-cover bg-center bg-fixed"
//           style={{
//             backgroundImage: "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=1080&fit=crop')",
//             transform: `translateY(${scrollY * 0.5}px)`
//           }}
//         />
        
//         {/* Enhanced gradient overlay with better fading */}
//         <div className="absolute inset-0">
//           <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-background"></div>
//           <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"></div>
//           <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
//         </div>
        
//         {/* Hero Content */}
//         <div className="absolute inset-0 flex items-center justify-center">
//           <div className="container mx-auto px-6 text-center">
//             <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
//               <div className="mb-6">
//                 <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium border border-white/20">
//                   Creating Unforgettable Experiences Since 2018
//                 </span>
//               </div>
//               <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
//                 About
//                 <span className="block bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
//                   EventKnit
//                 </span>
//               </h1>
//               <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-4xl mx-auto mb-12">
//                 We're passionate about creating extraordinary experiences that bring people together, 
//                 inspire connections, and leave lasting memories that span across communities worldwide.
//               </p>
//               <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
//                 <Button size="lg" className="h-14 px-8 bg-white text-primary hover:bg-white/90 group">
//                   <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
//                   Watch Our Story
//                 </Button>
//                 <Button size="lg" variant="outline" className="h-14 px-8 text-white border-white/30 hover:bg-white/10 backdrop-blur-sm">
//                   <ArrowRight className="w-5 h-5 mr-2" />
//                   Explore Events
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Scroll indicator */}
//         <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
//           <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
//             <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
//           </div>
//         </div>
//       </div>

//       <div className="relative">
//         {/* Background with subtle pattern */}
//         <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background"></div>
        
//         <div className="relative container mx-auto px-6 py-20">
//           {/* Floating Stats Section */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32 -mt-16 relative z-10">
//             {stats.map((stat, index) => (
//               <Card key={index} className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 group bg-white/80 backdrop-blur-sm border-0 shadow-xl">
//                 <CardContent className="p-8">
//                   <div className="relative mb-6">
//                     <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
//                       <div className="text-white group-hover:scale-110 transition-transform duration-300">
//                         {stat.icon}
//                       </div>
//                     </div>
//                     <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                       <CheckCircle className="w-4 h-4 text-white" />
//                     </div>
//                   </div>
//                   <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-3">
//                     {stat.number}{stat.suffix}
//                   </div>
//                   <div className="text-lg font-medium text-muted-foreground">
//                     {stat.label}
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           {/* Enhanced Timeline Section */}
//           <div className="mb-32">
//             <div className="text-center mb-16">
//               <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
//                 Our Journey
//               </div>
//               <h2 className="text-4xl md:text-5xl font-bold mb-6">
//                 Milestones That 
//                 <span className="block text-primary">Define Us</span>
//               </h2>
//               <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
//                 From a small startup to a global platform, every step of our journey has been driven by our commitment to excellence
//               </p>
//             </div>
            
//             <div className="relative max-w-4xl mx-auto">
//               {/* Timeline line */}
//               <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary via-purple-400 to-primary"></div>
              
//               {milestones.map((milestone, index) => (
//                 <div key={index} className={`relative flex items-center mb-16 ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}>
//                   {/* Content */}
//                   <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
//                     <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/50 backdrop-blur-sm">
//                       <CardContent className="p-6">
//                         <div className="text-3xl font-bold text-primary mb-2">{milestone.year}</div>
//                         <h3 className="text-xl font-bold mb-3">{milestone.title}</h3>
//                         <p className="text-muted-foreground">{milestone.description}</p>
//                       </CardContent>
//                     </Card>
//                   </div>
                  
//                   {/* Central icon */}
//                   <div className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-r from-primary to-purple-400 rounded-full flex items-center justify-center shadow-lg z-10">
//                     <div className="text-white">
//                       {milestone.icon}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Enhanced Interactive Tabbed Content */}
//           <div className="mb-32">
//             <div className="text-center mb-16">
//               <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
//                 Get to Know Us
//               </div>
//               <h2 className="text-4xl md:text-5xl font-bold mb-6">Our Journey</h2>
//               <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
//                 Discover what drives us and how we're transforming the event industry
//               </p>
              
//               {/* Enhanced Tab Navigation */}
//               <div className="flex justify-center mb-12">
//                 <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-2 flex gap-2 shadow-lg border border-white/20">
//                   {tabs.map((tab) => (
//                     <button
//                       key={tab.id}
//                       onClick={() => setActiveTab(tab.id)}
//                       className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
//                         activeTab === tab.id
//                           ? 'bg-gradient-to-r from-primary to-purple-400 text-white shadow-lg scale-105'
//                           : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
//                       }`}
//                     >
//                       <div className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`}>
//                         {tab.icon}
//                       </div>
//                       {tab.label}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Enhanced Tab Content */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
//               <div className="space-y-6">
//                 {activeTab === 0 && (
//                   <div className="space-y-6">
//                     <h3 className="text-3xl font-bold">Our Story</h3>
//                     <p className="text-lg text-muted-foreground leading-relaxed">
//                       Founded in 2018 by a team of passionate event enthusiasts, EventKnit began as a simple idea: 
//                       make extraordinary experiences accessible to everyone. What started as a small platform has grown 
//                       into a global community connecting millions of people through shared experiences.
//                     </p>
//                     <p className="text-lg text-muted-foreground leading-relaxed">
//                       We've learned that the best events aren't just about entertainment—they're about creating 
//                       lasting memories, building communities, and bringing people together in meaningful ways.
//                     </p>
//                     <div className="flex items-center gap-4">
//                       <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
//                         <CheckCircle className="w-4 h-4 mr-1" />
//                         Founded 2018
//                       </Badge>
//                       <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
//                         <Star className="w-4 h-4 mr-1" />
//                         Award Winning
//                       </Badge>
//                     </div>
//                   </div>
//                 )}
                
//                 {activeTab === 1 && (
//                   <div className="space-y-6">
//                     <h3 className="text-3xl font-bold">Our Mission</h3>
//                     <p className="text-lg text-muted-foreground leading-relaxed">
//                       At EventKnit, we believe that life's most meaningful moments happen when people come together. 
//                       Our mission is to democratize access to extraordinary experiences, making it easier than ever 
//                       to discover, attend, and create events that matter.
//                     </p>
//                     <p className="text-lg text-muted-foreground leading-relaxed">
//                       We're building bridges between event organizers and attendees, fostering communities, 
//                       and turning ordinary moments into extraordinary memories through technology and innovation.
//                     </p>
//                     <div className="space-y-4">
//                       {[
//                         "Democratize event access",
//                         "Foster meaningful connections",
//                         "Innovate through technology"
//                       ].map((item, index) => (
//                         <div key={index} className="flex items-center gap-4">
//                           <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-400 rounded-full flex items-center justify-center">
//                             <CheckCircle className="w-4 h-4 text-white" />
//                           </div>
//                           <span className="text-muted-foreground font-medium">{item}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
                
//                 {activeTab === 2 && (
//                   <div className="space-y-6">
//                     <h3 className="text-3xl font-bold">Our Impact</h3>
//                     <p className="text-lg text-muted-foreground leading-relaxed">
//                       Since our launch, we've facilitated over 2,500 events across 50+ cities worldwide, 
//                       creating unforgettable experiences for more than 500,000 attendees. Our platform has 
//                       become a catalyst for community building and cultural exchange.
//                     </p>
//                     <p className="text-lg text-muted-foreground leading-relaxed">
//                       We're proud to support local businesses, artists, and organizers while providing 
//                       attendees with seamless, secure, and memorable event experiences.
//                     </p>
//                     <div className="grid grid-cols-2 gap-6">
//                       <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
//                         <div className="text-3xl font-bold text-green-600">98%</div>
//                         <div className="text-sm text-green-700 font-medium">Satisfaction Rate</div>
//                       </div>
//                       <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
//                         <div className="text-3xl font-bold text-blue-600">$2M+</div>
//                         <div className="text-sm text-blue-700 font-medium">Revenue Generated</div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
              
//               <div className="relative">
//                 <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-400/20 rounded-3xl transform rotate-6"></div>
//                 <img 
//                   src={
//                     activeTab === 0 
//                       ? "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop"
//                       : activeTab === 1
//                       ? "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
//                       : "https://images.unsplash.com/photo-1511795409834-47104e6f1dbd?w=800&h=600&fit=crop"
//                   }
//                   alt="EventKnit journey"
//                   className="relative rounded-3xl shadow-2xl transition-all duration-500 hover:scale-105"
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
//               </div>
//             </div>
//           </div>

//           {/* Enhanced Features Section */}
//           <div className="mb-32">
//             <div className="text-center mb-16">
//               <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
//                 Platform Features
//               </div>
//               <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose EventKnit?</h2>
//               <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
//                 Experience the future of event management with our cutting-edge features
//               </p>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//               {features.map((feature, index) => (
//                 <Card key={index} className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 group bg-white/50 backdrop-blur-sm border-0">
//                   <CardContent className="p-8">
//                     <div className="relative mb-6">
//                       <div className={`w-16 h-16 mx-auto ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
//                         <div className="text-white group-hover:scale-110 transition-transform duration-300">
//                           {feature.icon}
//                         </div>
//                       </div>
//                       <div className="absolute -top-2 -right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                         <Sparkles className="w-6 h-6 text-primary animate-spin" />
//                       </div>
//                     </div>
//                     <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
//                     <p className="text-muted-foreground leading-relaxed">
//                       {feature.description}
//                     </p>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           </div>

//           {/* Enhanced Values Section */}
//           <div className="mb-32">
//             <div className="text-center mb-16">
//               <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
//                 Our Core Values
//               </div>
//               <h2 className="text-4xl md:text-5xl font-bold mb-6">What Drives Us</h2>
//               <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
//                 These core principles guide everything we do and shape the experiences we create
//               </p>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//               {values.map((value, index) => (
//                 <Card key={index} className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 group border-0 overflow-hidden">
//                   <div className={`h-2 ${value.bgColor} group-hover:h-4 transition-all duration-300`}></div>
//                   <CardContent className="p-8">
//                     <div className={`mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300 ${value.color}`}>
//                       {value.icon}
//                     </div>
//                     <h3 className="text-xl font-bold mb-4">{value.title}</h3>
//                     <p className="text-muted-foreground leading-relaxed">
//                       {value.description}
//                     </p>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           </div>

//           {/* Enhanced Team Section */}
//           <div className="mb-32">
//             <div className="text-center mb-16">
//               <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
//                 Our Team
//               </div>
//               <h2 className="text-4xl md:text-5xl font-bold mb-6">Meet the Visionaries</h2>
//               <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
//                 The passionate individuals behind EventKnit who work tirelessly to bring you 
//                 the best event experiences
//               </p>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//               {teamMembers.map((member, index) => (
//                 <Card key={index} className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 group border-0 overflow-hidden">
//                   <div className="relative">
//                     <img 
//                       src={member.image}
//                       alt={member.name}
//                       className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
//                     />
//                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//                   </div>
                  
//                   <CardContent className="p-6 relative">
//                 <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
//                   <div className="w-16 h-16 bg-white rounded-full p-1 shadow-lg">
//                     <div className="w-full h-full bg-gradient-to-r from-primary to-purple-400 rounded-full flex items-center justify-center">
//                       <span className="text-white font-bold text-lg">{member.name.split(' ')[0][0]}</span>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="pt-8">
//                   <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">{member.name}</h3>
//                   <p className="text-primary font-medium mb-4">{member.role}</p>
//                   <p className="text-muted-foreground text-sm leading-relaxed mb-6">
//                     {member.description}
//                   </p>
                  
//                   {/* Quote */}
//                   <div className="bg-muted/30 p-4 rounded-lg mb-6 border-l-4 border-primary/30">
//                     <p className="text-sm italic text-muted-foreground">"{member.quote}"</p>
//                   </div>
                  
//                   <div className="flex justify-center gap-3">
//                     <Button 
//                       variant="outline" 
//                       size="icon" 
//                       className="h-9 w-9 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
//                       onClick={() => window.open(member.linkedin, '_blank')}
//                     >
//                       <Linkedin className="w-4 h-4" />
//                     </Button>
//                     <Button 
//                       variant="outline" 
//                       size="icon" 
//                       className="h-9 w-9 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
//                       onClick={() => window.open(member.twitter, '_blank')}
//                     >
//                       <Twitter className="w-4 h-4" />
//                     </Button>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>
//       </div>

//       {/* Enhanced Testimonials Section */}
//       <div className="mb-32">
//         <div className="text-center mb-16">
//           <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
//             What People Say
//           </div>
//           <h2 className="text-4xl md:text-5xl font-bold mb-6">Testimonials</h2>
//           <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
//             Hear from the amazing community that makes EventKnit special
//           </p>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           {testimonials.map((testimonial, index) => (
//             <Card key={index} className="hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 group bg-white/80 backdrop-blur-sm border-0">
//               <CardContent className="p-8 text-center">
//                 <div className="mb-6">
//                   <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-4 ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
//                     <img 
//                       src={testimonial.avatar}
//                       alt={testimonial.name}
//                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
//                     />
//                   </div>
//                   <div className="flex justify-center mb-4">
//                     {[...Array(5)].map((_, i) => (
//                       <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
//                     ))}
//                   </div>
//                 </div>
                
//                 <p className="text-muted-foreground italic leading-relaxed mb-6">
//                   "{testimonial.content}"
//                 </p>
                
//                 <div>
//                   <h4 className="font-bold text-lg">{testimonial.name}</h4>
//                   <p className="text-primary text-sm font-medium">{testimonial.role}</p>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>

//       {/* Enhanced CTA Section */}
//       <div className="mb-32">
//         <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 border-0 shadow-2xl">
//           <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10"></div>
//           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full transform translate-x-32 -translate-y-32"></div>
//           <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full transform -translate-x-24 translate-y-24"></div>
          
//           <CardContent className="relative p-16 text-center">
//             <div className="max-w-4xl mx-auto">
//               <div className="mb-8">
//                 <div className="flex justify-center mb-6">
//                   <div className="w-20 h-20 bg-gradient-to-r from-primary to-purple-400 rounded-full flex items-center justify-center shadow-lg">
//                     <Sparkles className="w-10 h-10 text-white animate-pulse" />
//                   </div>
//                 </div>
//                 <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
//                   Ready to Create 
//                   <span className="block bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
//                     Something Amazing?
//                   </span>
//                 </h2>
//                 <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12">
//                   Join thousands of event creators and attendees who are already part of the EventKnit community. 
//                   Your next unforgettable experience is just one click away.
//                 </p>
//               </div>
              
//               <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
//                 <Button size="lg" className="h-16 px-10 bg-gradient-to-r from-primary to-purple-400 hover:from-primary/90 hover:to-purple-400/90 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group">
//                   <Calendar className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
//                   Browse Events
//                   <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
//                 </Button>
//                 <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-semibold border-2 hover:bg-primary/5 transition-all duration-300 group">
//                   <Rocket className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
//                   Create Your Event
//                   <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
//                 </Button>
//               </div>
              
//               <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
//                 <div className="flex items-center gap-2">
//                   <CheckCircle className="w-4 h-4 text-green-500" />
//                   <span>Free to start</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <CheckCircle className="w-4 h-4 text-green-500" />
//                   <span>No setup fees</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <CheckCircle className="w-4 h-4 text-green-500" />
//                   <span>24/7 support</span>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Enhanced Contact Section */}
//       <div className="mb-32">
//         <div className="text-center mb-16">
//           <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
//             Get In Touch
//           </div>
//           <h2 className="text-4xl md:text-5xl font-bold mb-6">Let's Connect</h2>
//           <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
//             Have questions, ideas, or want to partner with us? We'd love to hear from you and explore how we can work together.
//           </p>
//         </div>
        
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
//           <div className="space-y-8">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer">
//                 <CardContent className="p-6 text-center">
//                   <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
//                     <Mail className="w-6 h-6 text-white" />
//                   </div>
//                   <h4 className="font-bold text-lg mb-2">Email Us</h4>
//                   <p className="text-muted-foreground">hello@eventknit.com</p>
//                   <p className="text-sm text-muted-foreground mt-2">Response within 24h</p>
//                 </CardContent>
//               </Card>
              
//               <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer">
//                 <CardContent className="p-6 text-center">
//                   <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
//                     <Phone className="w-6 h-6 text-white" />
//                   </div>
//                   <h4 className="font-bold text-lg mb-2">Call Us</h4>
//                   <p className="text-muted-foreground">+1 (555) 123-4567</p>
//                   <p className="text-sm text-muted-foreground mt-2">Mon-Fri 9AM-6PM PST</p>
//                 </CardContent>
//               </Card>
//             </div>
            
//             <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
//               <CardContent className="p-8">
//                 <div className="flex items-center gap-4 mb-6">
//                   <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
//                     <MapPin className="w-6 h-6 text-white" />
//                   </div>
//                   <div>
//                     <h4 className="font-bold text-lg">Visit Our Office</h4>
//                     <p className="text-muted-foreground">San Francisco, California</p>
//                   </div>
//                 </div>
//                 <p className="text-muted-foreground leading-relaxed">
//                   Located in the heart of Silicon Valley, our team is always excited to meet fellow event enthusiasts and potential partners.
//                 </p>
//               </CardContent>
//             </Card>
            
//             <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-muted/30 rounded-2xl">
//               <div>
//                 <h4 className="font-bold text-lg mb-2">Follow Our Journey</h4>
//                 <p className="text-muted-foreground">Stay updated with our latest events, features, and community stories</p>
//               </div>
//               <div className="flex gap-3">
//                 <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110">
//                   <Instagram className="w-5 h-5" />
//                 </Button>
//                 <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110">
//                   <Twitter className="w-5 h-5" />
//                 </Button>
//                 <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110">
//                   <Linkedin className="w-5 h-5" />
//                 </Button>
//               </div>
//             </div>
//           </div>
          
//           <div className="relative">
//             <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-400/20 rounded-3xl transform -rotate-3"></div>
//             <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-primary/20 rounded-3xl transform rotate-3"></div>
//             <img 
//               src="https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800&h=800&fit=crop"
//               alt="EventKnit team collaboration"
//               className="relative rounded-3xl shadow-2xl transition-all duration-500 hover:scale-105"
//             />
//             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
            
//             {/* Floating contact elements */}
//             <div className="absolute top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
//               <Heart className="w-6 h-6 text-red-500" />
//             </div>
//             <div className="absolute bottom-6 left-6 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
//               <div className="text-center">
//                 <div className="text-primary font-bold text-sm">24/7</div>
//                 <div className="text-xs text-muted-foreground">Support</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       </div>
//       <Footer />
//     </div>
//   );
// };

// export default About;