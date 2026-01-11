
import { forwardRef, memo } from "react";
import ActionButtons from "./ActionButtons";

interface AboutSectionProps {
  onRequestCV: () => void;
}

const AboutSection = memo(forwardRef<HTMLDivElement, AboutSectionProps>(
  ({ onRequestCV }, ref) => {
    const bioContent = [
      "I grew up between cultures — the kind of upbringing that teaches you to listen deeply, challenge assumptions, and speak multiple languages (including internet). I've spent my career working with founders, builders and private equity who want to do more than just ship — they want to shake things up.",
      "I think data science and AI aren't just the future — they're the foundation. I'm wired for first principles, allergic to fluff, and always looking for people who are smart, egoless, and unafraid to be wrong.",
      "My work spans e-commerce, consumer apps, and internal tools — often the kinds of products that challenge business-as-usual and deliver a smarter, more human way of doing things. What ties it all together is a singular goal: helping ambitious teams think bigger.",
      "Technology is going to remake everything — faster than most are ready for. But with the right mindset and a bias for clarity, we can build a future that's big enough for everyone."
    ];

    return (
      <section id="about-section" ref={ref} className="mb-32 md:mb-40 py-12">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            {/* Editorial heading */}
            <h2 className="heading-lg mb-16 text-white" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              STORY
            </h2>
            
            {/* Editorial text blocks */}
            <div className="space-y-8 md:space-y-12">
              {bioContent.map((content, index) => (
                <p 
                  key={index}
                  className="paragraph text-lg md:text-xl leading-relaxed"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.85)',
                    maxWidth: '100%'
                  }}
                >
                  {content}
                </p>
              ))}
            </div>

            {/* Action buttons - minimal, at the end */}
            <div className="mt-16 pt-8 border-t border-white/10">
              <ActionButtons onRequestCV={onRequestCV} />
            </div>
          </div>
        </div>
      </section>
    );
  }
));

AboutSection.displayName = "AboutSection";

export default AboutSection;
