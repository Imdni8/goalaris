'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OnboardingData {
  job_title: string;
  team: string;
  company: string;
  review_cycle_timing: string;
  career_goal: string;
  key_skills: string[];
}

const TEAM_OPTIONS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'HR',
  'Finance',
  'Customer Success',
  'Data',
  'Infrastructure',
  'Security',
  'Other',
];

const REVIEW_CYCLE_OPTIONS = [
  'Q1 (Jan-Mar)',
  'Q2 (Apr-Jun)',
  'Q3 (Jul-Sep)',
  'Q4 (Oct-Dec)',
  'Semi-annual (Mid-year & Annual)',
  'Annual only',
  'Quarterly',
  'Monthly',
];

const steps = [
  {
    title: 'What\'s your current role?',
    field: 'job_title',
    type: 'text',
    placeholder: 'e.g., Senior Software Engineer',
  },
  {
    title: 'What team are you on?',
    field: 'team',
    type: 'select',
    placeholder: 'Select a team',
    options: TEAM_OPTIONS,
  },
  {
    title: 'What company do you work for?',
    field: 'company',
    type: 'text',
    placeholder: 'e.g., Acme Corp',
  },
  {
    title: 'When is your review cycle?',
    field: 'review_cycle_timing',
    type: 'select',
    placeholder: 'Select your review cycle',
    options: REVIEW_CYCLE_OPTIONS,
  },
  {
    title: 'Where do you want to be in 1-2 years?',
    field: 'career_goal',
    type: 'textarea',
    placeholder: 'e.g., Get promoted to Staff Engineer, move into people management',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    job_title: '',
    team: '',
    company: '',
    review_cycle_timing: '',
    career_goal: '',
    key_skills: [],
  });
  const [keySkillInput, setKeySkillInput] = useState('');

  const currentStep = steps[step];

  const handleInputChange = (value: string) => {
    setData(prev => ({
      ...prev,
      [currentStep.field]: value,
    }));
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keySkillInput.trim()) {
      e.preventDefault();
      setData(prev => ({
        ...prev,
        key_skills: [...prev.key_skills, keySkillInput.trim()],
      }));
      setKeySkillInput('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setData(prev => ({
      ...prev,
      key_skills: prev.key_skills.filter((_, i) => i !== index),
    }));
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          job_title: data.job_title,
          team: data.team,
          company: data.company,
          review_cycle_timing: data.review_cycle_timing,
          career_goal: data.career_goal,
          key_skills: data.key_skills,
          onboarding_completed: true,
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Force a refresh to get updated profile data in dashboard layout
      await new Promise(resolve => setTimeout(resolve, 300));
      router.refresh();
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isLastStep = step === steps.length - 1;
  const currentValue = data[currentStep.field as keyof Omit<OnboardingData, 'key_skills'>];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex gap-2 mb-8 justify-center">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i < step ? 'bg-blue-600 w-6' : i === step ? 'bg-blue-600 w-8' : 'bg-slate-300 w-2'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-slate-900">{currentStep.title}</h1>

          {/* Text input */}
          {currentStep.type === 'text' && (
            <Input
              type="text"
              value={currentValue as string}
              onChange={e => handleInputChange(e.target.value)}
              placeholder={currentStep.placeholder}
              className="mb-6 bg-white text-slate-900 placeholder-slate-400"
              autoFocus
            />
          )}

          {/* Select dropdown */}
          {currentStep.type === 'select' && (
            <select
              value={currentValue as string}
              onChange={e => handleInputChange(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-md mb-6 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={currentStep.title}
              autoFocus
            >
              <option value="">{currentStep.placeholder}</option>
              {(currentStep as any).options?.map((opt: string) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {/* Textarea */}
          {currentStep.type === 'textarea' && (
            <textarea
              value={currentValue as string}
              onChange={e => handleInputChange(e.target.value)}
              placeholder={currentStep.placeholder}
              className="w-full p-3 border border-slate-300 rounded-md mb-6 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              autoFocus
            />
          )}

          {/* Key skills input - shown on last step */}
          {isLastStep && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What skills do you want to develop? (optional)
              </label>
              <Input
                type="text"
                value={keySkillInput}
                onChange={e => setKeySkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Type a skill and press Enter"
                className="mb-3 bg-white text-slate-900 placeholder-slate-400"
              />
              <div className="flex flex-wrap gap-2">
                {data.key_skills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(i)}
                      className="text-blue-700 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={step === 0}
              className="flex-1"
            >
              Back
            </Button>
            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={loading || !data.job_title || !data.company || !data.team || !data.review_cycle_timing}
                className="flex-1"
              >
                {loading ? 'Setting up...' : 'Complete'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!currentValue}
                className="flex-1"
              >
                Next
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-slate-600 text-sm mt-6">
          Step {step + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
}
