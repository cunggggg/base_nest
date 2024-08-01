export class DateHelper {
  /**
   * get Date before n days
   */
  public static beforeNDay(date: Date, n: number): Date {
    const d = new Date(date.getTime());
    d.setDate(date.getDate() - n);
    return d;
  }

  /**
   * get Date after n days
   */
  public static afterNDay(date: Date, n: number): Date {
    const d = new Date(date.getTime());
    d.setDate(date.getDate() + n);
    return d;
  }

  /**
   * check current is after or not a datetime
   */
  public static checkIsCurrentAfter(date: Date, n = 0): boolean {
    const beforeNDay = n === 0 ? date : DateHelper.beforeNDay(date, n);
    return new Date() >= beforeNDay;
  }

  /**
   * Remove second and millisecond
   */
  public static removeSecond(date: Date): Date {
    date.setSeconds(0, 0);
    return date;
  }
}
