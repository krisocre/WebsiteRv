// Rounding model v1: equal-weight integer stars and conventional half-up rounding.
// This models arithmetic, not Google's unpublished display implementation.
export function ratingPlan({ current, count, target, source = 'displayed', method = 'exact' }) {
  if (![current, count, target].every(Number.isFinite) || current < 1 || current > 5 ||
      !Number.isInteger(count) || count < 1 || count > 10000000 || target <= 1 || target > 5 ||
      !['displayed', 'exact'].includes(source) || !['exact', 'display'].includes(method)) {
    throw new Error('Use ratings from 1.0 to 5.0, a target above 1.0, and a whole review count from 1 to 10,000,000.');
  }
  let minPoints = current * count;
  let maxPoints = minPoints;
  if (source === 'displayed') {
    const tenths = Math.round(current * 10);
    if (Math.abs(current * 10 - tenths) > 1e-8) throw new Error('Enter the displayed rating with one decimal place.');
    // Integer total-star bounds avoid treating a rounded public rating as exact.
    minPoints = Math.max(count, Math.ceil(count * (2 * tenths - 1) / 20));
    maxPoints = Math.min(5 * count, Math.ceil(count * (2 * tenths + 1) / 20) - 1);
    if (minPoints > maxPoints) throw new Error('This rating and count cannot occur in the selected rounding model. Recheck the visible count or use a known exact average.');
  }
  const threshold = method === 'display' ? target - 0.05 : target;
  function needed(points) {
    if (points >= threshold * count - 1e-8) return 0;
    if (threshold === 5) return Infinity;
    return Math.max(0, Math.ceil((threshold * count - points) / (5 - threshold) - 1e-8));
  }
  return {
    minimum: needed(maxPoints), maximum: needed(minPoints),
    minAverage: minPoints / count, maxAverage: maxPoints / count,
    minPoints, maxPoints, threshold, source, method
  };
}
