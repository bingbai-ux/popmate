'use client';

interface ProgressBarProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: 'メイン' },
  { number: 2, label: 'デザイン' },
  { number: 3, label: 'データ選択' },
  { number: 4, label: '編集' },
  { number: 5, label: '印刷' },
];

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="bg-white border-b border-border py-4">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              {/* ステップ */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    transition-all duration-300
                    ${currentStep === step.number
                      ? 'bg-primary text-white shadow-lg scale-110'
                      : currentStep > step.number
                        ? 'bg-primary/20 text-primary'
                        : 'bg-gray-100 text-gray-400'
                    }
                  `}
                >
                  {currentStep > step.number ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${currentStep === step.number
                      ? 'text-primary'
                      : currentStep > step.number
                        ? 'text-primary/70'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* コネクター */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-12 sm:w-20 h-1 mx-2 rounded-full transition-all duration-300
                    ${currentStep > step.number
                      ? 'bg-primary/40'
                      : 'bg-gray-200'
                    }
                  `}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
