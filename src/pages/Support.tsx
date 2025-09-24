import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Search, 
  Phone, 
  Mail, 
  Video, 
  Users, 
  Clock, 
  CheckCircle, 
  Star,
  Send,
  Calendar,
  Ticket,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from "lucide-react";

const Support = () => {
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
    { id: "chat", label: "Live Chat", icon: MessageCircle },
    { id: "knowledge", label: "FAQ", icon: HelpCircle },
    { id: "contact", label: "Contact", icon: Mail },
    { id: "community", label: "Community", icon: Users }
  ];

  const quickActions = [
    { icon: Ticket, title: "Ticket Issues", description: "Registration & ticket problems", badge: "Most Common" },
    { icon: CreditCard, title: "Payments", description: "Billing & refunds", badge: "Quick Fix" },
    { icon: Calendar, title: "Event Setup", description: "Creating & managing events", badge: "Popular" },
    { icon: Settings, title: "Account", description: "Profile & settings", badge: "Self-Service" }
  ];

  const faqData = [
    {
      category: "Getting Started",
      questions: [
        { q: "How do I create my first event?", a: "Click 'Create Event', fill in details, set pricing, and publish. Our wizard guides you through each step." },
        { q: "What payment methods are accepted?", a: "All major credit cards, PayPal, Apple Pay, Google Pay, and bank transfers are supported." },
        { q: "How do I register for events?", a: "Browse events, select one, choose ticket type, and complete registration. You'll get email confirmation." }
      ]
    },
    {
      category: "Event Management",
      questions: [
        { q: "Can I edit published events?", a: "Yes, most details can be edited. Major changes like date/time will notify attendees automatically." },
        { q: "How do I manage attendees?", a: "Use your organizer dashboard for attendee lists, communications, check-ins, and data exports." },
        { q: "What analytics are available?", a: "Real-time dashboards show sales, demographics, revenue, and performance metrics with downloadable reports." }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        { q: "Site loading slowly - what to do?", a: "Refresh browser, clear cache, or try different browser. Contact support if issues persist." },
        { q: "Can't access my account", a: "Use 'Forgot Password' link or contact support with your email for assistance." },
        { q: "Is my data secure?", a: "Yes! We use bank-level encryption, secure servers, and comply with GDPR and privacy regulations." }
      ]
    }
  ];

  const contactMethods = [
    { icon: MessageCircle, title: "Live Chat", desc: "Instant help", avail: "Available now", response: "Minutes", color: "text-green-600" },
    { icon: Mail, title: "Email", desc: "Detailed support", avail: "24/7", response: "4 hours", color: "text-blue-600" },
    { icon: Phone, title: "Phone", desc: "Direct support", avail: "Mon-Fri 9AM-6PM", response: "Immediate", color: "text-purple-600" },
    { icon: Video, title: "Video Call", desc: "Screen sharing", avail: "By appointment", response: "Same day", color: "text-orange-600" }
  ];

  const stats = [
    { icon: CheckCircle, value: "98%", label: "Satisfaction", color: "text-green-600" },
    { icon: Clock, value: "<2min", label: "Response Time", color: "text-blue-600" },
    { icon: Star, value: "24/7", label: "Support", color: "text-purple-600" }
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
      
      setTimeout(() => {
        const agentResponse = {
          id: chatMessages.length + 2,
          type: "agent",
          message: "Thank you! I'm looking into this. Can you provide more details about the specific issue?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
        };
        setChatMessages(prev => [...prev, agentResponse]);
      }, 1500);
    }
  };

  const renderChatTab = () => (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="h-[450px] flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Live Chat Support</h3>
                  <p className="text-xs text-muted-foreground">Sarah is online</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Online</span>
              </div>
            </div>
          </CardHeader>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <img src={msg.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  <div className={`rounded-lg px-3 py-2 text-sm ${
                    msg.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <p>{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t p-3">
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
        </Card>
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.slice(0, 3).map((action, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded hover:bg-muted cursor-pointer">
                <action.icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Support Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center space-x-3">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderKnowledgeTab = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search FAQ..."
          className="pl-10"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {faqData.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{category.category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.questions.map((faq, faqIndex) => {
                const globalIndex = categoryIndex * 10 + faqIndex;
                const isExpanded = expandedFaq === globalIndex;
                return (
                  <div key={faqIndex} className="border rounded">
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : globalIndex)}
                      className="w-full p-3 text-left flex items-center justify-between hover:bg-muted/50 transition-colors text-sm"
                    >
                      <span className="font-medium">{faq.q}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 text-sm text-muted-foreground border-t bg-muted/20">
                        {faq.a}
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
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <h3 className="font-semibold mb-4">Contact Methods</h3>
        <div className="grid gap-3">
          {contactMethods.map((method, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <method.icon className={`w-5 h-5 ${method.color}`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{method.title}</h4>
                    <p className="text-xs text-muted-foreground">{method.desc}</p>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{method.avail}</span>
                      <span>{method.response}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold mb-4">Send Message</h3>
        <Card>
          <CardContent className="p-4 space-y-3">
             <div className="grid grid-cols-2 gap-3">
               <Input placeholder="Name" />
               <Input placeholder="Email" type="email" />
             </div>
             <Input placeholder="Subject" />
            <Textarea placeholder="Message..." rows={4} className="text-sm" />
            <Button className="w-full" size="sm">
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCommunityTab = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-3">Join Our Community</h3>
      <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
        Connect with event organizers, share tips, and learn from the EventKnit community.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button>
          <Users className="w-4 h-4 mr-2" />
          Community Forum
        </Button>
        <Button variant="outline">
          <Video className="w-4 h-4 mr-2" />
          Video Tutorials
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Support Center</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get instant help, find answers, or connect with our community
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-all group">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{action.description}</p>
                  <Badge variant="secondary" className="text-xs">{action.badge}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Support Interface */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex flex-wrap gap-2">
                {supportTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    onClick={() => setActiveTab(tab.id)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {activeTab === "chat" && renderChatTab()}
              {activeTab === "knowledge" && renderKnowledgeTab()}
              {activeTab === "contact" && renderContactTab()}
              {activeTab === "community" && renderCommunityTab()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Support;











// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import { 
//   MessageCircle, 
//   Search, 
//   Phone, 
//   Mail, 
//   Video, 
//   Users, 
//   Clock, 
//   CheckCircle, 
//   Star,
//   Send,
//   Calendar,
//   Ticket,
//   CreditCard,
//   Settings,
//   Zap,
//   BookOpen,
//   ChevronDown,
//   ChevronUp
// } from "lucide-react";

// const Support = () => {
//   const [activeTab, setActiveTab] = useState("chat");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [chatMessage, setChatMessage] = useState("");
//   const [chatMessages, setChatMessages] = useState([
//     {
//       id: 1,
//       type: "agent",
//       message: "Hello! I'm Sarah from EventKnit Support. How can I help you today?",
//       timestamp: "2:30 PM",
//       avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
//     }
//   ]);
//   const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

//   const supportTabs = [
//     { id: "chat", label: "Live Chat", icon: MessageCircle, color: "text-primary" },
//     { id: "knowledge", label: "Knowledge Base", icon: BookOpen, color: "text-accent-electric" },
//     { id: "contact", label: "Contact Us", icon: Mail, color: "text-accent-neon" },
//     { id: "community", label: "Community", icon: Users, color: "text-primary" }
//   ];

//   const quickActions = [
//     {
//       icon: Ticket,
//       title: "Ticket Issues",
//       description: "Problems with event tickets or registration",
//       color: "bg-blue-100 text-blue-600",
//       count: "Most Common"
//     },
//     {
//       icon: CreditCard,
//       title: "Payment Problems",
//       description: "Billing, refunds, and payment questions",
//       color: "bg-green-100 text-green-600",
//       count: "Quick Fix"
//     },
//     {
//       icon: Calendar,
//       title: "Event Management",
//       description: "Creating and managing events",
//       color: "bg-purple-100 text-purple-600",
//       count: "Popular"
//     },
//     {
//       icon: Settings,
//       title: "Account Settings",
//       description: "Profile, preferences, and security",
//       color: "bg-orange-100 text-orange-600",
//       count: "Self-Service"
//     }
//   ];

//   const faqCategories = [
//     {
//       category: "Getting Started",
//       icon: Zap,
//       questions: [
//         {
//           question: "How do I create my first event?",
//           answer: "Creating an event is easy! Click 'Create Event' in the top navigation, fill in your event details, set your pricing, and publish. Our step-by-step wizard will guide you through the entire process."
//         },
//         {
//           question: "What payment methods do you accept?",
//           answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through our trusted payment partners."
//         },
//         {
//           question: "How do I register for an event?",
//           answer: "Simply browse our events, click on one that interests you, select your ticket type, and complete the registration form. You'll receive a confirmation email with your ticket details."
//         }
//       ]
//     },
//     {
//       category: "Event Management",
//       icon: Calendar,
//       questions: [
//         {
//           question: "Can I edit my event after publishing?",
//           answer: "Yes! You can edit most event details after publishing. However, some changes like date/time may require attendee notification. Visit your event dashboard to make updates."
//         },
//         {
//           question: "How do I manage attendees?",
//           answer: "Use your organizer dashboard to view attendee lists, send communications, check-in attendees, and export attendee data. You can also manage waitlists and cancellations."
//         },
//         {
//           question: "What analytics are available?",
//           answer: "Get detailed insights on ticket sales, attendee demographics, revenue tracking, and event performance. Access real-time dashboards and downloadable reports."
//         }
//       ]
//     },
//     {
//       category: "Technical Support",
//       icon: Settings,
//       questions: [
//         {
//           question: "The website is loading slowly. What should I do?",
//           answer: "Try refreshing your browser, clearing your cache, or using a different browser. If the issue persists, check your internet connection or contact our technical support team."
//         },
//         {
//           question: "I can't access my account. Help!",
//           answer: "Try resetting your password using the 'Forgot Password' link. If you're still having trouble, contact support with your email address and we'll help you regain access."
//         },
//         {
//           question: "Is my data secure?",
//           answer: "Absolutely! We use industry-standard encryption, secure servers, and comply with GDPR and other privacy regulations. Your data is protected with bank-level security."
//         }
//       ]
//     }
//   ];

//   const contactMethods = [
//     {
//       icon: MessageCircle,
//       title: "Live Chat",
//       description: "Get instant help from our support team",
//       availability: "Available now",
//       responseTime: "Usually responds in minutes",
//       color: "text-primary"
//     },
//     {
//       icon: Mail,
//       title: "Email Support",
//       description: "Send us a detailed message",
//       availability: "24/7",
//       responseTime: "Response within 4 hours",
//       color: "text-accent-electric"
//     },
//     {
//       icon: Phone,
//       title: "Phone Support",
//       description: "Speak directly with our team",
//       availability: "Mon-Fri, 9AM-6PM EST",
//       responseTime: "Immediate",
//       color: "text-accent-neon"
//     },
//     {
//       icon: Video,
//       title: "Video Call",
//       description: "Schedule a screen sharing session",
//       availability: "By appointment",
//       responseTime: "Same day booking",
//       color: "text-primary"
//     }
//   ];

//   const handleSendMessage = () => {
//     if (chatMessage.trim()) {
//       const newMessage = {
//         id: chatMessages.length + 1,
//         type: "user",
//         message: chatMessage,
//         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
//       };
//       setChatMessages([...chatMessages, newMessage]);
//       setChatMessage("");
      
//       // Simulate agent response
//       setTimeout(() => {
//         const agentResponse = {
//           id: chatMessages.length + 2,
//           type: "agent",
//           message: "Thank you for your message! I'm looking into this for you. Can you provide more details about the specific issue you're experiencing?",
//           timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//           avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
//         };
//         setChatMessages(prev => [...prev, agentResponse]);
//       }, 2000);
//     }
//   };

//   const renderChatTab = () => (
//     <div className="space-y-6">
//       {/* Chat Interface */}
//       <Card className="h-[500px] flex flex-col">
//         <CardHeader className="pb-3">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
//                 <MessageCircle className="w-5 h-5 text-primary" />
//               </div>
//               <div>
//                 <CardTitle className="text-lg">Live Chat Support</CardTitle>
//                 <p className="text-sm text-muted-foreground">Sarah is online now</p>
//               </div>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//               <span className="text-sm text-green-600">Online</span>
//             </div>
//           </div>
//         </CardHeader>
        
//         <CardContent className="flex-1 flex flex-col p-0">
//           {/* Chat Messages */}
//           <div className="flex-1 overflow-y-auto p-4 space-y-4">
//             {chatMessages.map((msg) => (
//               <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
//                 <div className={`flex items-start space-x-2 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
//                   <img 
//                     src={msg.avatar} 
//                     alt="Avatar" 
//                     className="w-8 h-8 rounded-full object-cover"
//                   />
//                   <div className={`rounded-2xl px-4 py-2 ${
//                     msg.type === 'user' 
//                       ? 'bg-primary text-primary-foreground' 
//                       : 'bg-muted text-muted-foreground'
//                   }`}>
//                     <p className="text-sm">{msg.message}</p>
//                     <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
          
//           {/* Chat Input */}
//           <div className="border-t p-4">
//             <div className="flex space-x-2">
//               <Input
//                 value={chatMessage}
//                 onChange={(e) => setChatMessage(e.target.value)}
//                 placeholder="Type your message..."
//                 onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
//                 className="flex-1"
//               />
//               <Button onClick={handleSendMessage} size="sm">
//                 <Send className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );

//   const renderKnowledgeTab = () => (
//     <div className="space-y-6">
//       {/* Search Bar */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
//             <Input
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search our knowledge base..."
//               className="pl-10 pr-4 py-3 text-lg"
//             />
//           </div>
//         </CardContent>
//       </Card>

//       {/* FAQ Categories */}
//       <div className="space-y-6">
//         {faqCategories.map((category, categoryIndex) => (
//           <Card key={categoryIndex}>
//             <CardHeader>
//               <CardTitle className="flex items-center space-x-2">
//                 <category.icon className="w-5 h-5 text-primary" />
//                 <span>{category.category}</span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-2">
//               {category.questions.map((faq, faqIndex) => {
//                 const isExpanded = expandedFaq === faqIndex;
//                 return (
//                   <div key={faqIndex} className="border rounded-lg">
//                     <button
//                       onClick={() => setExpandedFaq(isExpanded ? null : faqIndex)}
//                       className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
//                     >
//                       <span className="font-medium">{faq.question}</span>
//                       {isExpanded ? (
//                         <ChevronUp className="w-5 h-5 text-muted-foreground" />
//                       ) : (
//                         <ChevronDown className="w-5 h-5 text-muted-foreground" />
//                       )}
//                     </button>
//                     {isExpanded && (
//                       <div className="px-4 pb-4 text-muted-foreground">
//                         {faq.answer}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );

//   const renderContactTab = () => (
//     <div className="space-y-6">
//       {/* Contact Methods */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {contactMethods.map((method, index) => {
//           const Icon = method.icon;
//           return (
//             <Card key={index} variant="interactive" className="group cursor-pointer">
//               <CardContent className="p-6">
//                 <div className="flex items-start space-x-4">
//                   <div className={`w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 ${method.color}`}>
//                     <Icon className="w-6 h-6" />
//                   </div>
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
//                       {method.title}
//                     </h3>
//                     <p className="text-sm text-muted-foreground mb-2">
//                       {method.description}
//                     </p>
//                     <div className="flex items-center justify-between text-xs text-muted-foreground">
//                       <span>{method.availability}</span>
//                       <span>{method.responseTime}</span>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           );
//         })}
//       </div>

//       {/* Contact Form */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Send us a Message</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <Input placeholder="Your Name" />
//             <Input placeholder="Your Email" type="email" />
//           </div>
//           <div>
//             <Input placeholder="Subject" />
//           </div>
//           <div>
//             <Textarea 
//               placeholder="Describe your issue or question..."
//               rows={6}
//             />
//           </div>
//           <Button className="w-full">
//             <Send className="w-4 h-4 mr-2" />
//             Send Message
//           </Button>
//         </CardContent>
//       </Card>
//     </div>
//   );

//   const renderCommunityTab = () => (
//     <div className="space-y-6">
//       <Card>
//         <CardContent className="p-8 text-center">
//           <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Users className="w-8 h-8 text-primary" />
//           </div>
//           <h3 className="text-xl font-semibold text-foreground mb-3">
//             Join Our Community
//           </h3>
//           <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
//             Connect with other event organizers and attendees. Share tips, ask questions, 
//             and learn from the EventKnit community.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <Button>
//               <Users className="w-4 h-4 mr-2" />
//               Join Community Forum
//             </Button>
//             <Button variant="outline">
//               <Video className="w-4 h-4 mr-2" />
//               Watch Tutorials
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
//       <Navbar />
      
//       <div className="container mx-auto px-4 sm:px-6 py-16">
//         <div className="max-w-6xl mx-auto">
          
//           {/* Header */}
//           <div className="text-center mb-12">
//             <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
//               How can we help you?
//             </h1>
//             <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
//               Get instant support, find answers in our knowledge base, or connect with our community. 
//               We're here to make your EventKnit experience amazing.
//             </p>
//           </div>

//           {/* Quick Actions */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
//             {quickActions.map((action, index) => {
//               const Icon = action.icon;
//               return (
//                 <Card 
//                   key={index}
//                   variant="interactive"
//                   className="group cursor-pointer hover:shadow-card-hover transition-all duration-300"
//                 >
//                   <CardContent className="p-6 text-center">
//                     <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
//                       <Icon className="w-8 h-8" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
//                       {action.title}
//                     </h3>
//                     <p className="text-sm text-muted-foreground mb-2">
//                       {action.description}
//                     </p>
//                     <Badge variant="secondary" className="text-xs">
//                       {action.count}
//                     </Badge>
//                   </CardContent>
//                 </Card>
//               );
//             })}
//           </div>

//           {/* Support Tabs */}
//           <Card className="mb-8">
//             <CardHeader>
//               <div className="flex flex-wrap gap-2">
//                 {supportTabs.map((tab) => {
//                   const Icon = tab.icon;
//                   const isActive = activeTab === tab.id;
//                   return (
//                     <Button
//                       key={tab.id}
//                       variant={isActive ? "default" : "outline"}
//                       onClick={() => setActiveTab(tab.id)}
//                       className={`flex items-center gap-2 ${
//                         isActive 
//                           ? "bg-primary text-primary-foreground" 
//                           : "hover:bg-primary hover:text-primary-foreground"
//                       }`}
//                     >
//                       <Icon className="w-4 h-4" />
//                       {tab.label}
//                     </Button>
//                   );
//                 })}
//               </div>
//             </CardHeader>
//             <CardContent>
//               {activeTab === "chat" && renderChatTab()}
//               {activeTab === "knowledge" && renderKnowledgeTab()}
//               {activeTab === "contact" && renderContactTab()}
//               {activeTab === "community" && renderCommunityTab()}
//             </CardContent>
//           </Card>

//           {/* Support Stats */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             <Card>
//               <CardContent className="p-6 text-center">
//                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                   <CheckCircle className="w-6 h-6 text-green-600" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-foreground mb-1">98%</h3>
//                 <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardContent className="p-6 text-center">
//                 <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                   <Clock className="w-6 h-6 text-blue-600" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-foreground mb-1">&lt; 2min</h3>
//                 <p className="text-sm text-muted-foreground">Average Response Time</p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardContent className="p-6 text-center">
//                 <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                   <Star className="w-6 h-6 text-purple-600" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-foreground mb-1">24/7</h3>
//                 <p className="text-sm text-muted-foreground">Support Available</p>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Decorative Elements */}
//           <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl"></div>
//           <div className="absolute top-40 right-10 w-24 h-24 bg-accent-electric/20 rounded-full blur-lg"></div>
//           <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-accent-neon/20 rounded-full blur-md"></div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// };

// export default Support;
