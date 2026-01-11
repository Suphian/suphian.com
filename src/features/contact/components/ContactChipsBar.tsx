
import React from "react";
import { COUNT_OF_MONTE_CRISTO_QUOTES, chipOptions } from "@/features/contact/utils/contactFormConstants";

interface ContactChipsBarProps {
  textareaId: string;
  onChange?: (value: string) => void;
  value?: string;
}

const ContactChipsBar: React.FC<ContactChipsBarProps> = ({ textareaId, onChange, value: _value }) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("chip")) return;

    let newValue: string | undefined;
    if (target.textContent === "Random") {
      const idx = Math.floor(Math.random() * COUNT_OF_MONTE_CRISTO_QUOTES.length);
      const quote = COUNT_OF_MONTE_CRISTO_QUOTES[idx];
      const authorLine = "Alexandre Dumas, Count of Monte Cristo";
      newValue = `"${quote}"\n— ${authorLine}`;
    } else {
      newValue = target.getAttribute("data-text") || "";
    }

    // Always use onChange if provided (this is the React Hook Form way)
    if (onChange && typeof newValue === "string") {
      onChange(newValue);
    } else {
      // Fallback to direct DOM manipulation if onChange not provided
      const ta = document.getElementById(textareaId) as HTMLTextAreaElement | null;
      if (ta && typeof newValue === "string") {
        ta.value = newValue;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.focus();
      }
    }
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
