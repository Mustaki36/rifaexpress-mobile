
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseDrawDate = (dateInput: string | Date | Timestamp | null | undefined): Date => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  if (!dateInput) {
    return now;
  }

  let dateString: string;

  if (typeof dateInput === 'object' && dateInput !== null) {
    if ('toDate' in dateInput && typeof (dateInput as any).toDate === 'function') {
      // It's a Firestore Timestamp
      dateString = (dateInput as Timestamp).toDate().toISOString().split('T')[0];
    } else if (dateInput instanceof Date) {
      // It's a Date object
      dateString = dateInput.toISOString().split('T')[0];
    } else {
        return now; // Unsupported object type
    }
  } else if (typeof dateInput === 'string') {
    dateString = dateInput;
  } else {
    return now; // Unsupported type
  }

  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return now; // Invalid string format
  }

  const [year, month, day] = parts;
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return now; // Invalid date components
  }

  const date = new Date(year, month - 1, day);
  date.setHours(23, 59, 59, 999);
  return date;
};
