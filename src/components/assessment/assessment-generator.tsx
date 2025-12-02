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

  // Select all active goals
  const selectAllActive = () => {
    const activeGoalIds = goals
      .filter(g => g.status === 'active')
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

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>

        {/* Goal Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Select Goals</label>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllActive}
            >
              Select All Active
            </Button>
          </div>

          {goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {goals.map(goal => (
                <label
                  key={goal.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGoals.includes(goal.id)}
                    onChange={() => toggleGoal(goal.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{goal.title}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    goal.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    goal.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {goal.status}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">
              No goals found. Create some goals first.
            </p>
          )}
        </div>

        {/* Date Range */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Date Range (Optional)</label>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 mb-1 block">From</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 mb-1 block">To</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={setLast6Months}>
                Last 6 Months
              </Button>
              <Button variant="outline" size="sm" onClick={setFullYear}>
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
            <span className="text-sm text-gray-600">
              {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Generated Assessment Editor */}
      {generatedAssessment && (
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Generated Assessment</h2>
              {stats && (
                <p className="text-sm text-gray-600 mt-1">
                  Based on {stats.goalCount} goal{stats.goalCount !== 1 ? 's' : ''} and {stats.actionCount} action{stats.actionCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Assessments</h2>
          <div className="space-y-2">
            {savedAssessments.map(assessment => (
              <div
                key={assessment.id}
                onClick={() => loadAssessment(assessment.id)}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                  loadedAssessmentId === assessment.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div>
                  <h3 className="font-medium text-gray-900">{assessment.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Last updated: {new Date(assessment.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  assessment.status === 'final'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-700'
                }`}>
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
