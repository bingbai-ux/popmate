'use client';

import type { WorkflowStep } from '@/types';

interface StatusBarProps {
  currentStep: WorkflowStep;
  onStepClick: (step: WorkflowStep) => void;
  completedSteps: WorkflowStep[];
}

const steps: { id: WorkflowStep; label: string; number: number }[] = [
  { id: 'template', label: 'テンプレート選択', number: 1 },
  { id: 'design', label: 'デザイン編集', number: 2 },
  { id: 'data', label: 'データ選択', number: 3 },
  { id: 'preview', label: 'プレビュー', number: 4 },
  { id: 'print', label: '印刷', number: 5 },
];

export default function StatusBar({
  currentStep,
  onStepClick,
  completedSteps,
}: StatusBarProps) {
  const getStepStatus = (stepId: WorkflowStep) => {
    if (stepId === currentStep) return 'active';
    if (completedSteps.includes(stepId)) return 'completed';
    return 'pending';
  };

  return (
    <div className="status-bar">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const isClickable = status === 'completed' || status === 'active';

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              className={`status-step ${status}`}
              disabled={!isClickable}
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-sm font-bold">
                {status === 'completed' ? '✓' : step.number}
              </span>
              <span>{step.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div className="w-8 h-0.5 bg-gray-300 mx-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}
