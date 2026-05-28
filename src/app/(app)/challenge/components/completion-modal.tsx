'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ActiveChallenge } from '../types';
import { parResult, formatElapsed } from '../utils';
import { createClient } from '@/lib/supabase/client';

interface Props {
  active: ActiveChallenge;
  /** Seconds the run took — recorded + compared against par on completion. */
  finalElapsed?: number;
  onClose: () => void;
  onDone: () => void;
}

export function CompletionModal({ active, finalElapsed, onClose, onDone }: Props) {
  const [note, setNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const canSubmit = !active.requiresProof || proofFile !== null;

  const elapsedSeconds = finalElapsed ?? null;
  const par = active.targetSeconds != null && elapsedSeconds != null
    ? parResult(elapsedSeconds, active.targetSeconds)
    : null;

  async function handleSubmit() {
    setUploading(true);
    setError('');
    try {
      let proof_url: string | null = null;

      if (proofFile) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const ext = proofFile.name.split('.').pop() ?? 'jpg';
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('challenge-proofs')
          .upload(path, proofFile, { upsert: false });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('challenge-proofs').getPublicUrl(path);
        proof_url = publicUrl;
      }

      const res = await fetch('/api/challenge/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: active.challengeId,
          proof_url,
          note: note || null,
          elapsed_seconds: elapsedSeconds,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');

      // Emit streak event — best-effort, never blocks completion
      // CROSS-APP: feeds HolyFlex streak surface when wired
      try {
        const { emitStreakEvent } = await import('@/lib/streak-emit');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        await emitStreakEvent({
          user_id: user?.id ?? 'unknown',
          action_id: 'challenge_completed',
          source: 'whatscooking',
          timestamp: new Date().toISOString(),
          metadata: { challenge_id: active.challengeId, title: active.title },
        });
      } catch { /* streak emit is best-effort */ }

      // Celebrate, then let the parent clear the run + refresh.
      setUploading(false);
      setCelebrating(true);
      setTimeout(onDone, 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setUploading(false);
    }
  }

  if (celebrating) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(9,9,8,0.92)', backdropFilter: 'blur(10px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <motion.div
          initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 14 }}
          style={{ fontSize: 84 }}
        >
          {active.emoji}
        </motion.div>
        <motion.h2
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', color: '#EFE3CE', fontSize: 26, margin: '14px 0 4px' }}
        >
          Challenge Complete!
        </motion.h2>
        {par ? (
          <motion.p
            initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
            style={{ color: par.beat ? '#7abd7a' : '#F2A900', fontSize: 16, fontWeight: 700, margin: 0 }}
          >
            {par.label}
          </motion.p>
        ) : elapsedSeconds != null ? (
          <motion.p
            initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
            style={{ color: '#A08060', fontSize: 15, margin: 0, fontFamily: 'var(--font-geist-mono, monospace)' }}
          >
            Done in {formatElapsed(elapsedSeconds)}
          </motion.p>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(9,9,8,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-secondary,#171716)',
        border: '1px solid var(--border-primary,#272726)',
        borderRadius: 20, padding: 28, maxWidth: 420, width: '100%',
      }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>{active.emoji}</div>
        <h2 style={{ color: 'var(--rc-title,#EFE3CE)', textAlign: 'center', marginBottom: 4, fontSize: 18 }}>
          Challenge Complete!
        </h2>
        <p style={{ color: 'var(--rc-meta,#A08060)', textAlign: 'center', fontSize: 13, marginBottom: par || elapsedSeconds != null ? 10 : 20 }}>
          {active.title}
        </p>
        {par ? (
          <p style={{
            textAlign: 'center', fontSize: 14, fontWeight: 700, marginBottom: 18,
            color: par.beat ? '#7abd7a' : '#F2A900',
          }}>
            {par.label}
          </p>
        ) : elapsedSeconds != null ? (
          <p style={{
            textAlign: 'center', fontSize: 13, marginBottom: 18, color: '#A08060',
            fontFamily: 'var(--font-geist-mono, monospace)',
          }}>
            ⏱ {formatElapsed(elapsedSeconds)}
          </p>
        ) : null}

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: 'var(--fg-secondary,#e7e7e6)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            {active.requiresProof ? '📸 Proof (required)' : '📸 Add proof photo (optional)'}
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4"
            style={{ display: 'none' }}
            onChange={e => setProofFile(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', padding: '10px', borderRadius: 10, cursor: 'pointer',
              background: proofFile ? '#1a2e1a' : 'var(--bg-tertiary,#1f1f1e)',
              border: `1px solid ${proofFile ? '#3a5020' : 'var(--border-primary,#272726)'}`,
              color: proofFile ? '#7abd7a' : 'var(--fg-tertiary,#9c9c9b)',
              fontSize: 12,
            }}
          >
            {proofFile ? `✓ ${proofFile.name}` : 'Choose file…'}
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: 'var(--fg-secondary,#e7e7e6)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Add a note (optional)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="How did it go?"
            rows={2}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10, resize: 'none' as const,
              background: 'var(--bg-tertiary,#1f1f1e)', border: '1px solid var(--border-primary,#272726)',
              color: 'var(--fg-primary,#fff)', fontSize: 13, boxSizing: 'border-box' as const,
            }}
          />
        </div>

        {error && <p style={{ color: '#e07a7a', fontSize: 12, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border-primary,#272726)',
              color: 'var(--fg-secondary,#e7e7e6)', fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || uploading}
            style={{
              flex: 2, padding: '11px', borderRadius: 10, cursor: canSubmit ? 'pointer' : 'not-allowed',
              background: canSubmit ? '#F4A261' : '#3A3430', color: canSubmit ? '#0d0d0c' : '#9c9c9b',
              border: 'none', fontWeight: 700, fontSize: 14,
            }}
          >
            {uploading ? 'Saving…' : '🎉 Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
