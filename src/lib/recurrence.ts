export type Frequency =
  | "semanal"
  | "quinzenal"
  | "mensal"
  | "bimestral"
  | "trimestral"
  | "semestral"
  | "anual";

export type FrequencyOption = {
  value: Frequency;
  label: string;
  /** Passo em dias (semanal/quinzenal) ou em meses (o resto). Só um dos dois. */
  days?: number;
  months?: number;
  /** Quantos lançamentos fazem sentido por padrão para esta frequência. */
  defaultCount: number;
};

export const FREQUENCIES: FrequencyOption[] = [
  { value: "semanal", label: "Semanal", days: 7, defaultCount: 12 },
  { value: "quinzenal", label: "Quinzenal", days: 14, defaultCount: 12 },
  { value: "mensal", label: "Mensal", months: 1, defaultCount: 12 },
  { value: "bimestral", label: "Bimestral", months: 2, defaultCount: 6 },
  { value: "trimestral", label: "Trimestral", months: 3, defaultCount: 4 },
  { value: "semestral", label: "Semestral", months: 6, defaultCount: 4 },
  { value: "anual", label: "Anual", months: 12, defaultCount: 3 },
];

export const FREQUENCY_VALUES = FREQUENCIES.map((f) => f.value);

/** Um lançamento avulso continua sendo o padrão. */
export const NO_RECURRENCE = "unica";

/** Teto de lançamentos gerados de uma vez — protege o banco e o usuário. */
export const MAX_OCCURRENCES = 60;
export const MIN_OCCURRENCES = 2;

const byValue = new Map<string, FrequencyOption>(FREQUENCIES.map((f) => [f.value, f]));

export function isFrequency(value: string): value is Frequency {
  return byValue.has(value);
}

export function frequencyLabel(value: string) {
  return byValue.get(value)?.label ?? value;
}

export function defaultCountFor(value: string) {
  return byValue.get(value)?.defaultCount ?? 12;
}

function daysInMonth(year: number, month: number) {
  // month é 1-12; o dia 0 do mês seguinte é o último deste.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Soma meses preservando o dia do mês, encurtando para o último dia quando ele
 * não existe: 31/01 + 1 mês = 28/02 (ou 29/02 em ano bissexto). O cálculo parte
 * sempre da data original, então 31/01 + 2 meses volta a ser 31/03 — sem a
 * "erosão" que acontece quando se soma mês a mês.
 */
export function addMonths(isoDate: string, months: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const total = (year * 12 + (month - 1)) + months;
  const nextYear = Math.floor(total / 12);
  const nextMonth = (total % 12) + 1;
  return toISO(nextYear, nextMonth, Math.min(day, daysInMonth(nextYear, nextMonth)));
}

export function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Data da n-ésima ocorrência (n = 0 é a própria data inicial). */
export function occurrenceDate(startISO: string, frequency: Frequency, n: number) {
  const option = byValue.get(frequency);
  if (!option || n === 0) return startISO;
  return option.months
    ? addMonths(startISO, option.months * n)
    : addDays(startISO, (option.days ?? 0) * n);
}

/** Todas as datas da série, incluindo a inicial. */
export function seriesDates(startISO: string, frequency: Frequency, count: number) {
  const total = Math.min(Math.max(count, 1), MAX_OCCURRENCES);
  return Array.from({ length: total }, (_, i) => occurrenceDate(startISO, frequency, i));
}

/** Normaliza a quantidade pedida para dentro dos limites aceitos. */
export function clampCount(count: number) {
  if (!Number.isFinite(count)) return MIN_OCCURRENCES;
  return Math.min(Math.max(Math.trunc(count), MIN_OCCURRENCES), MAX_OCCURRENCES);
}
