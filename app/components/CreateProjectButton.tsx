'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    targetAudience: '',
    brandVision: '',
    brandValues: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          intakeAnswers: {
            industry: formData.industry,
            targetAudience: formData.targetAudience,
            brandVision: formData.brandVision,
            brandValues: formData.brandValues.split(',').map(v => v.trim()).filter(Boolean),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/project/${data.data.projectId}`);
        router.refresh();
      } else {
        alert('Failed to create project: ' + data.error);
      }
    } catch (error) {
      alert('Error creating project');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        + New Project
      </button>

      {isMounted && isOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Create New Project
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Answer 5 quick questions to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Question 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  1. What's your project/brand name? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., TechFlow Solutions"
                />
              </div>

              {/* Question 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  2. What industry are you in? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Technology & SaaS"
                />
              </div>

              {/* Question 3 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  3. Who is your target audience? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., B2B tech professionals and decision makers"
                />
              </div>

              {/* Question 4 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  4. What's your brand vision? *
                </label>
                <textarea
                  required
                  value={formData.brandVision}
                  onChange={(e) => setFormData({ ...formData, brandVision: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="e.g., Streamline workflows with intelligent automation"
                />
              </div>

              {/* Question 5 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  5. What are your core brand values? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.brandValues}
                  onChange={(e) => setFormData({ ...formData, brandValues: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Innovation, Reliability, Customer Success (comma-separated)"
                />
              </div>

              {/* Optional Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Additional notes (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={2}
                  placeholder="Any additional context about your project..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="flex-1 px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
