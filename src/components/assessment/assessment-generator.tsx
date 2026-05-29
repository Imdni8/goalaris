'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AssessmentEditor from './assessment-editor';
import { createClient } from '@/lib/supabase/client';

interface Goal {
  id: string;
  title: string;
  status: string;
  created_at: string;
  actionLogCount: number;
}

interface SavedAssessment {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AssessmentGeneratorProps {
  goals: Goal[];
  savedAssessments: SavedAssessment[];
  userId: string;
}

export default function AssessmentGenerator({
  goals,
  savedAssessments,
  userId,
}: AssessmentGeneratorProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [generatedAssessment, setGeneratedAssessment] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{ goalCount: number; actionCount: number } | null>(null);
  const [loadedAssessmentId, setLoadedAssessmentId] = useState<string | null>(null);

  // Load saved assessment
  const loadAssessment = async (assessmentId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (error) throw error;

      if (data) {
        setGeneratedAssessment(data.content);
        setLoadedAssessmentId(assessmentId);
        // Optionally set the configuration to match the saved assessment
        if (data.goal_ids) {
          setSelectedGoals(data.goal_ids);
        }
        if (data.date_range_start && data.date_range_end) {
          setDateRange({
            start: data.date_range_start,
            end: data.date_range_end,
          });
        }
      }
    } catch (err: any) {
      alert('Failed to load assessment: ' + err.message);
    }
  };

  // Toggle goal selection
  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  // Select all active goals with action logs
  const selectAllActive = () => {
    const activeGoalIds = goals
      .filter(g => g.status === 'active' && g.actionLogCount > 0)
      .map(g => g.id);
    setSelectedGoals(activeGoalIds);
  };

  // Set default date range (last 6 months)
  const setLast6Months = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  // Set full year date range
  const setFullYear = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(0, 1); // January 1st of current year

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  // Generate assessment
  const handleGenerate = async () => {
    setError('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/generate-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalIds: selectedGoals.length > 0 ? selectedGoals : null,
          dateRange: dateRange.start && dateRange.end ? dateRange : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate assessment');
      }

      const data = await response.json();
      setGeneratedAssessment(data.assessment);
      setStats({
        goalCount: data.goalCount,
        actionCount: data.actionCount,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate assessment');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save assessment (update if loaded, insert if new)
  const handleSave = async (title: string, status: 'draft' | 'final') => {
    try {
      const supabase = createClient();

      if (loadedAssessmentId) {
        // Update existing assessment
        const { error: updateError } = await supabase
          .from('assessments')
          .update({
            title,
            content: generatedAssessment,
            date_range_start: dateRange.start || null,
            date_range_end: dateRange.end || null,
            goal_ids: selectedGoals,
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', loadedAssessmentId);

        if (updateError) throw updateError;
        alert('Assessment updated successfully!');
      } else {
        // Insert new assessment
        const { error: saveError } = await supabase.from('assessments').insert({
          user_id: userId,
          title,
          content: generatedAssessment,
          date_range_start: dateRange.start || null,
          date_range_end: dateRange.end || null,
          goal_ids: selectedGoals,
          status,
        });

        if (saveError) throw saveError;
        alert('Assessment saved successfully!');
      }

      // Refresh the page to show updated list
      window.location.reload();
    } catch (err: any) {
      alert('Failed to save assessment: ' + err.message);
    }
  };

  const statusBadgeClass = (status: string) => {
    if (status === 'active' || status === 'final') {
      return status === 'final'
        ? 'bg-success/15 text-success'
        : 'bg-primary/10 text-primary';
    }
    if (status === 'completed') return 'bg-success/15 text-success';
    return 'bg-muted text-muted-foreground';
  };

  const dateInputClass =
    'w-full rounded-md border border-input bg-surface px-3 py-2 text-label text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="card">
        <h2 className="mb-4 text-title">Configuration</h2>

        {/* Goal Selection */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-label text-foreground">Select Goals</span>
            <Button variant="tertiary" size="sm" onClick={selectAllActive}>
              Select All Active
            </Button>
          </div>

          {goals.length > 0 ? (
            <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-border p-3 md:grid-cols-2">
              {goals.map(goal => {
                const isDisabled = goal.actionLogCount === 0;
                return (
                  <label
                    key={goal.id}
                    className={`flex items-center gap-2 rounded p-2 ${
                      isDisabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:bg-muted'
                    }`}
                    title={isDisabled ? 'This goal has no action logs yet. Log some progress before generating an assessment.' : ''}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGoals.includes(goal.id)}
                      onChange={() => !isDisabled && toggleGoal(goal.id)}
                      disabled={isDisabled}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-label text-foreground">{goal.title}</span>
                      <span className="text-caption">
                        {goal.actionLogCount} log{goal.actionLogCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-caption ${statusBadgeClass(goal.status)}`}
                    >
                      {goal.status}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-label text-muted-foreground">
              No goals found. Create some goals first.
            </p>
          )}
        </div>

        {/* Date Range */}
        <div className="mb-6">
          <p className="mb-3 text-label text-foreground">Date Range (Optional)</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1" style={{ minWidth: 200 }}>
              <label htmlFor="assessment-from" className="mb-1 block text-caption">From</label>
              <input
                id="assessment-from"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className={dateInputClass}
              />
            </div>
            <div className="flex-1" style={{ minWidth: 200 }}>
              <label htmlFor="assessment-to" className="mb-1 block text-caption">To</label>
              <input
                id="assessment-to"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className={dateInputClass}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="tertiary" size="sm" onClick={setLast6Months}>
                Last 6 Months
              </Button>
              <Button variant="tertiary" size="sm" onClick={setFullYear}>
                Full Year
              </Button>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || goals.length === 0}
            className="px-6"
          >
            {isGenerating ? 'Generating...' : 'Generate Assessment'}
          </Button>
          {selectedGoals.length > 0 && (
            <span className="text-label text-muted-foreground">
              {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-label text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Generated Assessment Editor */}
      {generatedAssessment && (
        <div className="card">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-title">Generated Assessment</h2>
              {stats && (
                <p className="mt-1 text-label text-muted-foreground">
                  Based on {stats.goalCount} goal{stats.goalCount !== 1 ? 's' : ''} and {stats.actionCount} action{stats.actionCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => {
                  const title = prompt('Enter a title for this assessment:', `Self-Assessment ${new Date().toLocaleDateString()}`);
                  if (title) handleSave(title, 'draft');
                }}
              >
                {loadedAssessmentId ? 'Update as Draft' : 'Save as Draft'}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const title = prompt('Enter a title for this assessment:', `Self-Assessment ${new Date().toLocaleDateString()}`);
                  if (title) handleSave(title, 'final');
                }}
              >
                {loadedAssessmentId ? 'Update as Final' : 'Save as Final'}
              </Button>
            </div>
          </div>

          <AssessmentEditor
            initialContent={generatedAssessment}
            onContentChange={setGeneratedAssessment}
          />
        </div>
      )}

      {/* Saved Assessments List */}
      {savedAssessments.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-title">Saved Assessments</h2>
          <div className="space-y-2">
            {savedAssessments.map(assessment => (
              <div
                key={assessment.id}
                onClick={() => loadAssessment(assessment.id)}
                className={`flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors ${
                  loadedAssessmentId === assessment.id
                    ? 'border-2 border-primary bg-primary/10'
                    : 'border-2 border-transparent bg-muted hover:bg-muted/70'
                }`}
              >
                <div>
                  <h3 className="text-label text-foreground">{assessment.title}</h3>
                  <p className="mt-0.5 text-caption">
                    Last updated: {new Date(assessment.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-caption ${
                    assessment.status === 'final'
                      ? 'bg-success/15 text-success'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {assessment.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
