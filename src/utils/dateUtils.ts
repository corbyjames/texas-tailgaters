/**
 * Utility functions for date handling
 */

/**
 * Check if a game date is today or in the future
 * Compares dates only, ignoring time components to avoid timezone issues
 * @param gameDate - The date string from the game object (e.g., "2025-08-30")
 * @returns true if the game is today or in the future, false if it's in the past
 */
export function isGameUpcoming(gameDate: string): boolean {
  // Create date objects
  const game = new Date(gameDate + 'T12:00:00'); // Set to noon to avoid timezone issues
  const today = new Date();
  
  // Reset both to start of day for comparison
  game.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return game >= today;
}

/**
 * Get today's date at midnight for comparisons
 */
export function getTodayMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Parse a game date string to a Date object at midnight
 * @param gameDate - The date string (e.g., "2025-08-30")
 */
export function parseGameDate(gameDate: string): Date {
  const date = new Date(gameDate + 'T12:00:00'); // Set to noon to avoid timezone issues
  date.setHours(0, 0, 0, 0);
  return date;
}