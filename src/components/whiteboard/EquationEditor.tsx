'use client';

import { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface EquationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string, html: string) => void;
}

const EQUATION_TEMPLATES = [
  { label: 'Fraction', latex: '\\frac{a}{b}' },
  { label: 'Square Root', latex: '\\sqrt{x}' },
  { label: 'Exponent', latex: 'x^{n}' },
  { label: 'Subscript', latex: 'x_{n}' },
  { label: 'Sum', latex: '\\sum_{i=1}^{n}' },
  { label: 'Integral', latex: '\\int_{a}^{b}' },
  { label: 'Limit', latex: '\\lim_{x \\to \\infty}' },
  { label: 'Pi', latex: '\\pi' },
  { label: 'Theta', latex: '\\theta' },
  { label: 'Alpha', latex: '\\alpha' },
  { label: 'Beta', latex: '\\beta' },
  { label: 'Infinity', latex: '\\infty' },
  { label: 'Plus/Minus', latex: '\\pm' },
  { label: 'Times', latex: '\\times' },
  { label: 'Divide', latex: '\\div' },
  { label: 'Not Equal', latex: '\\neq' },
  { label: 'Less/Equal', latex: '\\leq' },
  { label: 'Greater/Equal', latex: '\\geq' },
  { label: 'Approximately', latex: '\\approx' },
  { label: 'Parentheses', latex: '\\left( \\right)' },
];

export default function EquationEditor({ isOpen, onClose, onInsert }: EquationEditorProps) {
  const [latex, setLatex] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!latex.trim()) {
      setPreview('');
      setError('');
      return;
    }

    try {
      const html = katex.renderToString(latex, {
        throwOnError: true,
        displayMode: true,
      });
      setPreview(html);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid LaTeX');
      setPreview('');
    }
  }, [latex]);

  const handleInsertTemplate = (template: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newValue = latex.slice(0, start) + template + latex.slice(end);
    setLatex(newValue);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + template.length, start + template.length);
    }, 0);
  };

  const handleInsert = () => {
    if (!latex.trim() || error) return;

    try {
      const html = katex.renderToString(latex, {
        throwOnError: true,
        displayMode: false,
      });
      onInsert(latex, html);
      setLatex('');
      onClose();
    } catch {
      // Error already handled
    }
  };

  const handleClose = () => {
    setLatex('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Math Equation Editor" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Insert
          </label>
          <div className="flex flex-wrap gap-2">
            {EQUATION_TEMPLATES.map((template) => (
              <button
                key={template.label}
                onClick={() => handleInsertTemplate(template.latex)}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                title={template.latex}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LaTeX Input
          </label>
          <textarea
            ref={inputRef}
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="Enter LaTeX equation, e.g., \frac{1}{2} or x^2 + y^2 = r^2"
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && (
            <p className="mt-1 text-sm text-red-500">{error}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <div className="min-h-[60px] p-4 bg-gray-50 rounded-lg flex items-center justify-center">
            {preview ? (
              <div dangerouslySetInnerHTML={{ __html: preview }} />
            ) : (
              <span className="text-gray-400">Equation preview will appear here</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!latex.trim() || !!error}>
            Insert Equation
          </Button>
        </div>
      </div>
    </Modal>
  );
}
