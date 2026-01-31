'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SelectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary';
}

const PRIMARY_COLOR = '#2563EB';
const TEXT_DARK = '#0A1628';
const TEXT_MUTED = '#6B7280';

export default function SelectionCard({
  title,
  description,
  icon,
  href,
  variant = 'primary',
}: SelectionCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={() => router.push(href)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full p-8 rounded-2xl border-2 transition-all duration-300 text-left flex flex-col items-center"
      style={{
        borderColor: isPrimary 
          ? PRIMARY_COLOR 
          : isHovered ? PRIMARY_COLOR : 'rgba(37, 99, 235, 0.5)',
        backgroundColor: isPrimary && isHovered 
          ? PRIMARY_COLOR 
          : !isPrimary && isHovered 
            ? 'rgba(37, 99, 235, 0.05)' 
            : 'white',
        color: isPrimary && isHovered ? 'white' : TEXT_DARK,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isHovered 
          ? isPrimary 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
          : 'none',
      }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300"
        style={{
          backgroundColor: isPrimary 
            ? isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(37, 99, 235, 0.1)'
            : isHovered ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)',
          color: isPrimary 
            ? isHovered ? 'white' : PRIMARY_COLOR
            : isHovered ? PRIMARY_COLOR : 'rgba(37, 99, 235, 0.7)',
        }}
      >
        {icon}
      </div>

      <h3
        className="text-xl font-bold mb-2 transition-colors duration-300"
        style={{
          color: isPrimary && isHovered ? 'white' : TEXT_DARK,
        }}
      >
        {title}
      </h3>

      <p
        className="text-sm text-center transition-colors duration-300"
        style={{
          color: isPrimary && isHovered ? 'rgba(255, 255, 255, 0.8)' : TEXT_MUTED,
        }}
      >
        {description}
      </p>

      <div
        className="mt-6 flex items-center gap-2 font-medium transition-all duration-300"
        style={{
          color: isPrimary 
            ? isHovered ? 'white' : PRIMARY_COLOR
            : isHovered ? PRIMARY_COLOR : 'rgba(37, 99, 235, 0.7)',
        }}
      >
        <span>選択する</span>
        <svg 
          className="w-5 h-5 transition-transform duration-300" 
          style={{ transform: isHovered ? 'translateX(4px)' : 'translateX(0)' }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
