'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Profile {
  id: string;
  full_name: string | null;
  job_title: string | null;
  team: string | null;
  company: string | null;
  review_cycle_timing: string | null;
  career_goal: string | null;
  key_skills: string[] | null;
}

export function SettingsForm({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [keySkillInput, setKeySkillInput] = useState('');
  const [formData, setFormData] = useState({
    full_name: initialProfile.full_name || '',
    job_title: initialProfile.job_title || '',
    team: initialProfile.team || '',
    company: initialProfile.company || '',
    review_cycle_timing: initialProfile.review_cycle_timing || '',
    career_goal: initialProfile.career_goal || '',
    key_skills: initialProfile.key_skills || [],
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keySkillInput.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        key_skills: [...prev.key_skills, keySkillInput.trim()],
      }));
      setKeySkillInput('');
      setSaved(false);
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      key_skills: prev.key_skills.filter((_, i) => i !== index),
    }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          job_title: formData.job_title,
          team: formData.team,
          company: formData.company,
          review_cycle_timing: formData.review_cycle_timing,
          career_goal: formData.career_goal,
          key_skills: formData.key_skills,
        })
        .eq('id', initialProfile.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch (error) {
      console.error('Settings update error:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          ✓ Changes saved successfully
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
        <Input
          type="text"
          value={formData.full_name}
          onChange={e => handleInputChange('full_name', e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
        <Input
          type="text"
          value={formData.job_title}
          onChange={e => handleInputChange('job_title', e.target.value)}
          placeholder="e.g., Senior Software Engineer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Team / Department</label>
        <Input
          type="text"
          value={formData.team}
          onChange={e => handleInputChange('team', e.target.value)}
          placeholder="e.g., Backend, Product, Design"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
        <Input
          type="text"
          value={formData.company}
          onChange={e => handleInputChange('company', e.target.value)}
          placeholder="Your company name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Review Cycle Timing</label>
        <Input
          type="text"
          value={formData.review_cycle_timing}
          onChange={e => handleInputChange('review_cycle_timing', e.target.value)}
          placeholder="e.g., Q4 annual, mid-year check-in"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Career Goal</label>
        <textarea
          value={formData.career_goal}
          onChange={e => handleInputChange('career_goal', e.target.value)}
          placeholder="Where do you want to be in 1-2 years?"
          className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Skills to Develop</label>
        <Input
          type="text"
          value={keySkillInput}
          onChange={e => setKeySkillInput(e.target.value)}
          onKeyDown={handleAddSkill}
          placeholder="Type a skill and press Enter"
          className="mb-3"
        />
        <div className="flex flex-wrap gap-2">
          {formData.key_skills.map((skill, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill(i)}
                className="text-blue-700 hover:text-blue-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
