import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/settings/settings-form';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-display">Profile Settings</h1>
          <p className="text-slate-600 mt-2">Manage your profile and career goals</p>
        </div>

        <SettingsForm initialProfile={profile} />
      </div>
    </div>
  );
}
