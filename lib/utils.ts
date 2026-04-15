import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the billing cycle range (from 25th of month to 24th of next month).
 * This logic matches the Dashboard page.
 * @param date A date within the start month of the cycle.
 */
export function getBillingCycleRange(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const from = new Date(year, month, 25, 0, 0, 0, 0);
  const to = new Date(year, month + 1, 24, 23, 59, 59, 999);
  
  return { from, to };
}
