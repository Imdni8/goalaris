'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SpiderChart, type SpiderAxis } from './spider-chart';
import { InterviewProgress } from './interview-progress';
import { RoleCombobox } from './role-combobox';
import type { Rubric, Diagnosis, CompetencyAxis, EvidenceStrength } from '@/lib/ai/agents/diagnosis/types';

type Step = 'rubric' | 'interview' | 'diagnosis';
interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}
type StrengthMap = Record<string, EvidenceStrength>;
/** Shape of an assessor turn returned by /assess. */
interface AssessTurn {
  reply: string;
  focusKey?: string;
  strengths?: StrengthMap;
  readyToDiagnose?: boolean;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

const BASE = '/api/ai/coach-agent';

export function ReadinessFlow() {
  const [step, setStep] = useState<Step>('rubric');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // rubric step
  const [roleTitle, setRoleTitle] = useState('');
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [rubricId, setRubricId] = useState<string | null>(null);

  // interview step
  const [transcript, setTranscript] = useState<ChatMsg[]>([]);
  const [message, setMessage] = useState('');
  const [managerFeedback, setManagerFeedback] = useState('');
  const [strengths, setStrengths] = useState<StrengthMap>({});
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [readyToDiagnose, setReadyToDiagnose] = useState(false);

  // diagnosis step
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);

  const guard = async (fn: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const generateRubric = () =>
    guard(async () => {
      const { rubric } = await postJSON<{ rubric: Rubric }>(`${BASE}/rubric`, {
        roleTitle: roleTitle || undefined,
        jdText: jdText || undefined,
      });
      setRubric(rubric);
    });

  const approveRubric = () =>
    guard(async () => {
      if (!rubric) return;
      const { id } = await postJSON<{ id: string }>(`${BASE}/rubric/approve`, {
        rubric,
        source: jdText ? 'uploaded' : 'generated',
        resumeText: resumeText || undefined,
        jdText: jdText || undefined,
      });
      setRubricId(id);
      setStep('interview');
      setStrengths({});
      setFocusKey(null);
      setReadyToDiagnose(false);
      // kick off the interview with the coach's opening question
      const turn = await postJSON<AssessTurn>(`${BASE}/assess`, {
        rubricId: id,
        transcript: [],
        userMessage: "I'm ready to start.",
        strengths: {},
      });
      setTranscript([{ role: 'assistant', content: turn.reply }]);
      applyTurnProgress(turn);
    });

  const applyTurnProgress = (turn: AssessTurn) => {
    // The server merges evidence-strength monotonically and code-gates readiness,
    // so we just adopt what it returns. A settled competency never reverts, and a
    // stale focusKey pointing at an already-settled axis is suppressed so a done
    // pill can't flip back to "current".
    const merged = turn.strengths ?? {};
    setStrengths(merged);
    setFocusKey(turn.focusKey && !merged[turn.focusKey] ? turn.focusKey : null);
    setReadyToDiagnose(Boolean(turn.readyToDiagnose));
  };

  const send = () =>
    guard(async () => {
      if (!rubricId || !message.trim()) return;
      const userMsg: ChatMsg = { role: 'user', content: message.trim() };
      const next = [...transcript, userMsg];
      setTranscript(next);
      setMessage('');
      const turn = await postJSON<AssessTurn>(`${BASE}/assess`, {
        rubricId,
        transcript: next,
        userMessage: userMsg.content,
        strengths,
      });
      const withReply = [...next, { role: 'assistant' as const, content: turn.reply }];
      setTranscript(withReply);
      applyTurnProgress(turn);
      // The coach runs the diagnosis itself the moment it has enough — the user
      // never has to click "Run diagnosis" once it's said it's ready.
      if (turn.readyToDiagnose) {
        await performDiagnosis(withReply);
      }
    });

  const addManagerFeedback = () =>
    guard(async () => {
      if (!managerFeedback.trim()) return;
      await postJSON(`${BASE}/evidence`, {
        type: 'manager_feedback',
        content: managerFeedback.trim(),
        sourceLabel: 'manager feedback',
      });
      setManagerFeedback('');
      setTranscript((t) => [
        ...t,
        { role: 'assistant', content: 'Thanks — I’ve added that manager feedback to your evidence.' },
      ]);
    });

  // The actual diagnosis call, without the busy/error guard so it can be invoked
  // both directly (manual button) and inline from `send` (auto-run when ready).
  const performDiagnosis = async (transcriptOverride?: ChatMsg[]) => {
    if (!rubricId) return;
    const result = await postJSON<Diagnosis>(`${BASE}/diagnose`, {
      rubricId,
      transcript: transcriptOverride ?? transcript,
      resumeText: resumeText || undefined,
      managerFeedback: managerFeedback || undefined,
    });
    setDiagnosis(result);
    setStep('diagnosis');
  };

  const runDiagnose = () => guard(performDiagnosis);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-2 text-body text-destructive">
          {error}
        </div>
      )}

      {step === 'rubric' && (
        <RubricStep
          {...{ roleTitle, setRoleTitle, jdText, setJdText, resumeText, setResumeText, rubric, setRubric, busy }}
          onGenerate={generateRubric}
          onApprove={approveRubric}
        />
      )}

      {step === 'interview' && (
        <InterviewStep
          {...{ transcript, message, setMessage, managerFeedback, setManagerFeedback, busy }}
          competencies={rubric?.competencies ?? []}
          strengths={strengths}
          focusKey={focusKey}
          readyToDiagnose={readyToDiagnose}
          onSend={send}
          onAddManagerFeedback={addManagerFeedback}
          onDiagnose={runDiagnose}
        />
      )}

      {step === 'diagnosis' && diagnosis && rubric && (
        <DiagnosisStep diagnosis={diagnosis} rubric={rubric} />
      )}
    </div>
  );
}

/** Inline "upload PDF" affordance — extracts text server-side, never stores the file. */
function PdfUpload({ onText, onError }: { onText: (t: string) => void; onError: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className={cn('cursor-pointer text-caption', busy ? 'text-muted-foreground' : 'text-primary')}>
      {busy ? 'Extracting…' : 'or upload PDF'}
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // allow re-selecting the same file
          if (!file) return;
          setBusy(true);
          try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch(`${BASE}/extract`, { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to read PDF');
            onText(data.text);
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Failed to read PDF');
          } finally {
            setBusy(false);
          }
        }}
      />
    </label>
  );
}

// ── Rubric step ─────────────────────────────────────────────────────────────
function RubricStep(props: {
  roleTitle: string;
  setRoleTitle: (v: string) => void;
  jdText: string;
  setJdText: (v: string) => void;
  resumeText: string;
  setResumeText: (v: string) => void;
  rubric: Rubric | null;
  setRubric: (r: Rubric) => void;
  busy: boolean;
  onGenerate: () => void;
  onApprove: () => void;
}) {
  const { rubric, setRubric } = props;
  const [pdfError, setPdfError] = useState<string | null>(null);

  const patch = (i: number, key: 'label' | 'description' | 'target_level', value: string) => {
    if (!rubric) return;
    const competencies = rubric.competencies.map((c, idx) =>
      idx === i ? { ...c, [key]: key === 'target_level' ? Number(value) : value } : c,
    );
    setRubric({ ...rubric, competencies });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your target role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pdfError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-caption text-destructive">
              {pdfError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-caption text-muted-foreground">Target role</label>
            <RoleCombobox value={props.roleTitle} onChange={props.setRoleTitle} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-caption text-muted-foreground">
                Paste the JD or promotion rubric (optional — we’ll generate one if blank)
              </label>
              <PdfUpload onText={props.setJdText} onError={setPdfError} />
            </div>
            <Textarea
              rows={4}
              placeholder="Paste the target-role job description or leveling rubric…"
              value={props.jdText}
              onChange={(e) => props.setJdText(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-caption text-muted-foreground">
                Paste your current resume (used during the assessment)
              </label>
              <PdfUpload onText={props.setResumeText} onError={setPdfError} />
            </div>
            <Textarea
              rows={4}
              placeholder="Paste your resume text…"
              value={props.resumeText}
              onChange={(e) => props.setResumeText(e.target.value)}
            />
          </div>
          <Button onClick={props.onGenerate} disabled={props.busy || (!props.roleTitle && !props.jdText)}>
            {props.busy ? 'Working…' : rubric ? 'Regenerate rubric' : 'Generate rubric'}
          </Button>
        </CardContent>
      </Card>

      {rubric && (
        <Card>
          <CardHeader>
            <CardTitle>Review the rubric — these become your chart axes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rubric.competencies.map((c, i) => (
              <div key={c.key} className="space-y-1.5 rounded-md border border-border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    className="font-medium"
                    value={c.label}
                    onChange={(e) => patch(i, 'label', e.target.value)}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-caption text-muted-foreground">target</span>
                    <Input
                      className="w-16"
                      type="number"
                      min={1}
                      max={5}
                      value={c.target_level}
                      onChange={(e) => patch(i, 'target_level', e.target.value)}
                    />
                  </div>
                </div>
                <Textarea
                  rows={2}
                  value={c.description}
                  onChange={(e) => patch(i, 'description', e.target.value)}
                />
              </div>
            ))}
            <Button onClick={props.onApprove} disabled={props.busy}>
              {props.busy ? 'Working…' : 'Approve & start assessment'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Interview step ──────────────────────────────────────────────────────────
function InterviewStep(props: {
  transcript: ChatMsg[];
  message: string;
  setMessage: (v: string) => void;
  managerFeedback: string;
  setManagerFeedback: (v: string) => void;
  busy: boolean;
  competencies: CompetencyAxis[];
  strengths: StrengthMap;
  focusKey: string | null;
  readyToDiagnose: boolean;
  onSend: () => void;
  onAddManagerFeedback: () => void;
  onDiagnose: () => void;
}) {
  return (
    <div className="space-y-4">
      {props.competencies.length > 0 && (
        <InterviewProgress
          competencies={props.competencies}
          strengths={props.strengths}
          focusKey={props.focusKey}
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Assessment interview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {props.transcript.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === 'assistant'
                    ? 'rounded-md bg-muted px-3 py-2 text-body text-foreground'
                    : 'rounded-md bg-primary/10 px-3 py-2 text-body text-foreground'
                }
              >
                <span className="text-caption text-muted-foreground">
                  {m.role === 'assistant' ? 'Coach' : 'You'}
                </span>
                <p>{m.content}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              rows={2}
              placeholder="Answer the coach…"
              value={props.message}
              onChange={(e) => props.setMessage(e.target.value)}
            />
            <Button onClick={props.onSend} disabled={props.busy || !props.message.trim()}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Add evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-caption text-muted-foreground">
              Paste manager feedback you’ve received — it’s weighed above self-report.
            </p>
            <Textarea
              rows={3}
              placeholder="Paste manager feedback…"
              value={props.managerFeedback}
              onChange={(e) => props.setManagerFeedback(e.target.value)}
            />
            <Button
              onClick={props.onAddManagerFeedback}
              disabled={props.busy || !props.managerFeedback.trim()}
            >
              Add to evidence
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-1.5">
          <Button
            className="w-full"
            variant={props.readyToDiagnose ? 'primary' : 'tertiary'}
            onClick={props.onDiagnose}
            disabled={props.busy}
          >
            {props.busy ? 'Working…' : 'Run diagnosis'}
          </Button>
          {props.readyToDiagnose && (
            <p className="text-center text-caption text-success">
              The coach thinks there’s enough to run a diagnosis.
            </p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// ── Diagnosis step ──────────────────────────────────────────────────────────
function DiagnosisStep({ diagnosis, rubric }: { diagnosis: Diagnosis; rubric: Rubric }) {
  const labelOf = (key: string) =>
    rubric.competencies.find((c) => c.key === key)?.label ?? key;

  const axes: SpiderAxis[] = diagnosis.axes.map((a) => ({
    label: labelOf(a.competency_key),
    current: a.state === 'insufficient' ? null : a.current_level,
    target: a.target_level,
    insufficient: a.state === 'insufficient',
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Readiness for {rubric.role_title}</CardTitle>
        </CardHeader>
        <CardContent>
          <SpiderChart axes={axes} />
        </CardContent>
      </Card>

      {diagnosis.gate.mode !== 'sufficient' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {diagnosis.gate.mode === 'need_info'
                ? 'I need a bit more to be confident'
                : 'A few readings are possible — your call'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diagnosis.gate.mode === 'need_info' &&
              diagnosis.gate.requested.map((r, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <p className="text-body font-medium text-foreground">{r.info_type}</p>
                  <p className="text-caption text-muted-foreground">{r.why}</p>
                </div>
              ))}
            {diagnosis.gate.mode === 'choose' &&
              diagnosis.gate.candidates.map((c, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <p className="text-body font-medium text-foreground">{c.label}</p>
                  <p className="text-caption text-muted-foreground">{c.description}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Development areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {diagnosis.development_areas.map((d, i) => (
            <div key={i} className="flex items-start gap-3 rounded-md border border-border p-3">
              <Badge variant="default">{d.lens}</Badge>
              <div>
                <p className="text-body font-medium text-foreground">{d.title}</p>
                <p className="text-caption text-muted-foreground">{d.summary}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
