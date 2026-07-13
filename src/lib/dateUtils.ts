/**
 * Returns the current date string in YYYY-MM-DD format adjusted to
 * Pakistan Standard Time (PKT = UTC+5).
 * Using toISOString() would give UTC date which is 5 hours behind PKT.
 */
export const getPKTDateString = (): string => {
  const now = new Date();
  // Shift time to PKT (UTC+5)
  const pktOffset = 5 * 60; // minutes
  const utcMinutes = now.getTime() / 60000;
  const pktDate = new Date((utcMinutes + pktOffset) * 60000);
  return pktDate.toISOString().split('T')[0];
};

/**
 * Returns the current datetime string in ISO format adjusted to PKT.
 */
export const getPKTISOString = (): string => {
  const now = new Date();
  const pktOffset = 5 * 60 * 60 * 1000; // 5 hours in ms
  return new Date(now.getTime() + pktOffset).toISOString().replace('Z', '+05:00');
};
