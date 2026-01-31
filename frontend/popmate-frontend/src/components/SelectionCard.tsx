'use client';

import { useRouter } from 'next/navigation';

interface SelectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary';
}

export default function SelectionCard({
  title,
  description,
  icon,
  href,
  variant = 'primary',
}: SelectionCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        group w-full p-8 rounded-2xl border-2 transition-all duration-300
        text-left flex flex-col items-center
        ${variant === 'primary'
          ? 'border-primary bg-white hover:bg-primary hover:text-white hover:shadow-xl hover:scale-105'
          : 'border-primary/50 bg-white hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:scale-105'
        }
      `}
    >
      {/* アイコン */}
      <div
        className={`
          w-20 h-20 rounded-full flex items-center justify-center mb-6
          transition-all duration-300
          ${variant === 'primary'
            ? 'bg-primary/10 text-primary group-hover:bg-white/20 group-hover:text-white'
            : 'bg-primary/5 text-primary/70 group-hover:bg-primary/10 group-hover:text-primary'
          }
        `}
      >
        {icon}
      </div>

      {/* タイトル */}
      <h3
        className={`
          text-xl font-bold mb-2 transition-colors duration-300
          ${variant === 'primary'
            ? 'text-text-dark group-hover:text-white'
            : 'text-text-dark'
          }
        `}
      >
        {title}
      </h3>

      {/* 説明文 */}
      <p
        className={`
          text-sm text-center transition-colors duration-300
          ${variant === 'primary'
            ? 'text-text-muted group-hover:text-white/80'
            : 'text-text-muted'
          }
        `}
      >
        {description}
      </p>

      {/* 矢印 */}
      <div
        className={`
          mt-6 flex items-center gap-2 font-medium transition-all duration-300
          ${variant === 'primary'
            ? 'text-primary group-hover:text-white'
            : 'text-primary/70 group-hover:text-primary'
          }
        `}
      >
        <span>選択する</span>
        <svg
          className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
}
