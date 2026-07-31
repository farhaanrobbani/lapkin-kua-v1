import { useEffect, useState } from 'react';

export function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const start = currentYear - 4;
  const end = currentYear + 5;
  const years: number[] = [];
  for (let y = start; y <= end; y++) {
    years.push(y);
  }
  return years;
}

function mergeYears(...lists: number[][]): number[] {
  const set = new Set<number>();
  lists.forEach(list => list.forEach(y => set.add(y)));
  return Array.from(set).sort((a, b) => a - b);
}

let cachedDataYears: number[] | null = null;
let cachePromise: Promise<number[]> | null = null;

async function fetchDataYears(token?: string | null): Promise<number[]> {
  if (cachedDataYears) return cachedDataYears;
  if (!cachePromise) {
    cachePromise = fetch('/api/meta/years', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => (res.ok ? res.json() : { years: [] }))
      .then(json => {
        const years = Array.isArray(json.years) ? json.years.map(Number).filter(n => !isNaN(n)) : [];
        cachedDataYears = years;
        return years;
      })
      .catch(() => {
        cachedDataYears = [];
        return cachedDataYears;
      });
  }
  return cachePromise;
}

export function useYearOptions(token?: string | null): number[] {
  const [dataYears, setDataYears] = useState<number[]>(cachedDataYears || []);

  useEffect(() => {
    let mounted = true;
    if (token) {
      fetchDataYears(token).then(years => {
        if (mounted) setDataYears(years);
      });
    }
    return () => {
      mounted = false;
    };
  }, [token]);

  return mergeYears(getYearOptions(), dataYears);
}
