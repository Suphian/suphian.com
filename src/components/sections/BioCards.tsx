
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const BioCards = () => {
  const bioContent = [
    "I grew up between cultures — the kind of upbringing that teaches you to listen deeply, challenge assumptions, and speak multiple languages (including internet). I've spent my career working with founders and private equity who want to do more than just ship — they want to shake things up.",
    "I think data science and AI aren't just the future — they're the foundation. I'm wired for first principles, allergic to fluff, and always looking for people who are smart, egoless, and unafraid to be wrong.",
    "My work spans e-commerce, consumer apps, and internal tools — often the kinds of products that challenge business-as-usual and deliver a smarter, more human way of doing things. What ties it all together is a singular goal: helping ambitious teams think bigger.",
    "Technology is going to remake everything — faster than most are ready for. But with the right mindset and a bias for clarity, we can build a future that's big enough for everyone."
  ];

  return (
    <div className="space-y-1">
      {bioContent.map((content, index) => (
        <Card key={index} className="bg-background border-0 overflow-hidden relative">
          <CardContent className="p-4 sm:p-5">
            <p className="paragraph">{content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BioCards;
