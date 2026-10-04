export type Award = {
  id: string;
  title: string;
  recipient: string;
  year: number;
  summary: string;
};

/** Granted awards only. Leave this empty until a real award exists. */
export const awards: Award[] = [];
