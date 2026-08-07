export function tzDateToTimeSpan(tzdate: string): number {
  // tzdate is either in format 'yyyy-MM-dd' or 'yyyy-MM-dd ∓hh:mm'
  const date = Date.parse(tzdate.replace(' ', 'T00:00:00'));
  return Date.now() - date;
}

export function tzDateIsToday(tzdate: string): boolean {
  const ts = tzDateToTimeSpan(tzdate);
  return ts < 1000 * 60 * 60 * 24;
}

export function tzDateToDaysAgo(tzdate: string): string {
  // Find the number of days since this usage
  const ddiff = Math.floor(tzDateToTimeSpan(tzdate) / (1000 * 60 * 60 * 24));
  if(ddiff <= 0) return "today";
  if(ddiff == 1) return "yesterday";
  else return `${ddiff} days ago`;
}