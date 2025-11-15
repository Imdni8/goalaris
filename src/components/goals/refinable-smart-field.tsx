'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

type RefinableSmartFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  elementName: string;
  goalTitle: string;
  goalDescription?: string;
  rows?: number;
  placeholder?: string;
};

export default function RefinableSmartField({
  label,
  value,
  onChange,
  elementName,
  goalTitle,
  goalDescription,
  rows = 2,
  placeholder,
}: RefinableSmartFieldProps) {
  const [isRefining, setIsRefining] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefineClick = () => {
    setIsRefining(true);
    setRefinementPrompt('');
    setError(null);
  };

  const handleCancel = () => {
    setIsRefining(false);
    setRefinementPrompt('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!refinementPrompt.trim()) {
      setError('Please provide refinement guidance');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/refine-smart-element-inline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementName,
          currentValue: value,
          userPrompt: refinementPrompt,
          goalContext: { title: goalTitle, description: goalDescription },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refine element');
      }

      const { refinedText } = await response.json();
      onChange(refinedText);
      setIsRefining(false);
      setRefinementPrompt('');
    } catch (err) {
      console.error('Refinement error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
      />

      {!isRefining ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRefineClick}
          className="mt-2 text-blue-600 hover:text-blue-700"
        >
          <Sparkles className="mr-1 h-4 w-4" />
          Refine with AI
        </Button>
      ) : (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            placeholder="How shall this be refined?"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            disabled={loading}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={loading || !refinementPrompt.trim()}
            >
              {loading ? 'Refining...' : 'Submit'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
