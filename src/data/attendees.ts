export interface Attendee {
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
  isVisible?: boolean;
  networkingGoals?: string[];
  lookingFor?: string[];
}

export const attendees: Attendee[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    position: "Marketing Manager",
    company: "TechCorp Africa",
    country: "Kenya",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    bio: "Passionate about digital marketing and brand strategy in the African market.",
    expertise: ["Digital Marketing", "Brand Strategy", "Social Media"],
    socialLinks: {
      twitter: "@sarahjohnson",
      linkedin: "sarah-johnson-marketing",
      instagram: "@sarahjohnson",
      facebook: "sarah.johnson.marketing"
    },
    detailedBio: "Sarah Johnson is a dynamic marketing professional with over 8 years of experience in digital marketing and brand strategy. Currently serving as Marketing Manager at TechCorp Africa, Sarah has been instrumental in driving brand awareness and customer engagement across multiple African markets.\n\nHer expertise spans across digital marketing, social media strategy, content creation, and brand development. Sarah is passionate about leveraging technology to create meaningful connections between brands and their audiences in the rapidly evolving digital landscape.\n\nAt Seamless East Africa 2025, Sarah is looking forward to networking with fellow marketing professionals, learning about the latest trends in digital commerce, and exploring potential partnerships and collaborations.",
    jobFunction: "Marketing",
    interests: ["Digital transformation", "Customer engagement", "Brand development"],
    businessAge: "5-10 years",
    purchasingRole: "I influence purchasing decisions",
    companySize: "1001-5000",
    contactDetails: {
      website: "https://techcorpafrica.com",
      email: "sarah.johnson@techcorpafrica.com"
    },
    isVisible: true,
    networkingGoals: ["Find potential clients", "Learn about new technologies", "Share marketing insights"],
    lookingFor: ["Partnership opportunities", "Technology solutions", "Industry insights"]
  },
  {
    id: 2,
    name: "Ahmed Hassan",
    position: "Business Development Director",
    company: "FinTech Solutions",
    country: "Egypt",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    bio: "Driving fintech innovation and financial inclusion across East Africa.",
    expertise: ["FinTech", "Business Development", "Financial Services"],
    socialLinks: {
      linkedin: "ahmed-hassan-fintech",
      twitter: "@ahmedhassan",
      website: "https://ahmedhassan.dev"
    },
    detailedBio: "Ahmed Hassan is a seasoned business development professional with a strong focus on fintech innovation and financial inclusion. As Business Development Director at FinTech Solutions, Ahmed has been at the forefront of developing and implementing financial technology solutions that serve underserved communities across East Africa.\n\nWith over 10 years of experience in the financial services sector, Ahmed brings a unique perspective on how technology can be leveraged to drive financial inclusion and economic growth. His expertise includes business strategy, partnership development, and market expansion.\n\nAhmed is passionate about creating sustainable business models that benefit both companies and communities. He is always looking for opportunities to collaborate with like-minded professionals and organizations that share his vision of using technology for social good.",
    jobFunction: "Business Development",
    interests: ["Financial inclusion", "Technology innovation", "Market expansion"],
    businessAge: "10+ years",
    purchasingRole: "I am the decision maker",
    companySize: "501-1000",
    contactDetails: {
      website: "https://fintechsolutions.com",
      email: "ahmed.hassan@fintechsolutions.com"
    },
    isVisible: true,
    networkingGoals: ["Find strategic partners", "Explore new markets", "Share industry knowledge"],
    lookingFor: ["Partnership opportunities", "Technology solutions", "Market insights"]
  },
  {
    id: 3,
    name: "Grace Mwangi",
    position: "Product Designer",
    company: "DesignHub",
    country: "Kenya",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    bio: "Creating user-centered designs that solve real-world problems.",
    expertise: ["UI/UX Design", "Product Design", "User Research"],
    socialLinks: {
      twitter: "@gracemwangi",
      linkedin: "grace-mwangi-design"
    },
    detailedBio: "Grace Mwangi is a creative and innovative product designer with a passion for creating user-centered designs that solve real-world problems. At DesignHub, Grace leads the design team and is responsible for creating intuitive and engaging user experiences across various digital platforms.\n\nHer expertise spans across UI/UX design, user research, prototyping, and design systems. Grace is particularly interested in designing solutions for the African market, understanding the unique needs and challenges of users in this region.\n\nGrace is always eager to learn about new design trends and technologies, and she enjoys collaborating with developers, product managers, and other stakeholders to create products that truly make a difference.",
    jobFunction: "Design",
    interests: ["User experience", "Design systems", "Product innovation"],
    businessAge: "3-5 years",
    purchasingRole: "I influence purchasing decisions",
    companySize: "51-200",
    contactDetails: {
      website: "https://designhub.co.ke",
      email: "grace.mwangi@designhub.co.ke"
    },
    isVisible: true,
    networkingGoals: ["Connect with developers", "Learn about new tools", "Share design insights"],
    lookingFor: ["Design tools", "Collaboration opportunities", "Industry trends"]
  },
  {
    id: 4,
    name: "David Ochieng",
    position: "Software Engineer",
    company: "InnovateTech",
    country: "Kenya",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    bio: "Building scalable software solutions for African businesses.",
    expertise: ["Backend Development", "Cloud Computing", "System Architecture"],
    socialLinks: {
      linkedin: "david-ochieng-dev"
    },
    detailedBio: "David Ochieng is a passionate software engineer with a focus on building scalable and robust software solutions for African businesses. At InnovateTech, David works on developing backend systems and cloud infrastructure that support the growing digital economy in East Africa.\n\nHis technical expertise includes backend development, cloud computing, system architecture, and database design. David is particularly interested in solving complex technical challenges and creating solutions that can scale to serve millions of users.\n\nDavid is always looking for opportunities to learn about new technologies and best practices in software development. He enjoys mentoring junior developers and sharing his knowledge with the tech community.",
    jobFunction: "Technology",
    interests: ["System scalability", "Cloud computing", "Software architecture"],
    businessAge: "5-10 years",
    purchasingRole: "I influence purchasing decisions",
    companySize: "201-500",
    contactDetails: {
      website: "https://innovatetech.co.ke",
      email: "david.ochieng@innovatetech.co.ke"
    },
    isVisible: true,
    networkingGoals: ["Learn new technologies", "Find collaboration opportunities", "Share technical knowledge"],
    lookingFor: ["Technology solutions", "Development tools", "Technical partnerships"]
  },
  {
    id: 5,
    name: "Fatima Al-Zahra",
    position: "Operations Manager",
    company: "LogiFlow",
    country: "Tanzania",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    bio: "Optimizing logistics and supply chain operations across East Africa.",
    expertise: ["Operations Management", "Supply Chain", "Process Optimization"],
    socialLinks: {
      linkedin: "fatima-alzahra-ops"
    },
    detailedBio: "Fatima Al-Zahra is an experienced operations manager with a strong background in logistics and supply chain management. At LogiFlow, Fatima is responsible for optimizing operations and ensuring efficient delivery of services across East Africa.\n\nHer expertise includes operations management, supply chain optimization, process improvement, and team leadership. Fatima is passionate about using technology and data analytics to improve operational efficiency and customer satisfaction.\n\nFatima is always looking for ways to improve processes and implement best practices in operations management. She enjoys collaborating with cross-functional teams and sharing her knowledge about operational excellence.",
    jobFunction: "Operations",
    interests: ["Process optimization", "Supply chain management", "Operational excellence"],
    businessAge: "8-12 years",
    purchasingRole: "I influence purchasing decisions",
    companySize: "501-1000",
    contactDetails: {
      website: "https://logiflow.co.tz",
      email: "fatima.alzahra@logiflow.co.tz"
    },
    isVisible: true,
    networkingGoals: ["Learn best practices", "Find technology solutions", "Share operational insights"],
    lookingFor: ["Operations tools", "Technology solutions", "Industry best practices"]
  },
  {
    id: 6,
    name: "John Mutua",
    position: "Sales Director",
    company: "Growth Partners",
    country: "Kenya",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    bio: "Driving sales growth and building strategic partnerships.",
    expertise: ["Sales Strategy", "Partnership Development", "Business Growth"],
    socialLinks: {
      linkedin: "john-mutua-sales"
    },
    detailedBio: "John Mutua is a results-driven sales professional with over 12 years of experience in driving sales growth and building strategic partnerships. As Sales Director at Growth Partners, John has been instrumental in expanding the company's market presence and developing key client relationships.\n\nHis expertise includes sales strategy, partnership development, business growth, and team leadership. John is passionate about understanding customer needs and creating value-driven solutions that drive business success.\n\nJohn is always looking for opportunities to connect with potential clients and partners. He enjoys sharing his sales insights and learning about new approaches to business development and customer relationship management.",
    jobFunction: "Sales",
    interests: ["Business growth", "Partnership development", "Customer relationship management"],
    businessAge: "10+ years",
    purchasingRole: "I am the decision maker",
    companySize: "1001-5000",
    contactDetails: {
      website: "https://growthpartners.co.ke",
      email: "john.mutua@growthpartners.co.ke"
    },
    isVisible: true,
    networkingGoals: ["Find potential clients", "Build partnerships", "Share sales insights"],
    lookingFor: ["Business opportunities", "Partnership prospects", "Sales tools"]
  },
  {
    id: 7,
    name: "Aisha Mohamed",
    position: "Data Analyst",
    company: "Analytics Pro",
    country: "Uganda",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    bio: "Transforming data into actionable business insights.",
    expertise: ["Data Analysis", "Business Intelligence", "Data Visualization"],
    socialLinks: {
      linkedin: "aisha-mohamed-analytics"
    },
    detailedBio: "Aisha Mohamed is a skilled data analyst with a passion for transforming raw data into actionable business insights. At Analytics Pro, Aisha works with various clients to help them make data-driven decisions and improve their business performance.\n\nHer expertise includes data analysis, business intelligence, data visualization, and statistical modeling. Aisha is particularly interested in using data to solve business problems and drive innovation in the African market.\n\nAisha is always eager to learn about new data analysis tools and techniques. She enjoys collaborating with business stakeholders and sharing her knowledge about data-driven decision making.",
    jobFunction: "Analytics",
    interests: ["Data visualization", "Business intelligence", "Statistical modeling"],
    businessAge: "4-6 years",
    purchasingRole: "I influence purchasing decisions",
    companySize: "51-200",
    contactDetails: {
      website: "https://analyticspro.ug",
      email: "aisha.mohamed@analyticspro.ug"
    },
    isVisible: true,
    networkingGoals: ["Learn new tools", "Find collaboration opportunities", "Share analytics insights"],
    lookingFor: ["Analytics tools", "Data sources", "Collaboration opportunities"]
  },
  {
    id: 8,
    name: "Peter Kimani",
    position: "Customer Success Manager",
    company: "SaaS Solutions",
    country: "Kenya",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
    bio: "Ensuring customer satisfaction and driving product adoption.",
    expertise: ["Customer Success", "Product Adoption", "Customer Experience"],
    socialLinks: {
      linkedin: "peter-kimani-cs"
    },
    detailedBio: "Peter Kimani is a dedicated customer success manager with a focus on ensuring customer satisfaction and driving product adoption. At SaaS Solutions, Peter works closely with customers to help them achieve their goals and maximize the value they get from the company's products.\n\nHis expertise includes customer success management, product adoption, customer experience, and relationship building. Peter is passionate about understanding customer needs and creating solutions that help them succeed.\n\nPeter is always looking for ways to improve customer satisfaction and retention. He enjoys sharing his knowledge about customer success best practices and learning about new approaches to customer relationship management.",
    jobFunction: "Customer Success",
    interests: ["Customer experience", "Product adoption", "Customer retention"],
    businessAge: "6-8 years",
    purchasingRole: "I influence purchasing decisions",
    companySize: "201-500",
    contactDetails: {
      website: "https://saassolutions.co.ke",
      email: "peter.kimani@saassolutions.co.ke"
    },
    isVisible: true,
    networkingGoals: ["Learn best practices", "Share customer insights", "Find collaboration opportunities"],
    lookingFor: ["Customer success tools", "Best practices", "Industry insights"]
  }
];
