import { ratingPlan } from './review-rating-model.mjs';

const form = document.getElementById('ratingCalculator');
const result = document.getElementById('calculatorResult');
const share = document.getElementById('shareCalculation');
const shareStatus = document.getElementById('shareStatus');
const controls = ['currentRating', 'reviewCount', 'targetRating', 'ratingSource', 'method'];
const format = value => Number.isFinite(value) ? value.toLocaleString('en-CA') : 'no finite number';

function calculate() {
  share.hidden = true;
  shareStatus.textContent = '';
  const headline = document.createElement('strong');
  const detail = document.createElement('span');
  try {
    const plan = ratingPlan({
      current: Number(form.elements.currentRating.value), count: Number(form.elements.reviewCount.value),
      target: Number(form.elements.targetRating.value), source: form.elements.ratingSource.value,
      method: form.elements.method.value
    });
    const range = plan.minimum === plan.maximum ? format(plan.minimum) : `${format(plan.minimum)} to ${format(plan.maximum)}`;
    headline.textContent = `${range} additional 5-star reviews`;
    if (plan.minimum === Infinity) headline.textContent = 'No finite number reaches an exact 5.0';
    else if (plan.maximum === Infinity) headline.textContent = '0 if already exactly 5.0; otherwise no finite number';
    detail.textContent = plan.source === 'displayed'
      ? `The possible starting averages in this model run from ${plan.minAverage.toFixed(4)} to ${plan.maxAverage.toFixed(4)}. The lower result starts from the highest possible average; the upper result covers the lowest. `
      : `This treats ${form.elements.currentRating.value} as the exact starting average. `;
    detail.textContent += plan.method === 'display'
      ? `The target uses a conventional rounding threshold of ${plan.threshold.toFixed(2)}, not a confirmed Google display rule.`
      : 'The target requires the exact average to reach the entered value.';
    result.replaceChildren(headline, detail);
    share.hidden = false;
    return true;
  } catch (error) {
    headline.textContent = 'Check the entries';
    detail.textContent = error.message;
    result.replaceChildren(headline, detail);
    return false;
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  calculate();
});
form.addEventListener('input', () => {
  share.hidden = true;
  shareStatus.textContent = '';
  result.replaceChildren(Object.assign(document.createElement('span'), { textContent: 'Inputs changed. Calculate again to update your result.' }));
});
share.addEventListener('click', async () => {
  const parameters = new URLSearchParams();
  for (const name of controls) parameters.set(name, form.elements[name].value);
  const url = new URL('https://reviewsboost.ca/google-review-calculator.html');
  url.hash = 'plan=' + parameters.toString();
  try {
    await navigator.clipboard.writeText(url.href);
    shareStatus.textContent = 'Calculation link copied.';
  } catch {
    const link = document.createElement('a');
    link.href = url.href;
    link.textContent = 'Open or copy this calculation link';
    shareStatus.replaceChildren(link);
  }
});
function restorePlan() {
  if (!location.hash.startsWith('#plan=')) return;
  const parameters = new URLSearchParams(location.hash.slice(6));
  for (const name of controls) {
    if (parameters.has(name)) form.elements[name].value = parameters.get(name);
  }
  calculate();
}
window.addEventListener('hashchange', restorePlan);
restorePlan();
