/**
 * Convert seconds to the most appropriate time unit
 * Automatically selects: seconds, minutes, hours, days, weeks, or months
 *
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string with appropriate unit
 */
export function formatSeconds(seconds) {
  if (!seconds || seconds === 0) return '0 seconds'

  const sec = Number(seconds)

  // Seconds: < 60 seconds
  if (sec < 60) {
    return `${Math.round(sec)} second${sec !== 1 ? 's' : ''}`
  }

  // Minutes: < 1 hour (3600 seconds)
  if (sec < 3600) {
    const minutes = Math.round(sec / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  // Hours: < 24 hours (86400 seconds)
  if (sec < 86400) {
    const hours = Math.round(sec / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  // Days: < 7 days (604800 seconds)
  if (sec < 604800) {
    const days = Math.round(sec / 86400)
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  // Weeks: < 30 days (2592000 seconds)
  if (sec < 2592000) {
    const weeks = Math.round(sec / 604800)
    return `${weeks} week${weeks !== 1 ? 's' : ''}`
  }

  // Months: >= 30 days (2592000 seconds)
  const months = (sec / 2592000).toFixed(2)
  const monthsNum = Number(months)
  return `${months} month${monthsNum !== 1 ? 's' : ''}`
}
