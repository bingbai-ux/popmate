'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProgressBarProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: 'メイン', path: '/' },
  { number: 2, label: 'デザイン', path: '/editor' },
  { number: 3, label: 'データ選択', path: '/data-select' },
  { number: 4, label: '編集', path: '/edit' },
  { number: 5, label: '印刷', path: '/print' },
];

const PRIMARY_COLOR = '#351E28';

function ProgressBarContent({ currentStep }: ProgressBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = searchParams.get('template');

  const handleStepClick = (step: typeof steps[0]) => {
    // 完了済みステップのみクリック可能
    if (step.number >= currentStep) return;

    // templateパラメータを引き継ぐ
    let targetPath = step.path;
    if (template && step.number !== 1) {
      targetPath += `?template=${template}`;
    }

    router.push(targetPath);
  };

  return (
    <div className="bg-white border-b py-4" style={{ borderColor: '#E2E1DA' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isClickable = isCompleted;

            return (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleStepClick(step)}
                    disabled={!isClickable}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                    }`}
                    style={{
                      backgroundColor: isCurrent 
                        ? PRIMARY_COLOR 
                        : isCompleted 
                          ? 'rgba(37, 99, 235, 0.2)' 
                          : '#EFEFEA',
                      color: isCurrent 
                        ? 'white' 
                        : isCompleted 
                          ? PRIMARY_COLOR 
                          : '#84787D',
                      transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: isCurrent ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                    }}
                    title={isClickable ? `${step.label}に戻る` : undefined}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </button>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isClickable ? 'cursor-pointer hover:underline' : ''
                    }`}
                    onClick={() => isClickable && handleStepClick(step)}
                    style={{
                      color: isCurrent 
                        ? PRIMARY_COLOR 
                        : isCompleted 
                          ? 'rgba(37, 99, 235, 0.7)' 
                          : '#84787D',
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className="w-12 sm:w-20 h-1 mx-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: isCompleted 
                        ? 'rgba(37, 99, 235, 0.4)' 
                        : '#E2E1DA',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Suspenseでラップしたエクスポート
export default function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <Suspense fallback={
      <div className="bg-white border-b py-4" style={{ borderColor: '#E2E1DA' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      backgroundColor: currentStep === step.number ? PRIMARY_COLOR : '#EFEFEA',
                      color: currentStep === step.number ? 'white' : '#84787D',
                    }}
                  >
                    {step.number}
                  </div>
                  <span className="mt-2 text-xs font-medium" style={{ color: '#84787D' }}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 sm:w-20 h-1 mx-2 rounded-full" style={{ backgroundColor: '#E2E1DA' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ProgressBarContent currentStep={currentStep} />
    </Suspense>
  );
}
