'use client';

import { SavedProject } from '@/types/project';

interface ProjectCardProps {
  project: SavedProject;
  onSelect: (project: SavedProject) => void;
  onDelete: (project: SavedProject) => void;
  onDuplicate: (project: SavedProject) => void;
}

export default function ProjectCard({ project, onSelect, onDelete, onDuplicate }: ProjectCardProps) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow group">
      {/* サムネイル */}
      <div 
        className="aspect-[4/3] bg-gray-100 relative cursor-pointer"
        onClick={() => onSelect(project)}
      >
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* ホバー時のオーバーレイ */}
        <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white font-medium">編集する</span>
        </div>
      </div>

      {/* 情報 */}
      <div className="p-4">
        <h3 className="font-semibold text-text-dark mb-1 truncate">{project.name}</h3>
        <p className="text-xs text-text-muted mb-3">
          {project.template.name} ({project.template.width}×{project.template.height}mm)
        </p>
        <p className="text-xs text-text-muted mb-3">
          更新: {formatDate(project.updatedAt)}
        </p>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <button
            onClick={() => onSelect(project)}
            className="flex-1 py-2 px-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            編集
          </button>
          <button
            onClick={() => onDuplicate(project)}
            className="p-2 bg-gray-100 text-text-muted rounded-lg hover:bg-gray-200 hover:text-text-dark transition-colors"
            title="複製"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(project)}
            className="p-2 bg-gray-100 text-text-muted rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
            title="削除"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
