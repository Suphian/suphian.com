
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ButtonCustom } from "./ui/button-custom";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elements = [
      headingRef.current,
      paragraphRef.current,
      buttonsRef.current,
      imageRef.current,
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    elements.forEach((el) => {
      if (el) {
        el.classList.add("reveal");
        observer.observe(el);
      }
    });

    return () => {
      elements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col space-y-6">
            <div ref={headingRef} style={{ transitionDelay: "0ms" }}>
              <span className="tag mb-4">Product Manager • AI & Payments</span>
              <h1 className="heading-xl text-balance">
                Building the Future of Payments with AI
              </h1>
            </div>

            <p
              ref={paragraphRef}
              className="paragraph max-w-lg"
              style={{ transitionDelay: "150ms" }}
            >
              I'm a Product Manager specializing in AI-powered systems and payment solutions, 
              with experience at YouTube, Google, and leading fintech initiatives. I transform 
              complex challenges into elegant, effective products.
            </p>

            <div
              ref={buttonsRef}
              className="flex flex-wrap gap-4 pt-2"
              style={{ transitionDelay: "300ms" }}
            >
              <ButtonCustom size="lg" arrowIcon>
                <Link to="/projects">View My Projects</Link>
              </ButtonCustom>
              <ButtonCustom variant="outline" size="lg">
                <Link to="/contact">Contact Me</Link>
              </ButtonCustom>
            </div>
          </div>

          <div
            ref={imageRef}
            className="relative order-first md:order-last aspect-[4/5] md:aspect-square rounded-2xl overflow-hidden shadow-lg"
            style={{ transitionDelay: "450ms" }}
          >
            <img
              src="/headshot.jpg"
              alt="Suphian Tweel - Product Manager"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
