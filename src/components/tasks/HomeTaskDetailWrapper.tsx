import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import type { EnhancedTask, TeamMember, TaskTag } from '../../types';
import { TaskDetailPanel } from './TaskDetailPanel';

/**
 * Wraps the full TaskDetailPanel (from Management/TasksSection) inside a modal
 * overlay so it can be used from Home. Loads project tags on-demand and provides
 * the same editing experience as the Management tab — tags, subtasks, comments,
 * deliverables — without any feature duplication.
 *
 * Only used for project tasks (project_id is set). For planner tasks (no project),
 * HomePage uses HomeTaskFormModal instead.
 */

interface Props {
  task: EnhancedTask;
  teamMembers: TeamMember[];
  onUpdate: (task: EnhancedTask) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function HomeTaskDetailWrapper({ task, teamMembers, onUpdate, onDelete, onClose }: Props) {
  const projectId = task.project_id ?? '';
  const [tags, setTags] = useState<TaskTag[]>([]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    supabase
      .from('task_tags')
      .select('*')
      .eq('project_id', projectId)
      .order('label')
      .then(({ data }) => {
        if (!cancelled) setTags((data ?? []) as TaskTag[]);
      });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleTagCreated(tag: TaskTag) {
    setTags(prev => [...prev, tag]);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Scoped styles to override TaskDetailPanel's fixed side-panel layout for modal use */}
      <style>{`
        .home-task-detail-modal > div {
          width: 100% !important;
          max-width: 32rem !important;
          max-height: 92vh !important;
          position: relative !important;
          top: auto !important;
          border-radius: 1rem !important;
          box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25) !important;
          border: 1px solid rgba(255,255,255,0.7) !important;
        }
      `}</style>

      <div className="relative z-10 home-task-detail-modal w-full max-w-lg">
        <TaskDetailPanel
          task={task}
          teamMembers={teamMembers}
          tags={tags}
          projectId={projectId}
          onClose={onClose}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onReload={() => {}}
          onTagCreated={handleTagCreated}
        />
      </div>
    </div>,
    document.body
  );
}
