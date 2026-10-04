export type InformationSession = {
  id: string;
  date: string;
  label: string;
  time: "7:00–8:00 PM ET";
};

/** Public session list. Meet links are not included; the API returns one only after an RSVP. */
export const informationSessions: InformationSession[] = [
  {
    id: "2026-11-20",
    date: "2026-11-20",
    label: "Friday, November 20, 2026",
    time: "7:00–8:00 PM ET",
  },
  {
    id: "2026-12-18",
    date: "2026-12-18",
    label: "Friday, December 18, 2026",
    time: "7:00–8:00 PM ET",
  },
  {
    id: "2027-01-22",
    date: "2027-01-22",
    label: "Friday, January 22, 2027",
    time: "7:00–8:00 PM ET",
  },
];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export function weekdayOf(isoDate: string): (typeof WEEKDAYS)[number] {
  const [year, month, day] = isoDate.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

export function sessionOn(isoDate: string): InformationSession | undefined {
  return informationSessions.find((session) => session.date === isoDate);
}

export type CalendarCell = { date: string; inMonth: boolean };

/** Sunday-start month grid. `month` is 1–12. Empty dates pad the first week. */
export function monthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: CalendarCell[] = [];
  for (let index = 0; index < first.getUTCDay(); index += 1) {
    cells.push({ date: "", inMonth: false });
  }
  for (let day = 1; day <= days; day += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ date, inMonth: true });
  }
  return cells;
}
