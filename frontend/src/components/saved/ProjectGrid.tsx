'use client';

import { SavedProject } from '@/types/project';
import ProjectCard from './ProjectCard';

interface ProjectGridProps {
  projects: SavedProject[];
  onSelect: (project: SavedProject) => void;
  onDelete: (project: SavedProject) => void;
  onDuplicate: (project: SavedProject) => void;
  isLoading?: boolean;
}

export default function ProjectGrid({ projects, onSelect, onDelete, onDuplicate, isLoading }: ProjectGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="p-4">
              <div className="h-5 bg-gray-200 rounded mb-2 w-3/4" />
              <div className="h-3 bg-gray-200 rounded mb-3 w-1/2" />
              <div className="h-3 bg-gray-200 rounded mb-3 w-2/3" />
              <div className="flex gap-2">
                <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
                <div className="w-9 h-9 bg-gray-200 rounded-lg" />
                <div className="w-9 h-9 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-dark mb-2">
          保存されたプロジェクトがありません
        </h3>
        <p className="text-text-muted mb-6">
          テンプレートからポップを作成して保存すると、ここに表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onSelect={onSelect}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  );
}
