import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Home,
  AlertCircle
} from "lucide-react";
import BackButton from "@/components/BackButton";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Main 404 Content */}
          <div className="text-center mb-16">
            {/* Animated 404 Number */}
            <div className="relative mb-8">
              <div className="text-9xl sm:text-[12rem] font-bold text-primary/10 select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-12 h-12 text-primary" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-4 mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Page Not Found
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Oops! The page you're looking for seems to have wandered off to another event. 
                Don't worry, we'll help you find your way back to the action.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                onClick={() => navigate("/")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary px-8 py-3 text-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
              <BackButton label="Go Back" />
            </div>
          </div>


          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-10 w-24 h-24 bg-primary/10 rounded-full blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-primary/10 rounded-full blur-md"></div>
          <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-primary/10 rounded-full blur-sm"></div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
