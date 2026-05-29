'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type SmartElement = {
  name: string;
  label: string;
  value: string | null;
  displayValue?: string | null;
};

type SmartBreakdownProps = {
  goalId: string;
  title: string;
  description?: string | null;
  specific: string | null;
  measurable: string | null;
  achievable: string | null;
  relevant: string | null;
  time_bound: string | null;
};

export default function SmartBreakdownSection({
  goalId,
  title,
  description,
  specific,
  measurable,
  achievable,
  relevant,
  time_bound,
}: SmartBreakdownProps) {
  const router = useRouter();
  const [refiningElement, setRefiningElement] = useState<string | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [refinedValue, setRefinedValue] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elements: SmartElement[] = [
    { name: 'specific', label: 'Specific', value: specific },
    { name: 'measurable', label: 'Measurable', value: measurable },
    { name: 'achievable', label: 'Achievable', value: achievable },
    { name: 'relevant', label: 'Relevant', value: relevant },
    {
      name: 'time_bound',
      label: 'Time-bound',
      value: time_bound,
      displayValue: time_bound
        ? `Target Date: ${new Date(time_bound).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`
        : null,
    },
  ];

  const handleRefineClick = (elementName: string) => {
    setRefiningElement(elementName);
    setRefinementPrompt('');
    setRefinedValue(null);
    setError(null);
  };

  const handleCancelRefine = () => {
    setRefiningElement(null);
    setRefinementPrompt('');
    setRefinedValue(null);
    setError(null);
  };

  const handleRefine = async (elementName: string, currentValue: string) => {
    if (!refinementPrompt.trim()) {
      setError('Please provide refinement guidance');
      return;
    }

    setIsRefining(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/refine-smart-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementName,
          currentValue,
          userPrompt: refinementPrompt,
          goalId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refine element');
      }

      const { refinedText } = await response.json();
      setRefinedValue(refinedText);
    } catch (err) {
      console.error('Refinement error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSaveRefined = async (elementName: string) => {
    if (!refinedValue) return;

    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('goals')
        .update({ [elementName]: refinedValue })
        .eq('id', goalId);

      if (updateError) throw updateError;

      // Reset state and refresh
      setRefiningElement(null);
      setRefinementPrompt('');
      setRefinedValue(null);
      router.refresh();
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save refined element');
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render if no SMART elements
  const hasSmartElements = elements.some((el) => el.value);
  if (!hasSmartElements) return null;

  return (
    <div className="card mb-8">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">SMART Breakdown</h2>
      <div className="space-y-4">
        {elements.map(
          (element) =>
            element.value && (
              <div key={element.name} className="group relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="mb-1 text-sm font-medium text-gray-700">{element.label}</h3>
                    <p className="text-gray-900">{element.displayValue || element.value}</p>
                  </div>
                  {refiningElement !== element.name && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRefineClick(element.name)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Sparkles className="mr-1 h-4 w-4" />
                      Refine
                    </Button>
                  )}
                </div>

                {/* Refinement UI */}
                {refiningElement === element.name && (
                  <div className="mt-4 space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        How would you like to refine this?
                      </label>
                      <Textarea
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        placeholder="E.g., Make it more specific about the tech stack, Focus on measurable metrics, etc."
                        className="min-h-[80px]"
                        disabled={isRefining || Boolean(refinedValue)}
                      />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    {!refinedValue && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRefine(element.name, element.value!)}
                          disabled={isRefining || !refinementPrompt.trim()}
                          size="sm"
                        >
                          {isRefining ? 'Refining...' : 'Refine with AI'}
                        </Button>
                        <Button variant="tertiary" size="sm" onClick={handleCancelRefine}>
                          Cancel
                        </Button>
                      </div>
                    )}

                    {/* Refined preview */}
                    {refinedValue && (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-md border border-green-200 bg-green-50 p-3">
                          <p className="mb-1 text-xs font-medium text-green-800">Refined Version:</p>
                          <p className="text-sm text-gray-900">{refinedValue}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveRefined(element.name)}
                            disabled={isSaving}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="mr-1 h-4 w-4" />
                            {isSaving ? 'Saving...' : 'Accept & Save'}
                          </Button>
                          <Button variant="tertiary" size="sm" onClick={handleCancelRefine}>
                            <X className="mr-1 h-4 w-4" />
                            Discard
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
        )}
      </div>
    </div>
  );
}
