'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface AssessmentEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
}

export default function AssessmentEditor({
  initialContent,
  onContentChange,
}: AssessmentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showRefinementPopup, setShowRefinementPopup] = useState(false);
  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinedPreview, setRefinedPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update content when initial content changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Handle text selection
  const handleTextSelect = () => {
    if (!textareaRef.current || isEditing) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    if (start !== end) {
      const selected = content.substring(start, end);
      setSelectedText(selected);
      setSelectionRange({ start, end });
      setShowRefinementPopup(true);
    } else {
      setSelectedText('');
      setSelectionRange(null);
      setShowRefinementPopup(false);
    }
  };

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange(newContent);
  };

  // Refine selected text with AI
  const handleRefine = async () => {
    if (!selectedText || !refinementInstruction.trim()) {
      alert('Please provide refinement instructions');
      return;
    }

    setIsRefining(true);

    try {
      const response = await fetch('/api/ai/refine-assessment-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedText,
          userInstruction: refinementInstruction,
          fullContext: content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine text');
      }

      const data = await response.json();
      setRefinedPreview(data.refinedText);
      setShowPreview(true);
    } catch (err: any) {
      alert('Failed to refine text: ' + err.message);
    } finally {
      setIsRefining(false);
    }
  };

  // Accept refined text
  const acceptRefinement = () => {
    if (!selectionRange || !refinedPreview) return;

    const newContent =
      content.substring(0, selectionRange.start) +
      refinedPreview +
      content.substring(selectionRange.end);

    handleContentChange(newContent);
    resetRefinement();
  };

  // Reset refinement state
  const resetRefinement = () => {
    setSelectedText('');
    setSelectionRange(null);
    setShowRefinementPopup(false);
    setRefinementInstruction('');
    setRefinedPreview('');
    setShowPreview(false);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert('Copied to clipboard!');
  };

  // Word count
  const wordCount = content.trim().split(/\s+/).length;
  const charCount = content.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex gap-2">
          <Button
            variant={isEditing ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'View Mode' : 'Edit Mode'}
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            onClick={copyToClipboard}
          >
            Copy to Clipboard
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          {wordCount} words • {charCount} characters
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => isEditing && handleContentChange(e.target.value)}
          onMouseUp={handleTextSelect}
          onKeyUp={handleTextSelect}
          readOnly={!isEditing}
          className={`w-full min-h-[400px] p-4 border border-gray-300 rounded-lg text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isEditing ? 'bg-white' : 'bg-gray-50 cursor-default'
          }`}
          style={{ whiteSpace: 'pre-wrap' }}
        />

        {/* Refinement Popup */}
        {showRefinementPopup && selectedText && !isEditing && (
          <div className="absolute bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 z-10">
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-900 mb-1">Selected Text:</div>
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                {selectedText.substring(0, 100)}
                {selectedText.length > 100 && '...'}
              </div>
            </div>

            <div className="mb-3">
              <label className="text-sm font-medium text-gray-900 mb-1 block">
                How should I refine this?
              </label>
              <input
                type="text"
                value={refinementInstruction}
                onChange={(e) => setRefinementInstruction(e.target.value)}
                placeholder="e.g., Make this more quantitative"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleRefine()}
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleRefine}
                disabled={isRefining || !refinementInstruction.trim()}
                className="flex-1"
              >
                {isRefining ? 'Refining...' : 'Refine with AI'}
              </Button>
              <Button
                variant="tertiary"
                size="sm"
                onClick={resetRefinement}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Preview Popup */}
        {showPreview && refinedPreview && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 rounded-lg">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Refined Text Preview</h3>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Original:</div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {selectedText}
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">Refined:</div>
                <div className="text-sm text-gray-900 bg-blue-50 p-3 rounded border border-blue-200">
                  {refinedPreview}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={acceptRefinement} className="flex-1">
                  Accept Changes
                </Button>
                <Button
                  variant="tertiary"
                  onClick={() => setShowPreview(false)}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  variant="tertiary"
                  onClick={resetRefinement}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      {!isEditing && (
        <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
          💡 <strong>Tip:</strong> Select any text to refine it with AI, or click &quot;Edit Mode&quot; to manually edit the assessment.
        </div>
      )}
    </div>
  );
}
