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
    tag: "Campus Information",
    title: "Everything happening on campus, in one place.",
    description: "Official notices, circulars, department announcements, and class communications delivered without noise.",
    visual: <CampusInfoVisual />,
  },
  {
    id: 2,
    tag: "Campus Complaints",
    title: "Report issues and track them to resolution.",
    description: "Submit infrastructure and academic grievances. Track status changes in real time until resolved.",
    visual: <ComplaintsVisual />,
  },
  {
    id: 3,
    tag: "Lost & Found",
    title: "Lost something? Found something?",
    description: "CampusGram matches reported items with verified belongings in security custody for safe handover.",
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
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <CampusGramLogo size="md" />
        <button
          type="button"
          onClick={handleFinish}
          className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800"
          aria-label="Skip onboarding"
        >
          Skip
        </button>
      </header>

      {/* Main Slide Content */}
      <main className="max-w-md w-full mx-auto my-auto flex flex-col items-center text-center space-y-6 py-6">
        {/* Product Visual */}
        <div className="w-full">
          {step.visual}
        </div>

        {/* Text Section with editorial typography */}
        <div className="space-y-2 max-w-sm mx-auto">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
            {step.tag}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight leading-snug">
            {step.title}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed pt-1">
            {step.description}
          </p>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="max-w-md w-full mx-auto flex items-center justify-between pt-6 border-t border-zinc-900">
        {/* Back Button */}
        <div className="w-10">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
              aria-label="Previous step"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8" />
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-1.5" aria-label={`Step ${currentStep + 1} of ${STEPS.length}`}>
          {STEPS.map((s, index) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "h-1 rounded-full transition-all duration-200",
                index === currentStep
                  ? "w-5 bg-zinc-200"
                  : "w-1.5 bg-zinc-800 hover:bg-zinc-700"
              )}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <div className="w-10 flex justify-end">
          <button
            type="button"
            onClick={handleNext}
            className="w-9 h-9 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 flex items-center justify-center transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
            aria-label={currentStep === STEPS.length - 1 ? "Complete onboarding and continue to login" : "Next step"}
          >
            <ArrowRight className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </footer>
    </div>
  );
}
