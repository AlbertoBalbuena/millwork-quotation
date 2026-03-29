import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ProjectDetails } from './ProjectDetails';
import type { Quotation, Project } from '../types';

export function QuotationDetailsPage() {
  const { projectId, quotationId } = useParams<{ projectId: string; quotationId: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [parentProject, setParentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quotationId) { navigate('/projects', { replace: true }); return; }

    async function load() {
      const [{ data: qData, error: qErr }, { data: pData }] = await Promise.all([
        supabase.from('quotations').select('*').eq('id', quotationId).single(),
        projectId
          ? supabase.from('projects').select('*').eq('id', projectId).single()
          : Promise.resolve({ data: null }),
      ]);

      if (qErr || !qData) {
        navigate(projectId ? `/projects/${projectId}` : '/projects', { replace: true });
        return;
      }
      setQuotation(qData);
      setParentProject(pData);
      setLoading(false);
    }

    load();
  }, [quotationId, projectId, navigate]);

  if (loading || !quotation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-slate-500 text-sm">Loading quotation...</div>
      </div>
    );
  }

  return (
    <ProjectDetails
      project={quotation}
      parentProject={parentProject}
      onBack={() => navigate(projectId ? `/projects/${projectId}` : '/projects')}
    />
  );
}
