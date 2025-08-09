
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseDrawDate = (dateInput: string | Date | Timestamp | null | undefined): Date => {
  if (!dateInput) {
    // Return the current date if input is null or undefined
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
  }

  let date: Date;

  // Handle Firestore Timestamp
  if (typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
    date = (dateInput as Timestamp).toDate();
  } 
  // Handle Date object
  else if (dateInput instanceof Date) {
    date = dateInput;
  }
  // Handle string 'YYYY-MM-DD'
  else if (typeof dateInput === 'string') {
    const [year, month, day] = dateInput.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
       const now = new Date();
       now.setHours(23, 59, 59, 999);
       return now;
    }
    date = new Date(year, month - 1, day);
  }
  // Fallback for any other unexpected type
  else {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
  }

  // Set time to the end of the day
  date.setHours(23, 59, 59, 999);
  return date;
};
