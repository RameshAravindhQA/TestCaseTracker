import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a file size in bytes to a human readable format
 * @param bytes File size in bytes
 * @returns Formatted file size string (e.g., '2.5 MB')
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format a date into a human-readable string
 * @param date Date to format
 * @returns Formatted date string (e.g., 'Apr 30, 2025')
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Get file extension from a filename
 * @param filename Filename including extension
 * @returns File extension without the dot (e.g., 'pdf')
 */
export function getFileExtension(filename: string): string {
  if (!filename) return '';
  
  // Handle files with periods in the name correctly
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return ''; // No extension
  
  // Extract extension and convert to lowercase for consistent handling
  return filename.substring(lastDotIndex + 1).toLowerCase();
}

/**
 * Get file type category based on extension
 * @param extension File extension
 * @returns File type category (image, document, spreadsheet, etc.)
 */
export function getFileTypeCategory(extension: string): string {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'];
  const spreadsheetExtensions = ['xls', 'xlsx', 'csv'];
  const presentationExtensions = ['ppt', 'pptx'];
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
  
  extension = extension.toLowerCase();
  
  if (imageExtensions.includes(extension)) {
    return 'image';
  } else if (documentExtensions.includes(extension)) {
    return 'document';
  } else if (spreadsheetExtensions.includes(extension)) {
    return 'spreadsheet';
  } else if (presentationExtensions.includes(extension)) {
    return 'presentation';
  } else if (archiveExtensions.includes(extension)) {
    return 'archive';
  } else {
    return 'other';
  }
}
