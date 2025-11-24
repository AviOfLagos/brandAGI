'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

interface DecisionOption {
  id: string;
  name: string;
  description: string;
  confidence?: number;
  details?: string;
}

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisionId: string;
  question: string;
  options: DecisionOption[];
  projectName?: string;
}

export function DecisionModal({
  isOpen,
  onClose,
  decisionId,
  question,
  options,
  projectName,
}: DecisionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useState(() => {
    setIsMounted(true);
  });

  const handleApprove = async () => {
    if (!selectedOption) {
      alert('Please select an option');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/decisions/${decisionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedOption }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Decision approved! Workflow will resume.');
        onClose();
        window.location.reload(); // Refresh to show updated workflow
      } else {
        alert('Failed to approve decision: ' + data.error);
      }
    } catch (error) {
      alert('Error approving decision');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !isMounted) return null;

  const modal = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                🤔 Decision Required
              </h2>
              {projectName && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Project: {projectName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {question}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select the strategy that best aligns with your brand goals. This decision will shape your content calendar and messaging.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {options.map((option) => (
              <div
                key={option.id}
                onClick={() => !isSubmitting && setSelectedOption(option.id)}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedOption === option.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Checkmark */}
                {selectedOption === option.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <div className="pr-10">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {option.name}
                    </h4>
                    {option.confidence !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        option.confidence >= 0.8 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        option.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {(option.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {option.description}
                  </p>

                  {option.details && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {option.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">What happens next?</p>
                <p>Once you approve, the workflow will resume and generate a 30-day content calendar based on your selected strategy.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={!selectedOption || isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Approving...' : 'Approve & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
