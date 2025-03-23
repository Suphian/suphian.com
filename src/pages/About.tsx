
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ButtonCustom } from "@/components/ui/button-custom";
import { Check, ArrowRight } from "lucide-react";
import { initializeRevealAnimations } from "@/lib/animations";

const About = () => {
  useEffect(() => {
    const cleanup = initializeRevealAnimations();
    return cleanup;
  }, []);

  const skills = [
    "Figma", "SQL", "Python", "Excel", "Product Analytics", 
    "Mixpanel", "Google Analytics", "Adobe Suite", "GCP/AWS", 
    "Data Visualization", "Tableau", "Looker", "Payment Rails", 
    "ACH", "Wire", "RTP", "Fintech Compliance", "SOX", "KYC", 
    "AML", "SEO/SEM"
  ];

  return (
    <div className="pt-28 pb-24">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div className="flex flex-col space-y-6 reveal">
            <span className="tag mb-2">About Me</span>
            <h1 className="heading-xl text-balance">
              Building Products with Purpose
            </h1>
            
            <p className="paragraph">
              I'm a Senior Product Manager with expertise in AI-powered systems and innovative 
              payment solutions. My journey has taken me from growth marketing at Huge Inc. to 
              technical product management at YouTube, where I've consistently delivered products 
              that solve complex problems and drive measurable results.
            </p>
            
            <p className="paragraph">
              With a background spanning fintech, AI, and digital marketing, I bring a unique 
              perspective to product development that balances technical innovation with 
              business impact and user experience.
            </p>
            
            <div className="pt-4">
              <ButtonCustom arrowIcon>
                <Link to="/contact">Get in Touch</Link>
              </ButtonCustom>
            </div>
          </div>
          
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg reveal" style={{ transitionDelay: "150ms" }}>
            <img
              src="/headshot.jpg"
              alt="Suphian Tweel - Product Manager"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
        
        {/* Career Journey */}
        <section className="mb-20 reveal">
          <h2 className="heading-lg mb-12 text-center">My Career Journey</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <span className="text-accent text-sm font-medium mb-2 block">2018 - Present</span>
              <h3 className="heading-sm mb-3">YouTube & Google</h3>
              <p className="text-sm text-muted-foreground">
                Led product strategy and execution for AI-powered systems and payment solutions. 
                Developed innovative products that reduced errors, improved efficiency, and 
                enhanced user experiences.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <span className="text-accent text-sm font-medium mb-2 block">2016 - 2018</span>
              <h3 className="heading-sm mb-3">Fintech Startups</h3>
              <p className="text-sm text-muted-foreground">
                Advised Google Ventures portfolio companies on product strategy and go-to-market 
                planning. Helped early-stage fintech startups develop scalable payment systems 
                and compliance frameworks.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <span className="text-accent text-sm font-medium mb-2 block">2014 - 2016</span>
              <h3 className="heading-sm mb-3">Huge Inc</h3>
              <p className="text-sm text-muted-foreground">
                Started my career in growth marketing, driving digital marketing efficiency and 
                developing data-driven strategies. Achieved a 38% improvement in CPA efficiency 
                through innovative campaign optimization.
              </p>
            </div>
          </div>
        </section>
        
        {/* Skills */}
        <section className="mb-20 reveal">
          <h2 className="heading-lg mb-6 text-center">My Skills & Expertise</h2>
          <p className="paragraph text-center max-w-2xl mx-auto mb-12">
            I've developed a diverse set of technical and business skills throughout my career, 
            allowing me to bridge the gap between innovation and execution.
          </p>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {skills.map((skill) => (
              <span key={skill} className="tag bg-secondary px-3 py-1.5">
                {skill}
              </span>
            ))}
          </div>
        </section>
        
        {/* Personal Touch */}
        <section className="bg-secondary/30 p-8 md:p-12 rounded-2xl reveal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="heading-md mb-6">Beyond the Product</h2>
              <p className="paragraph mb-6">
                Outside of my professional work, I'm passionate about giving back to the community. 
                Through my non-profit work with Suph's Snacks, I've helped provide nutritious food 
                options to underserved communities.
              </p>
              <p className="paragraph">
                I also serve as an advisor to early-stage tech startups, helping them navigate 
                product development, fundraising, and growth challenges. This work is deeply 
                rewarding and informs my approach to building products with purpose.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-xl border">
              <h3 className="heading-sm mb-6">What I'm Passionate About</h3>
              <ul className="space-y-4">
                {["Leveraging AI for positive impact", "Building inclusive financial systems", "Mentoring aspiring product managers", "Creating products that solve real problems"].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1 bg-accent/20 rounded-full p-1">
                      <Check className="h-3 w-3 text-accent" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section className="text-center mt-20 reveal">
          <h2 className="heading-lg mb-6">Let's Work Together</h2>
          <p className="paragraph max-w-2xl mx-auto mb-8">
            I'm always open to discussing new projects, opportunities, or partnerships.
          </p>
          <ButtonCustom size="lg" arrowIcon>
            <Link to="/contact">Get in Touch</Link>
          </ButtonCustom>
        </section>
      </div>
    </div>
  );
};

export default About;
