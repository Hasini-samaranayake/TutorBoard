'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import Whiteboard from '@/components/whiteboard/Whiteboard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Homework, HomeworkResource, HomeworkSubmission } from '@/types';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface HomeworkWithResources extends Homework {
  resources?: HomeworkResource[];
}

export default function StudentHomeworkWorkspacePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const classId = searchParams.get('class');

  const [homework, setHomework] = useState<HomeworkWithResources | null>(null);
  const [resources, setResources] = useState<HomeworkResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedResourceUrl, setSelectedResourceUrl] = useState<string | null>(null);
  const [resourceLoadError, setResourceLoadError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [annotationData, setAnnotationData] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState(1);

  const selectedResource = useMemo(
    () => resources.find((r) => r.id === selectedResourceId) || null,
    [resources, selectedResourceId]
  );

  function parseAnnotationPayload(raw: string | null | undefined): { whiteboardData: string; submitted: boolean; savedAt: string | null } {
    if (!raw) return { whiteboardData: '', submitted: false, savedAt: null };
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof parsed.whiteboardData === 'string') {
        return {
          whiteboardData: parsed.whiteboardData,
          submitted: !!parsed.submitted,
          savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : null,
        };
      }
      return { whiteboardData: raw, submitted: false, savedAt: null };
    } catch {
      return { whiteboardData: raw, submitted: false, savedAt: null };
    }
  }

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const [{ data: hwData }, { data: resData }, { data: authData }] = await Promise.all([
        supabase.from('homework').select('*').eq('id', params.id).single(),
        fetch(`/api/homework/resources?homeworkId=${params.id}`).then((r) => (r.ok ? r.json() : [])),
        supabase.auth.getUser(),
      ]);

      if (!hwData) {
        setIsLoading(false);
        return;
      }

      setHomework(hwData as HomeworkWithResources);
      const resourcesList = (resData || []) as HomeworkResource[];
      setResources(resourcesList);
      if (resourcesList.length > 0) {
        setSelectedResourceId(resourcesList[0].id);
      }

      const userId = authData.user?.id;
      if (userId) {
        const { data: existingSubmission } = await supabase
          .from('homework_submissions')
          .select('*')
          .eq('homework_id', params.id)
          .eq('student_id', userId)
          .single();
        if (existingSubmission) {
          setSubmission(existingSubmission as HomeworkSubmission);
          const parsed = parseAnnotationPayload(existingSubmission.annotation_data);
          if (parsed.whiteboardData) setAnnotationData(parsed.whiteboardData);
          setIsSubmitted(parsed.submitted || existingSubmission.submission_type === 'file_upload');
          setLastDraftSavedAt(parsed.savedAt);
          if (existingSubmission.source_resource_id) {
            setSelectedResourceId(existingSubmission.source_resource_id);
          }
        }
      }

      setIsLoading(false);
    }

    loadData();
  }, [params.id]);

  useEffect(() => {
    async function loadSignedUrl() {
      if (!selectedResourceId) return;
      setResourceLoadError(null);
      const response = await fetch(`/api/homework/resources/${selectedResourceId}/view`);
      if (!response.ok) {
        setSelectedResourceUrl(null);
        setResourceLoadError('Unable to load assigned resource.');
        return;
      }
      const data = await response.json() as { signedUrl: string };
      setSelectedResourceUrl(data.signedUrl);
      setPdfPage(1);
    }
    loadSignedUrl();
  }, [selectedResourceId]);

  const saveAnnotated = async (finalSubmit: boolean) => {
    if (!homework || !selectedResource || !annotationData) return;
    if (finalSubmit) {
      setIsSubmittingFinal(true);
    } else {
      setIsSavingDraft(true);
    }

    const savedAt = new Date().toISOString();
    const annotationPayload = JSON.stringify({
      whiteboardData: annotationData,
      submitted: finalSubmit,
      savedAt,
      selectedResourceId: selectedResource.id,
      pdfPage,
    });

    const response = await fetch('/api/homework/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeworkId: homework.id,
        submissionType: 'annotated_resource',
        annotationData: annotationPayload,
        sourceResourceId: selectedResource.id,
      }),
    });

    if (response.ok) {
      const saved = await response.json() as HomeworkSubmission;
      setSubmission(saved);
      setIsSubmitted(finalSubmit);
      setLastDraftSavedAt(savedAt);
      alert(finalSubmit ? 'Homework submitted successfully.' : 'Draft saved. You can continue later.');
    } else {
      alert(finalSubmit ? 'Failed to submit homework.' : 'Failed to save draft.');
    }
    if (finalSubmit) {
      setIsSubmittingFinal(false);
    } else {
      setIsSavingDraft(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading workspace...</div>;
  }

  if (!homework) {
    return <div className="p-8">Homework not found.</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/student/homework?class=${classId || ''}`} className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Homework
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-semibold text-gray-900">Homework Resource Workspace</h1>
        </div>
        <div className="flex items-center gap-2">
          {lastDraftSavedAt && (
            <span className="text-sm text-gray-500">
              Draft saved: {new Date(lastDraftSavedAt).toLocaleTimeString()}
            </span>
          )}
          <Button variant="secondary" onClick={() => saveAnnotated(false)} isLoading={isSavingDraft}>
            Save Draft
          </Button>
          <Button onClick={() => saveAnnotated(true)} isLoading={isSubmittingFinal} disabled={isSubmitted}>
            {isSubmitted ? 'Submitted' : 'Submit Final'}
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 min-h-0">
        <Card className="p-4 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">Tutor Resource</h2>
            <select
              value={selectedResourceId || ''}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {selectedResource && selectedResource.mime_type.includes('pdf') && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <button
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                disabled={pdfPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">Page {pdfPage} of {selectedResource.page_count || 1}</span>
              <button
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setPdfPage((p) => Math.min(selectedResource.page_count || 1, p + 1))}
                disabled={pdfPage >= (selectedResource.page_count || 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100">
            {!selectedResourceUrl && !resourceLoadError && (
              <div className="p-6 text-center text-gray-500">No resource selected</div>
            )}
            {resourceLoadError && (
              <div className="p-6 text-center text-red-600">{resourceLoadError}</div>
            )}
            {selectedResourceUrl && selectedResource?.mime_type.includes('image') && (
              <img src={selectedResourceUrl} alt={selectedResource.name} className="w-full h-full object-contain" />
            )}
            {selectedResourceUrl && selectedResource?.mime_type.includes('pdf') && (
              <iframe
                src={`${selectedResourceUrl}#page=${pdfPage}&toolbar=0&navpanes=0`}
                title={selectedResource.name}
                className="w-full h-full"
              />
            )}
          </div>
        </Card>

        <Card className="p-0 min-h-0 overflow-hidden">
          <Whiteboard
            initialData={annotationData || undefined}
            onChange={setAnnotationData}
            initialTemplate="blank"
          />
        </Card>
      </div>
    </div>
  );
}
