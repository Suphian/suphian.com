
export interface Project {
  id: string;
  title: string;
  description: string;
  challenge: string;
  role: string;
  approach: string;
  outcome: string;
  image: string;
  category: string;
  stats: string;
}

export const projects: Project[] = [
  {
    id: "ai-powered-deal-enablement",
    title: "AI-Powered Deal Enablement System",
    description: "Led the vision, strategy, and execution for an innovative LLM-based deal enablement system that transformed how sales teams analyze contracts and close deals.",
    challenge: "Sales teams were spending excessive time analyzing complex contracts, leading to delays in closing deals and increased operational costs. Manual review processes were prone to errors and inconsistency.",
    role: "Led vision, strategy, and execution for an LLM-based deal enablement system. Managed cross-functional teams, prioritized features, and coordinated with stakeholders across sales, legal, and engineering.",
    approach: "Implemented advanced LLMs for contract analysis, integrating with existing workflow tools. Developed machine learning models for purchase propensity prediction, enabling proactive deal management. Created a user-friendly interface that highlighted key contract elements and potential risks.",
    outcome: "Reduced contract review errors by 20%, saving millions in potential liability. Accelerated time-to-payment by 3x, significantly improving cash flow. Saved 1,500+ operational hours annually, allowing sales teams to focus on relationship building rather than paperwork.",
    image: "/project1.jpg",
    category: "AI & Machine Learning",
    stats: "20% reduction in errors • 3x faster payments • 1,500+ hours saved"
  },
  {
    id: "payment-modernization",
    title: "Payment Rails Modernization",
    description: "Transformed an outdated payment processing system through a comprehensive modernization initiative that improved efficiency, reduced errors, and enhanced the payment experience.",
    challenge: "Legacy payment systems were causing delays, errors, and customer frustration. Manual reconciliation processes were resource-intensive and prone to mistakes.",
    role: "Spearheaded the payment modernization initiative, leading product strategy and implementation. Coordinated with finance, compliance, and engineering teams to ensure smooth transition.",
    approach: "Redesigned payment architecture to support modern payment rails including ACH, Wire, and RTP. Implemented automated reconciliation systems with built-in compliance checks for KYC and AML. Created a flexible API-first approach to enable future payment method integration.",
    outcome: "Reduced payment errors by 52% through intelligent validation. Lowered operational costs by 35% by eliminating manual processes. Improved customer satisfaction scores by 28% with faster payment processing and better transparency.",
    image: "/project2.jpg",
    category: "Fintech & Payments",
    stats: "52% fewer errors • 35% cost reduction • 28% higher satisfaction"
  },
  {
    id: "digital-marketing-optimization",
    title: "AI-Driven Marketing Optimization Platform",
    description: "Developed a sophisticated marketing platform that leveraged AI to optimize campaign performance, targeting, and budget allocation across multiple channels.",
    challenge: "Marketing teams were struggling to efficiently allocate budgets across channels and campaigns, resulting in suboptimal ROI and missed opportunities.",
    role: "Led product development for the marketing optimization platform, working closely with data scientists and marketing teams to define requirements and success metrics.",
    approach: "Created predictive models to forecast campaign performance and recommend budget allocations. Implemented A/B testing frameworks with automatic optimization. Designed intuitive dashboards that provided actionable insights and clear ROI visualization.",
    outcome: "Drove a 38% improvement in digital marketing CPA efficiency. Increased conversion rates by 25% through better targeting and messaging. Enabled marketing teams to manage 3x more campaigns without additional headcount.",
    image: "/project3.jpg",
    category: "Marketing Technology",
    stats: "38% CPA improvement • 25% higher conversions • 3x campaign capacity"
  }
];

export const getProjectById = (id: string): Project | undefined => {
  return projects.find((project) => project.id === id);
};
