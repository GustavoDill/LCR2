import React from 'react';
import { money, kfmt } from './financeiroUtils';

interface FinanceiroDonutProps {
  recebido: number;
  gasto: number;
  saldo: number;
}

export const FinanceiroDonut: React.FC<FinanceiroDonutProps> = ({ recebido, gasto, saldo }) => {
  const r = 58;
  const c = 2 * Math.PI * r;
  const tot = Math.max(recebido, gasto, 1);
  const g = Math.min(gasto, tot) / tot;
  const ex = saldo < 0;
  const ga = (g * c).toFixed(1);
  const sa = ((1 - g) * c).toFixed(1);

  return (
    <svg width="160" height="160" viewBox="0 0 170 170" role="img" aria-label={`Gasto ${money(gasto)} e saldo ${money(saldo)}`}>
      <circle className="rg-t" cx="85" cy="85" r={r} style={{ strokeWidth: 20 }} />
      <circle
        className={`b-${ex ? 'crit' : 'norm'}`}
        cx="85"
        cy="85"
        r={r}
        fill="none"
        style={{ strokeWidth: 20 }}
        strokeDasharray={`${ga} ${c.toFixed(1)}`}
        transform="rotate(-90 85 85)"
      >
        <title>Gasto {money(gasto)}</title>
      </circle>
      {!ex && (
        <circle
          className="b-bom"
          cx="85"
          cy="85"
          r={r}
          fill="none"
          style={{ strokeWidth: 20 }}
          strokeDasharray={`${sa} ${c.toFixed(1)}`}
          strokeDashoffset={`-${ga}`}
          transform="rotate(-90 85 85)"
        >
          <title>Saldo {money(saldo)}</title>
        </circle>
      )}
      <text x="85" y="78" textAnchor="middle" className="dn-l">recebido</text>
      <text x="85" y="100" textAnchor="middle" className="dn-v">{kfmt(recebido)}</text>
    </svg>
  );
};
