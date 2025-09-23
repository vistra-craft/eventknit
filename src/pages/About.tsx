import { Users, Target, Award, Heart, MapPin, Mail, Phone, Linkedin, Twitter, Instagram, Play, CheckCircle, TrendingUp, Globe, Star, ArrowRight, Calendar, Ticket, Sparkles, Settings, Clock, DollarSign, Rocket, QrCode, BarChart3, Bell, Smartphone as Mobile, CheckCircle2, Eye, BarChart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";

const About = () => {
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

        {/* Process Section */}
        <section className="py-20 bg-gradient-to-b from-primary/5 via-background to-muted/20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                How We Work With You
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our streamlined process ensures seamless attendee management for your events
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Consultation",
                  description: "We discuss your event requirements and create a customized management plan."
                },
                {
                  step: "02", 
                  title: "Setup & Integration",
                  description: "Our team handles all technical setup and integrations with your existing systems."
                },
                {
                  step: "03",
                  title: "Training & Support",
                  description: "We provide comprehensive training and ongoing support throughout your event."
                },
                {
                  step: "04",
                  title: "Analytics & Optimization",
                  description: "Post-event analysis and recommendations for continuous improvement."
                }
              ].map((process, index) => (
                <div key={index} className="text-center animate-fade-up" style={{animationDelay: `${index * 200}ms`}}>
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-6 shadow-glow">
                    {process.step}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">{process.title}</h3>
                  <p className="text-muted-foreground">{process.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


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

        {/* Process Steps Section */}
        <div className="py-20 bg-gradient-to-b from-background to-muted/30 mb-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-primary">Sell Event Tickets Online</span> in 2 Simple Steps
              </h2>
            </div>

            <div className="relative max-w-6xl mx-auto">
              {/* Step 1 */}
              <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                <div className="order-2 md:order-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-8xl font-bold text-muted-foreground/20">1</div>
                    <div>
                      <h3 className="text-2xl font-bold text-navy">Step</h3>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold">
                        Book A Demo
                      </div>
                      <div className="text-primary text-2xl">→</div>
                      <div className="text-navy font-medium">Set up your account</div>
                      <div className="text-primary text-2xl">→</div>
                      <div className="text-navy font-medium">Get onboarding assistance</div>
                    </div>
                  </div>
                </div>
                
                <div className="order-1 md:order-2 relative">
                  <svg className="w-full h-32" viewBox="0 0 400 100">
                    <path
                      d="M 50 50 Q 200 10 350 50"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      fill="none"
                      className="animate-pulse"
                    />
                    <circle cx="50" cy="50" r="6" fill="hsl(var(--primary))" />
                  </svg>
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative">
                  <svg className="w-full h-32" viewBox="0 0 400 100">
                    <path
                      d="M 50 50 Q 200 90 350 50"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      fill="none"
                      className="animate-pulse"
                    />
                    <circle cx="350" cy="50" r="6" fill="hsl(var(--primary))" />
                  </svg>
                </div>
                
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-8xl font-bold text-muted-foreground/20">2</div>
                    <div>
                      <h3 className="text-2xl font-bold text-navy">Step</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="font-semibold text-navy mb-2">Create an event</div>
                      <div className="text-muted-foreground">→</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="font-semibold text-navy mb-2">Customize tickets</div>
                      <div className="text-muted-foreground">→</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="font-semibold text-navy mb-2">Launch sales & track analytics</div>
                      <div className="text-muted-foreground">→</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="font-semibold text-navy mb-2">Start selling tickets online</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-16">
              <Button size="lg" className="bg-primary hover:bg-primary-light text-primary-foreground px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all">
                Book A Demo
              </Button>
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

        {/* Success Stories Section */}
        <div className="py-20 bg-background mb-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Turn Your Events into <span className="text-primary">High-Revenue Success Stories</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
                See how Yapsody's ticketing platform transforms event ticketing challenges into sold-out events with tailored solutions. Real stories, real success!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              <Card className="group overflow-hidden border-0 shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop"
                    alt="Concert Venue Success Story"
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      Yapsody
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardContent className="p-6">
                  <div className="text-sm text-primary font-semibold mb-2">Concert Venue</div>
                  <h3 className="text-lg font-bold text-navy leading-tight group-hover:text-primary transition-colors duration-300">
                    How Yapsody Helped Boot Barn Hall Simplify Reporting And Sales
                  </h3>
                </CardContent>
              </Card>

              <Card className="group overflow-hidden border-0 shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="/src/assets/event-concert.jpg"
                    alt="Casino Resort Success Story"
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      Yapsody
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardContent className="p-6">
                  <div className="text-sm text-primary font-semibold mb-2">Casino Resort</div>
                  <h3 className="text-lg font-bold text-navy leading-tight group-hover:text-primary transition-colors duration-300">
                    How Yapsody Delivered Custom Ticketing & Security Solutions
                  </h3>
                </CardContent>
              </Card>

              <Card className="group overflow-hidden border-0 shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"
                    alt="Sports Event Success Story"
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      Yapsody
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardContent className="p-6">
                  <div className="text-sm text-primary font-semibold mb-2">Sports Event</div>
                  <h3 className="text-lg font-bold text-navy leading-tight group-hover:text-primary transition-colors duration-300">
                    How Yapsody Helped Black Rodeo USA Tackle Ticket Scalping Through Blocklist Feature Customization
                  </h3>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary-light text-primary-foreground px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Discover More Success Stories
              </Button>
            </div>
          </div>
        </div>

        {/* Interactive CTA Section */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20 mb-20">
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

        {/* Event Presenters Testimonials Section */}
        <div className="py-20 bg-gradient-to-b from-muted/30 to-background mb-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Event Presenters Share Their <span className="text-primary">Yapsody Experience</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
                Our renowned event ticketing software has a proven track record of helping presenters sell tickets fast worldwide.
              </p>
            </div>

            {/* Testimonials Carousel */}
            <div className="relative overflow-hidden">
              <div className="flex animate-scroll gap-8">
                {/* First set of testimonials */}
                <div className="flex gap-8 flex-shrink-0">
                  <Card className="w-80 bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <img 
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                            alt="John Smith"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-navy">John Smith</h4>
                          <p className="text-sm text-muted-foreground">Music Festival Organizer</p>
                        </div>
                      </div>
                      <blockquote className="text-muted-foreground italic leading-relaxed">
                        "Yapsody transformed our ticket sales completely. We sold out our festival in record time and the analytics helped us understand our audience better than ever."
                      </blockquote>
                    </CardContent>
                  </Card>

                  <Card className="w-80 bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <img 
                            src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
                            alt="Sarah Johnson"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-navy">Sarah Johnson</h4>
                          <p className="text-sm text-muted-foreground">Corporate Events Manager</p>
                        </div>
                      </div>
                      <blockquote className="text-muted-foreground italic leading-relaxed">
                        "The ease of use is incredible. From setting up events to managing attendees, Yapsody makes everything seamless. Our corporate clients love the professional experience."
                      </blockquote>
                    </CardContent>
                  </Card>

                  <Card className="w-80 bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <img 
                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
                            alt="Mike Chen"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-navy">Mike Chen</h4>
                          <p className="text-sm text-muted-foreground">Sports Event Coordinator</p>
                        </div>
                      </div>
                      <blockquote className="text-muted-foreground italic leading-relaxed">
                        "The QR code check-in feature is a game-changer. We can handle large crowds efficiently and the real-time analytics help us optimize our events on the fly."
                      </blockquote>
                    </CardContent>
                  </Card>
                </div>

                {/* Duplicate set for seamless loop */}
                <div className="flex gap-8 flex-shrink-0">
                  <Card className="w-80 bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <img 
                            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
                            alt="Emily Rodriguez"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-navy">Emily Rodriguez</h4>
                          <p className="text-sm text-muted-foreground">Art Gallery Director</p>
                        </div>
                      </div>
                      <blockquote className="text-muted-foreground italic leading-relaxed">
                        "Yapsody's customization options are perfect for our art exhibitions. We can create unique experiences that match our brand and engage our visitors beautifully."
                      </blockquote>
                    </CardContent>
                  </Card>

                  <Card className="w-80 bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <img 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                            alt="David Thompson"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-navy">David Thompson</h4>
                          <p className="text-sm text-muted-foreground">Conference Organizer</p>
                        </div>
                      </div>
                      <blockquote className="text-muted-foreground italic leading-relaxed">
                        "The reporting features are outstanding. We get detailed insights into attendee behavior and can make data-driven decisions for future events."
                      </blockquote>
                    </CardContent>
                  </Card>

                  <Card className="w-80 bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <img 
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
                            alt="Lisa Wang"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-navy">Lisa Wang</h4>
                          <p className="text-sm text-muted-foreground">Wedding Planner</p>
                        </div>
                      </div>
                      <blockquote className="text-muted-foreground italic leading-relaxed">
                        "For intimate events like weddings, Yapsody provides the perfect balance of elegance and functionality. Our clients appreciate the seamless experience."
                      </blockquote>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

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
























