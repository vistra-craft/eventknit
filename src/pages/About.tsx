import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Target, Award, Heart, MapPin, Mail, Phone, Linkedin, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";

const About = () => {
  const navigate = useNavigate();

  const teamMembers = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
      description: "Passionate about bringing people together through unforgettable experiences."
    },
    {
      name: "Michael Chen",
      role: "Head of Events",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      description: "Expert event coordinator with 10+ years of experience in large-scale productions."
    },
    {
      name: "Emily Rodriguez",
      role: "Creative Director",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      description: "Innovative designer who transforms spaces into magical experiences."
    },
    {
      name: "David Thompson",
      role: "Technology Lead",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
      description: "Building the future of event discovery and ticketing technology."
    }
  ];

  const stats = [
    { number: "500K+", label: "Happy Attendees" },
    { number: "2,500+", label: "Events Hosted" },
    { number: "150+", label: "Partner Venues" },
    { number: "50+", label: "Cities Worldwide" }
  ];

  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Community First",
      description: "We believe in the power of bringing people together and creating lasting connections through shared experiences."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Excellence",
      description: "Every event we curate meets the highest standards of quality, ensuring memorable experiences for all attendees."
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Innovation",
      description: "We continuously push boundaries to create unique, cutting-edge experiences that inspire and delight."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Inclusivity",
      description: "Our events welcome everyone, celebrating diversity and fostering an environment where all feel valued."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with Fading Image */}
      <div className="relative h-[70vh] overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=1080&fit=crop"
          alt="About EventHub - Creating Unforgettable Experiences"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for fading effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40"></div>
        

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <div className="max-w-4xl">
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                About EventHub
              </h1>
              <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed max-w-3xl">
                We're passionate about creating extraordinary experiences that bring people together, 
                inspire connections, and leave lasting memories.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.number}
              </div>
              <div className="text-lg text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              At EventHub, we believe that life's most meaningful moments happen when people come together. 
              Our mission is to democratize access to extraordinary experiences, making it easier than ever 
              to discover, attend, and create events that matter.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Since our founding in 2018, we've been dedicated to building bridges between event organizers 
              and attendees, fostering communities, and turning ordinary moments into extraordinary memories.
            </p>
            <Button size="lg" className="h-12 px-8">
              Join Our Community
            </Button>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop"
              alt="People enjoying an event"
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              These core principles guide everything we do and shape the experiences we create.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} variant="default" className="text-center h-full">
                <CardContent className="p-8">
                  <div className="text-primary mb-4 flex justify-center">
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

        {/* Team Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The passionate individuals behind EventHub who work tirelessly to bring you 
              the best event experiences.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} variant="default" className="text-center hover:shadow-card-hover transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <img 
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto object-cover mb-4"
                    />
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Twitter className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <Card variant="gradient">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">Get in Touch</CardTitle>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or want to partner with us? We'd love to hear from you.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Email Us</h4>
                <p className="text-muted-foreground">hello@eventhub.com</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Call Us</h4>
                <p className="text-muted-foreground">+1 (555) 123-4567</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
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
                <Button variant="outline" size="icon">
                  <Instagram className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Twitter className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Linkedin className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;