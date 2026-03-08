'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import GoalCreationModal from '@/components/goals/goal-creation-modal';

interface UserProfile {
  name?: string;
  jobTitle?: string;
  team?: string;
  company?: string;
  careerGoal?: string;
  keySkills?: string[];
}

export default function CreateGoalButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, job_title, team, company, career_goal, key_skills')
          .eq('id', userData.user.id)
          .single();

        if (profile) {
          setUserProfile({
            name: profile.full_name || undefined,
            jobTitle: profile.job_title || undefined,
            team: profile.team || undefined,
            company: profile.company || undefined,
            careerGoal: profile.career_goal || undefined,
            keySkills: profile.key_skills || undefined,
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };

    fetchProfile();
  }, [supabase]);

  return (
    <>
      <Button
        className="bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => setIsModalOpen(true)}
      >
        + Create new goal
      </Button>
      <GoalCreationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userProfile={userProfile}
      />
    </>
  );
}
