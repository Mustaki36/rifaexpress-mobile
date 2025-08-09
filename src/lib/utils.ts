import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseDrawDate = (dateInput: string | Date | null | undefined): Date | null => {
  if (!dateInput) return null;

  let dateString = dateInput;

  // Si es Date, lo pasamos a string
  if (dateInput instanceof Date) {
    dateString = dateInput.toISOString().split('T')[0];
  }

  // Si no es string, lo convertimos a string
  if (typeof dateString !== 'string') {
    dateString = String(dateString);
  }

  // Ahora sí hacemos el split
  const [year, month, day] = dateString.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null; // Devolver null si la fecha no es válida
  }

  return new Date(year, month - 1, day, 23, 59, 59, 999);
};
