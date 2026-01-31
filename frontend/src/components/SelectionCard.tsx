'use client';

import { useRouter } from 'next/navigation';


interface SelectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
}



export default function SelectionCard({
  title,
  description,
  icon,
  href,
  variant = 'primary',
}: SelectionCardProps) {
  const router = useRouter();

  const variantStyles = {
    primary: {
      card: 'border-primary bg-white hover:bg-primary hover:border-primary',
      iconBg: 'bg-primary/10 text-primary group-hover:bg-white/20 group-hover:text-white',
      title: 'text-text-dark group-hover:text-white',
      desc: 'text-text-muted group-hover:text-white/80',
      action: 'text-primary group-hover:text-white',
    },
    secondary: {
      card: 'border-gray-200 bg-white hover:border-primary hover:bg-primary/5',
      iconBg: 'bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary',
      title: 'text-text-dark',
      desc: 'text-text-muted',
      action: 'text-gray-500 group-hover:text-primary',
    },
    tertiary: {
      card: 'border-dashed border-2 border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/5',
      iconBg: 'bg-white text-gray-400 group-hover:bg-primary/10 group-hover:text-primary',
      title: 'text-text-dark',
      desc: 'text-text-muted',
      action: 'text-gray-500 group-hover:text-primary',
    },
  };

  const styles = variantStyles[variant];

  return (
    <button
      onClick={() => router.push(href)}
      className={`group w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left flex flex-col items-center hover:shadow-lg hover:scale-105 ${styles.card}`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${styles.iconBg}`}>
        {icon}
      </div>

      <h3 className={`text-lg font-bold mb-2 text-center transition-colors duration-300 ${styles.title}`}>
        {title}
      </h3>

      <p className={`text-sm text-center transition-colors duration-300 ${styles.desc}`}>
        {description}
      </p>

      <div className={`mt-4 flex items-center gap-2 font-medium transition-all duration-300 ${styles.action}`}>
        <span className="text-sm">選択する</span>
        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
