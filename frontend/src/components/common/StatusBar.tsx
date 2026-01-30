'use client';

import type { WorkflowStep } from '@/types';

interface StatusBarProps {
  currentStep: WorkflowStep;
  onStepClick: (step: WorkflowStep) => void;
  completedSteps: WorkflowStep[];
}

const steps: { id: WorkflowStep; label: string; number: number; icon: string }[] = [
  { id: 'template', label: 'テンプレート', number: 1, icon: '📋' },
  { id: 'design', label: 'デザイン', number: 2, icon: '🎨' },
  { id: 'data', label: 'データ選択', number: 3, icon: '📦' },
  { id: 'preview', label: 'プレビュー', number: 4, icon: '👁️' },
  { id: 'print', label: '印刷', number: 5, icon: '🖨️' },
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
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center py-3 overflow-x-auto">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isClickable = status === 'completed' || status === 'active';

            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                    ${status === 'active' 
                      ? 'bg-primary text-white' 
                      : status === 'completed'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <span className={`
                    flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                    ${status === 'active' 
                      ? 'bg-white/20' 
                      : status === 'completed'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-500'
                    }
                  `}>
                    {status === 'completed' ? '✓' : step.number}
                  </span>
                  <span className="text-sm font-medium whitespace-nowrap">{step.label}</span>
                </button>
                
                {index < steps.length - 1 && (
                  <div className={`
                    w-8 h-0.5 mx-1
                    ${completedSteps.includes(step.id) ? 'bg-green-400' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
