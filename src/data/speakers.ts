export interface Speaker {
  id: number;
  name: string;
  position: string;
  company: string;
  avatar: string;
  bio: string;
  expertise: string[];
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export const speakers: Speaker[] = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    position: "Chief Technology Officer",
    company: "TechCorp Solutions",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    bio: "Leading digital transformation initiatives across enterprise organizations.",
    expertise: ["AI/ML", "Cloud Computing", "Digital Strategy"],
    socialLinks: {
      twitter: "@sarahjohnson",
      linkedin: "sarah-johnson-cto"
    }
  },
  {
    id: 2,
    name: "Michael Chen",
    position: "Senior Software Engineer",
    company: "InnovateLab",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    bio: "Expert in scalable systems and microservices architecture.",
    expertise: ["Backend Development", "System Design", "DevOps"],
    socialLinks: {
      linkedin: "michael-chen-dev"
    }
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    position: "Product Manager",
    company: "FutureTech",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    bio: "Driving product innovation and user experience excellence.",
    expertise: ["Product Strategy", "UX Design", "Agile Management"],
    socialLinks: {
      twitter: "@emilyrodriguez",
      linkedin: "emily-rodriguez-pm"
    }
  },
  {
    id: 4,
    name: "David Kim",
    position: "Data Scientist",
    company: "Analytics Pro",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    bio: "Specializing in machine learning and predictive analytics.",
    expertise: ["Machine Learning", "Data Analysis", "Python"],
    socialLinks: {
      linkedin: "david-kim-ds"
    }
  },
  {
    id: 5,
    name: "Lisa Thompson",
    position: "UX Designer",
    company: "Design Studio",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    bio: "Creating intuitive and accessible user experiences.",
    expertise: ["UI/UX Design", "User Research", "Prototyping"],
    socialLinks: {
      twitter: "@lisathompson",
      website: "lisathompson.design"
    }
  },
  {
    id: 6,
    name: "James Wilson",
    position: "DevOps Engineer",
    company: "CloudScale",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    bio: "Building robust and scalable infrastructure solutions.",
    expertise: ["DevOps", "Cloud Infrastructure", "Automation"],
    socialLinks: {
      linkedin: "james-wilson-devops"
    }
  },
  {
    id: 7,
    name: "Maria Garcia",
    position: "Frontend Developer",
    company: "WebCraft",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    bio: "Crafting beautiful and performant web applications.",
    expertise: ["React", "TypeScript", "Web Performance"],
    socialLinks: {
      twitter: "@mariagarcia",
      linkedin: "maria-garcia-frontend"
    }
  },
  {
    id: 8,
    name: "Alex Turner",
    position: "Security Engineer",
    company: "SecureTech",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
    bio: "Protecting systems and data from cyber threats.",
    expertise: ["Cybersecurity", "Penetration Testing", "Risk Assessment"],
    socialLinks: {
      linkedin: "alex-turner-security"
    }
  },
  {
    id: 9,
    name: "Rachel Brown",
    position: "Mobile Developer",
    company: "AppMakers",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    bio: "Building cross-platform mobile applications.",
    expertise: ["React Native", "iOS Development", "Android Development"],
    socialLinks: {
      twitter: "@rachelbrown",
      linkedin: "rachel-brown-mobile"
    }
  },
  {
    id: 10,
    name: "Kevin Lee",
    position: "Blockchain Developer",
    company: "CryptoLab",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    bio: "Developing decentralized applications and smart contracts.",
    expertise: ["Blockchain", "Smart Contracts", "Web3"],
    socialLinks: {
      linkedin: "kevin-lee-blockchain"
    }
  },
  {
    id: 11,
    name: "Sophie Anderson",
    position: "QA Engineer",
    company: "QualityFirst",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
    bio: "Ensuring software quality through comprehensive testing.",
    expertise: ["Test Automation", "Quality Assurance", "Bug Tracking"],
    socialLinks: {
      linkedin: "sophie-anderson-qa"
    }
  },
  {
    id: 12,
    name: "Tom Mitchell",
    position: "Technical Writer",
    company: "DocuTech",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    bio: "Creating clear and comprehensive technical documentation.",
    expertise: ["Technical Writing", "API Documentation", "User Guides"],
    socialLinks: {
      linkedin: "tom-mitchell-writer"
    }
  }
];
