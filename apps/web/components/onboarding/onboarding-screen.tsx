"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { CampusGramLogo } from "../layout/logo";
import { CampusInfoVisual, ComplaintsVisual, LostFoundVisual } from "./onboarding-visuals";
import { setOnboardingCompleted } from "../../lib/auth/client-session";
import { cn } from "@smart-campus/utils";

interface Step {
  id: number;
  tag: string;
  title: string;
  description: string;
  visual: React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: 1,
    tag: "Campus Life & Updates",
    title: "Campus information",
    description: "Everything happening on campus, in one place.",
    visual: <CampusInfoVisual />,
  },
  {
    id: 2,
    tag: "Smart Grievance Tracking",
    title: "Campus complaints",
    description: "Report campus issues and track them from submission to resolution.",
    visual: <ComplaintsVisual />,
  },
  {
    id: 3,
    tag: "Multimodal AI Matching",
    title: "Lost & Found",
    description: "Lost something? Found something? CampusGram helps connect it to the right person.",
    visual: <LostFoundVisual />,
  },
];

export function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleFinish = () => {
    setOnboardingCompleted(true);
    router.push("/login");
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Bar */}
      <header className="flex items-center justify-between max-w-xl w-full mx-auto">
        <CampusGramLogo size="md" />
        <button
          onClick={handleFinish}
          className="text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-1.5 rounded-lg border border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/50"
          aria-label="Skip onboarding"
        >
          Skip
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl w-full mx-auto my-auto flex flex-col items-center text-center space-y-8 py-8">
        {/* Visual Element with subtle fade */}
        <div className="w-full transition-all duration-300 transform scale-100">
          {step.visual}
        </div>

        {/* Text Section */}
        <div className="space-y-3 max-w-md">
          <span className="text-xs font-semibold tracking-wider uppercase text-blue-400 bg-blue-950/60 border border-blue-900/50 px-3 py-1 rounded-full">
            {step.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {step.title}
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            {step.description}
          </p>
        </div>
      </main>

      {/* Bottom Bar: Progress Indicator & Navigation Button */}
      <footer className="max-w-xl w-full mx-auto flex items-center justify-between pt-6 border-t border-zinc-900">
        {/* Back button or placeholder */}
        <div className="w-12">
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              className="p-3 rounded-full border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              aria-label="Previous step"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-2" aria-label={`Step ${currentStep + 1} of ${STEPS.length}`}>
          {STEPS.map((s, index) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentStep
                  ? "w-7 bg-blue-500 shadow-sm shadow-blue-500/50"
                  : "w-2 bg-zinc-800 hover:bg-zinc-700"
              )}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Prominent Circular/Rounded Arrow Button */}
        <div className="w-12 flex justify-end">
          <button
            onClick={handleNext}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label={currentStep === STEPS.length - 1 ? "Complete onboarding and go to login" : "Next step"}
          >
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </footer>
    </div>
  );
}
