'use client';

const STEPS = [
  { id: 1, label: 'Projekt', icon: '📋' },
  { id: 2, label: 'Strategie', icon: '🧠' },
  { id: 3, label: 'Bilder', icon: '🎨' },
  { id: 4, label: 'Texte', icon: '✍️' },
  { id: 5, label: 'Voice', icon: '🎤' },
  { id: 6, label: 'Videos', icon: '🎬' },
  { id: 7, label: 'Editor', icon: '✂️' },
  { id: 8, label: 'Export', icon: '📤' },
];

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: number[];
}

export default function Stepper({ currentStep, onStepClick, completedSteps }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap py-4 px-2">
      {STEPS.map((step, i) => {
        const isActive = step.id === currentStep;
        const isDone = completedSteps.includes(step.id);
        const isReachable = step.id <= Math.max(...completedSteps, 1) + 1;
        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isReachable && onStepClick(step.id)}
              disabled={!isReachable}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all
                ${isActive ? 'bg-[#7c3aed] text-white shadow-lg shadow-purple-900/40 scale-105 animate-pulse' : ''}
                ${isDone && !isActive ? 'bg-green-900/40 text-green-300 border border-green-700/50 cursor-pointer hover:bg-green-900/60' : ''}
                ${!isActive && !isDone ? 'bg-[#1a1a2e] text-[#94a3b8] border border-[#2d2d44]' : ''}
                ${isReachable && !isActive ? 'cursor-pointer hover:border-purple-500' : ''}
                ${!isReachable ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              <span>{isDone && !isActive ? '✓' : step.icon}</span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px mx-0.5 ${isDone ? 'bg-green-700' : 'bg-[#2d2d44]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
