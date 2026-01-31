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

const PRIMARY_COLOR = '#2563EB';

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="bg-white border-b py-4" style={{ borderColor: '#E5E7EB' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300"
                  style={{
                    backgroundColor: currentStep === step.number 
                      ? PRIMARY_COLOR 
                      : currentStep > step.number 
                        ? 'rgba(37, 99, 235, 0.2)' 
                        : '#F3F4F6',
                    color: currentStep === step.number 
                      ? 'white' 
                      : currentStep > step.number 
                        ? PRIMARY_COLOR 
                        : '#9CA3AF',
                    transform: currentStep === step.number ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: currentStep === step.number ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                  }}
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
                  className="mt-2 text-xs font-medium"
                  style={{
                    color: currentStep === step.number 
                      ? PRIMARY_COLOR 
                      : currentStep > step.number 
                        ? 'rgba(37, 99, 235, 0.7)' 
                        : '#9CA3AF',
                  }}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className="w-12 sm:w-20 h-1 mx-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: currentStep > step.number 
                      ? 'rgba(37, 99, 235, 0.4)' 
                      : '#E5E7EB',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
