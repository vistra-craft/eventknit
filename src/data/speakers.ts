export interface Speaker {
  id: number;
  name: string;
  position: string;
  company: string;
  country?: string;
  avatar: string;
  bio: string;
  expertise: string[];
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  detailedBio?: string;
  jobFunction?: string;
  interests?: string[];
  businessAge?: string;
  purchasingRole?: string;
  companySize?: string;
  contactDetails?: {
    website?: string;
    email?: string;
    phone?: string;
  };
  speakingAt?: {
    session: string;
    date: string;
    time: string;
    stage: string;
    panelists: string[];
  }[];
}

export const speakers: Speaker[] = [
  {
    id: 1,
    name: "Joyce Mwangi",
    position: "Head, Customer Experience",
    company: "Family Bank Kenya",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    bio: "Leading digital transformation initiatives across enterprise organizations.",
    expertise: ["AI/ML", "Cloud Computing", "Digital Strategy"],
    socialLinks: {
      twitter: "@joycemwangi",
      linkedin: "joyce-mwangi-cx"
    },
    detailedBio: "Joyce Mwangi is a seasoned professional with a proven track record in enhancing customer experiences in the banking sector. As the Head of Customer Experience at Family Bank Kenya, Joyce is at the forefront of driving innovation and digital transformation to meet the evolving needs of customers in the digital commerce landscape. With a deep understanding of customer behavior and market trends, Joyce is dedicated to creating seamless and personalized experiences that drive customer loyalty and satisfaction.\n\nWith over a decade of experience in the financial services industry, Joyce has a strong background in developing and implementing customer-centric strategies that drive business growth. Her expertise lies in leveraging technology and data analytics to design and optimize customer journeys, ensuring a frictionless and engaging experience across all touchpoints.\n\nJoyce is a visionary leader who is passionate about driving change and fostering a customer-centric culture within organizations. She is a dynamic speaker who brings a wealth of knowledge and insights to the table, making her a sought-after expert in the field of customer experience and digital commerce.\n\nAt Seamless East Africa 2025, Joyce Mwangi will share her expertise and insights on the future of digital commerce, providing valuable perspectives on how businesses can adapt and thrive in an increasingly digital world. Attendees can expect to gain practical strategies and actionable insights from Joyce's session, helping them stay ahead of the curve and drive success in the digital commerce landscape.",
    jobFunction: "Policy and Regulation",
    interests: ["I want to source solutions"],
    businessAge: "Less than 5 years",
    purchasingRole: "I am the decision maker",
    companySize: "5001-10,000",
    contactDetails: {
      website: "https://familybank.co.ke/"
    },
    speakingAt: [{
      session: "PANEL Measuring CX across an ever-evolving industry: building better models and defining a unified framework",
      date: "Wednesday, July 2, 2025",
      time: "2:00 PM to 2:40 PM",
      stage: "STAGE 3: FINTECH",
      panelists: [
        "Kevin Mutiso · The Digital Financial Services Association of Kenya",
        "Janet Dali · Diamond Trust Bank",
        "Christine Onyango · Kenya Bankers Association",
        "Jerry Shikhule · MobiFin Inc",
        "Joyce Mwangi · Family Bank Kenya"
      ]
    }]
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
    },
    detailedBio: "Michael Chen is a seasoned software engineer with over 8 years of experience in building scalable systems and microservices architecture. At InnovateLab, he leads the backend development team and is responsible for designing robust, high-performance systems that serve millions of users.\n\nMichael specializes in cloud-native applications, containerization, and distributed systems. He has extensive experience with modern technologies including Kubernetes, Docker, and various cloud platforms. His expertise in system design and performance optimization has helped numerous startups scale their infrastructure efficiently.\n\nHe is passionate about mentoring junior developers and sharing knowledge through technical talks and workshops. Michael holds a Master's degree in Computer Science and is a certified AWS Solutions Architect.",
    jobFunction: "Technology",
    interests: ["I want to source solutions", "I want to learn about new technologies"],
    businessAge: "5-10 years",
    purchasingRole: "I influence purchasing decisions",
    companySize: "1001-5000",
    contactDetails: {
      website: "https://innovatelab.com",
      email: "michael.chen@innovatelab.com"
    },
    speakingAt: [{
      session: "Building Scalable Microservices Architecture",
      date: "Thursday, July 3, 2025",
      time: "10:00 AM to 10:45 AM",
      stage: "STAGE 1: TECHNOLOGY",
      panelists: [
        "Michael Chen · InnovateLab"
      ]
    }]
  },
  {
    id: 3,
    name: "Karanja Ndegwa",
    position: "Chief Executive Officer",
    company: "Jambojet",
    country: "South Africa",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    bio: "Dynamic CEO leading Kenya's leading low-cost airline with strategic vision and innovative approach.",
    expertise: ["Aviation", "Digital Transformation", "Strategic Leadership"],
    socialLinks: {
      linkedin: "karanja-ndegwa-ceo"
    },
    detailedBio: "Karanja Ndegwa is a dynamic and results-driven Chief Executive Officer with a proven track record of success in the aviation industry. Currently at the helm of Jambojet, Kenya's leading low-cost airline, Karanja is a visionary leader known for his strategic thinking and innovative approach to business.\n\nWith over 15 years of experience in the aviation sector, Karanja has a deep understanding of the complexities and challenges of the industry. Under his leadership, Jambojet has experienced significant growth and expansion, solidifying its position as a key player in the East African market.\n\nKaranja is passionate about leveraging technology to drive digital transformation and enhance the customer experience. He is a forward-thinker who is constantly exploring new ways to innovate and stay ahead of the curve in the rapidly evolving digital commerce landscape.\n\nAs a speaker at Seamless East Africa 2025, Karanja will share his insights and expertise on the future of digital commerce in the region. Attendees can expect to gain valuable knowledge and practical strategies for navigating the digital landscape, driving growth, and staying competitive in an increasingly digital world.\n\nKaranja's engaging speaking style and deep industry knowledge make him a sought-after speaker at conferences and events. His unique perspective and strategic vision make him a valuable asset to any organization looking to thrive in the digital age.",
    jobFunction: "Executive Leadership",
    interests: ["Digital transformation", "Customer experience", "Strategic planning"],
    businessAge: "10+ years",
    purchasingRole: "I am the decision maker",
    companySize: "1001-5000",
    contactDetails: {
      website: "https://jambojet.com"
    },
    speakingAt: [
      {
        session: "FIRESIDE CHAT Perfecting the all-in-one hub from front to back: enhancing customer experience and operational efficiency across African channels",
        date: "Wednesday, July 2, 2025",
        time: "3:20 PM to 3:50 PM",
        stage: "STAGE 2: DIGITAL COMMERCE",
        panelists: [
          "Joseph Thuku · Quickmart Supermarkets",
          "Alastair Tempest · Ecommerce Forum Africa",
          "Abdi Mohamed · Absa Bank Kenya",
          "Arthur Ondago · L'Oreal East Africa",
          "Nicole Harris · Walmart Africa"
        ]
      },
      {
        session: "INTERVIEW Cross border trade and enterprise in a formalized Kenya: capitalizing on new productive opportunities",
        date: "Thursday, July 3, 2025",
        time: "2:50 PM to 3:10 PM",
        stage: "STAGE 2: DIGITAL COMMERCE",
        panelists: [
          "Micah Wanyama Wanyama · The Coca-Cola Company",
          "Grace Nshemeire-Gwaku · Private Sector Foundation Uganda (PSFU)",
          "Edgar Mkalla · ICGLR",
          "Karanja Ndegwa · Jambojet"
        ]
      }
    ]
  },
  {
    id: 4,
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
