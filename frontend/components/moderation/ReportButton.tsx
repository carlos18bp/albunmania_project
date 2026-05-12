'use client';

import { useState } from 'react';

import type { ReportTargetKind } from '@/lib/stores/reportStore';
import ReportModal from './ReportModal';

type Props = {
  targetKind: ReportTargetKind;
  targetId: number;
  /** Human label, e.g. "a este coleccionista" / "este intercambio". */
  targetLabel: string;
  label?: string;
};

export default function ReportButton({ targetKind, targetId, targetLabel, label }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-testid="report-button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground underline hover:text-destructive"
      >
        {label ?? `Reportar ${targetLabel}`}
      </button>
      {open && (
        <ReportModal
          targetKind={targetKind}
          targetId={targetId}
          targetLabel={targetLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
