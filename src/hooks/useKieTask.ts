'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

export type TaskState = 'idle' | 'waiting' | 'queuing' | 'generating' | 'success' | 'fail';

interface UseKieTaskResult {
  taskId: string | null;
  state: TaskState;
  resultUrls: string[];
  errorMsg: string;
  progress: number;
  startTask: (taskId: string) => void;
  reset: () => void;
}

export function useKieTask(onSuccess?: (urls: string[]) => void): UseKieTaskResult {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [state, setState] = useState<TaskState>('idle');
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const poll = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/poll-task?taskId=${id}`);
      const data = await res.json();
      // Fortschritt simulieren basierend auf Zeit (max 95%)
      const elapsed = (Date.now() - startTime.current) / 1000;
      const simProgress = Math.min(95, Math.round((elapsed / 120) * 100));
      setProgress(simProgress);

      if (data.state === 'success') {
        stopPolling();
        setState('success');
        setProgress(100);
        setResultUrls(data.resultUrls || []);
        onSuccess?.(data.resultUrls || []);
      } else if (data.state === 'fail') {
        stopPolling();
        setState('fail');
        setErrorMsg(data.failMsg || 'Generierung fehlgeschlagen');
      } else {
        setState(data.state as TaskState);
      }
    } catch (e) {
      console.error('Poll error:', e);
    }
  }, [stopPolling, onSuccess]);

  const startTask = useCallback((id: string) => {
    stopPolling();
    setTaskId(id);
    setState('waiting');
    setProgress(5);
    setResultUrls([]);
    setErrorMsg('');
    startTime.current = Date.now();
    intervalRef.current = setInterval(() => poll(id), 3000);
  }, [stopPolling, poll]);

  const reset = useCallback(() => {
    stopPolling();
    setTaskId(null);
    setState('idle');
    setProgress(0);
    setResultUrls([]);
    setErrorMsg('');
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { taskId, state, resultUrls, errorMsg, progress, startTask, reset };
}
