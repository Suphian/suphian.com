import React from "react";
import { COUNT_OF_MONTE_CRISTO_QUOTES } from "@/utils/MonteCristoQuotes";

const chipOptions = [
  {
    label: "Referral request",
    text: "I'd love a referral for your team – here’s a bit about me…"
  },
  {
    label: "Job opportunity",
    text: "We have a PM opening that seems aligned with your background. Are you open to chat?"
  },
  {
    label: "Tech chat",
    text: "I saw your talk on payments infrastructure and would like to exchange ideas on data modeling."
  }
];

interface ContactChipsBarProps {
  textareaId: string;
}

const ContactChipsBar: React.FC<ContactChipsBarProps> = ({ textareaId }) => {
  // Use event delegation but scoped to this component's div
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("chip")) return;
    const ta = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!ta) return;

    if (target.textContent === "Random") {
      // Pick a random quote
      const idx = Math.floor(Math.random() * COUNT_OF_MONTE_CRISTO_QUOTES.length);
      const quote = COUNT_OF_MONTE_CRISTO_QUOTES[idx];
      // Simulate a random page number from 1–600
      const page = Math.floor(Math.random() * 600) + 1;
      const authorLine = "Alexandre Dumas, Count of Monte Cristo";
      ta.value = `"${quote}"\n— ${authorLine}, page ${page}`;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const fillText = target.getAttribute("data-text");
      if (fillText) {
        ta.value = fillText;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    ta.focus();
  };

  return (
    <div id="chipBar" className="chips mt-2" onClick={handleClick}>
      {chipOptions.map(opt => (
        <span
          className="chip"
          data-text={opt.text}
          key={opt.label}
          tabIndex={0}
          role="button"
        >
          {opt.label}
        </span>
      ))}
      <span className="chip" tabIndex={0} role="button">Random</span>
    </div>
  );
};

export default ContactChipsBar;
