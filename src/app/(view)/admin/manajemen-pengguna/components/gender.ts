export type GenderLabel = 'Pria' | 'Wanita';

export const getGenderLabel = (value?: string): GenderLabel | '' => {
  const upper = (value || '').trim().toUpperCase();
  if (upper.startsWith('P')) return 'Pria';
  if (upper.startsWith('W')) return 'Wanita';
  return '';
};

export const matchesGenderFilter = (value: string, filter: GenderLabel | 'ALL') => {
  if (filter === 'ALL') return true;
  return getGenderLabel(value) === filter;
};
