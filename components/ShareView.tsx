"use client";

import { useState } from "react";
import { AnalysisResult, Persona } from "@/types/analysis";
import ResultsDashboard from "@/components/ResultsDashboard";
import CopyPromptButton from "@/components/CopyPromptButton";

export default function ShareView({ result, problem }: { result: AnalysisResult; problem: string }) {
  const [selectedPersona, setSelectedPersona] = useState<Persona>("exec");

  return (
    <>
      <div className="flex justify-end mb-4">
        <CopyPromptButton result={result} problem={problem} />
      </div>
      <ResultsDashboard
        result={result}
        selectedPersona={selectedPersona}
        onPersonaChange={setSelectedPersona}
        challengesExpected={0}
      />
    </>
  );
}
