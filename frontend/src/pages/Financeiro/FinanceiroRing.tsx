import React from 'react';
import { StatusKey } from './financeiroConstants';

interface FinanceiroRingProps {
  pct: number;
  st: StatusKey;
  txt?: string;
}

export const FinanceiroRing: React.FC<FinanceiroRingProps> = ({ pct, st, txt }) => {
  const r = 24;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, pct || 0));
  const dash = (v / 100) * c;

  return (
    <svg className="ring" width="50" height="50" viewBox="0 0 62 62" aria-hidden="true">
      <circle className="rg-t" cx="31" cy="31" r={r} />
      <circle
        className={`rg-a b-${st}`}
        cx="31"
        cy="31"
        r={r}
        strokeDasharray={`${dash.toFixed(1)} ${c.toFixed(1)}`}
        transform="rotate(-90 31 31)"
      />
      <text x="31" y="35" textAnchor="middle" className="rg-x" dominantBaseline="middle">
        {txt || `${Math.round(pct || 0)}%`}
      </text>
    </svg>
  );
};
