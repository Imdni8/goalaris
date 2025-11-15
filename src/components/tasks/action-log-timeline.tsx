import { Database } from '@/lib/db/types';

type ActionLog = Database['public']['Tables']['action_logs']['Row'];

type ActionLogTimelineProps = {
  logs: ActionLog[];
};

export default function ActionLogTimeline({ logs }: ActionLogTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="mt-4 text-sm text-gray-500">
        No progress logs yet. Add your first log to track progress!
      </div>
    );
  }

  const statusColors = {
    on_track: 'bg-green-100 text-green-800',
    at_risk: 'bg-orange-100 text-orange-800',
    blocked: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    on_track: 'On Track',
    at_risk: 'At Risk',
    blocked: 'Blocked',
  };

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Progress Logs</h4>
      {logs.map((log) => (
        <div
          key={log.id}
          className="rounded-lg border border-gray-200 bg-white p-3 text-sm"
        >
          <div className="mb-2 flex items-start justify-between">
            <h5 className="font-medium text-gray-900">{log.title}</h5>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                statusColors[log.status as keyof typeof statusColors]
              }`}
            >
              {statusLabels[log.status as keyof typeof statusLabels]}
            </span>
          </div>

          {log.description && (
            <p className="mb-2 text-gray-600">{log.description}</p>
          )}

          {log.blocker_description && (
            <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-700">
              <strong>Blocker:</strong> {log.blocker_description}
            </div>
          )}

          <div className="text-xs text-gray-500">
            {new Date(log.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
