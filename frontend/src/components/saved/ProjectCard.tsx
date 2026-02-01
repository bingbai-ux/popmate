'use client';

import { SavedProject } from '@/types/project';

interface ProjectCardProps {
  project: SavedProject;
  onSelect: (project: SavedProject) => void;
  onDelete: (project: SavedProject) => void;
  onDuplicate: (project: SavedProject) => void;
}

export default function ProjectCard({ project, onSelect, onDelete, onDuplicate }: ProjectCardProps) {
  const isTemplate = (project.saveType || 'project') === 'template';

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
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* タイプバッジ */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm ${
            isTemplate
              ? 'bg-purple-100 text-purple-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {isTemplate ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                </svg>
                テンプレート
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                </svg>
                プロジェクト
              </>
            )}
          </span>
        </div>

        {/* ホバー時のオーバーレイ */}
        <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white font-medium">
            {isTemplate ? 'このデザインを使う' : '編集を再開'}
          </span>
        </div>
      </div>

      {/* 情報 */}
      <div className="p-4">
        <h3 className="font-semibold text-text-dark mb-1 truncate">{project.name}</h3>
        <p className="text-xs text-text-muted mb-1">
          {project.template.name} ({project.template.width}×{project.template.height}mm)
        </p>
        {!isTemplate && project.selectedProducts && project.selectedProducts.length > 0 && (
          <p className="text-xs text-green-600 mb-1">
            商品 {project.selectedProducts.length}件
          </p>
        )}
        <p className="text-xs text-text-muted mb-3">
          更新: {formatDate(project.updatedAt)}
        </p>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <button
            onClick={() => onSelect(project)}
            className={`flex-1 py-2 px-3 text-white text-sm font-medium rounded-lg transition-colors ${
              isTemplate
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            {isTemplate ? 'デザインを使う' : '編集再開'}
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
