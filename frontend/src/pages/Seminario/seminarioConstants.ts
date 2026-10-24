export type SeminarioFilter = 'todos' | 'seminario' | 'instituto' | 'risco' | 'pendencia' | 'credito';

export const SEMINARIO_FILTERS: { key: SeminarioFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'seminario', label: 'Seminário' },
  { key: 'instituto', label: 'Instituto' },
  { key: 'risco', label: 'Em risco' },
  { key: 'pendencia', label: 'Pendência' },
  { key: 'credito', label: 'Crédito' },
];
