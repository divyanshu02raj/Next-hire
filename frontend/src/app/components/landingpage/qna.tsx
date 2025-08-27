// frontend\src\app\components\landingpage\qna.tsx
"use client";

import { useState } from "react";

type QnaProps = {
    question: string;
    answer: string;
}

export default function Qna({question, answer}: QnaProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col text-left items-left gap-4 tracking-tight">
      <div className="flex flex-row items-center gap-4">
        <div className="text-neutral-600 text-xl">{question}</div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-primary text-3xl focus:outline-none"
        >
          {isOpen ? "-" : "+"}
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-500 ${
          isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        } text-neutral-400 text-l`}
      >
       {answer}
      </div>
    </div>
  );
}
