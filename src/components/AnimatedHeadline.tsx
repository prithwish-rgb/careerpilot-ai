"use client";

import { useEffect, useState } from "react";

const phrases = [
  "ATS-optimized resume scoring",
  "Job match analysis in seconds",
  "Track every application",
  "Career progress insights",
];

export function AnimatedHeadline() {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % phrases.length);
        setShow(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-8 overflow-hidden">
      <div className={`transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
        <span className="bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] bg-clip-text text-transparent font-semibold">
          {phrases[index]}
        </span>
      </div>
    </div>
  );
}


