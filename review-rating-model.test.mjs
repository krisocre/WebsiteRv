import assert from 'node:assert/strict';
import test from 'node:test';
import { ratingPlan } from './review-rating-model.mjs';

test('rounded inputs cover every feasible total, using an independent enumeration', () => {
  for (let count = 1; count <= 100; count++) {
    const outcomes = new Map();
    for (let total = count; total <= 5 * count; total++) {
      const display = Math.floor((20 * total + count) / (2 * count)) / 10;
      let added = 0;
      // Reach an exact 4.5 by adding actual integer five-star ratings.
      while (2 * (total + 5 * added) < 9 * (count + added)) added++;
      const values = outcomes.get(display) || [];
      values.push(added);
      outcomes.set(display, values);
    }
    for (const [current, values] of outcomes) {
      const plan = ratingPlan({ current, count, target: 4.5 });
      assert.equal(plan.minimum, Math.min(...values), `${current}, ${count}: minimum`);
      assert.equal(plan.maximum, Math.max(...values), `${current}, ${count}: maximum`);
    }
  }
});

test('published examples and exact-input mode stay consistent', () => {
  for (const [count, minPoints, maxPoints, minimum, maximum] of [
    [10, 42, 42, 6, 6], [25, 104, 106, 13, 17], [50, 208, 212, 26, 34],
    [100, 415, 424, 52, 70], [250, 1038, 1062, 126, 174]
  ]) {
    const plan = ratingPlan({ current: 4.2, count, target: 4.5 });
    assert.deepEqual([plan.minPoints, plan.maxPoints, plan.minimum, plan.maximum], [minPoints, maxPoints, minimum, maximum]);
  }
  const exact = ratingPlan({ current: 4.2, count: 50, target: 4.5, source: 'exact' });
  assert.equal(exact.minimum, 30);
  assert.equal(exact.maximum, 30);
});

test('display thresholds and perfect ratings retain their distinct meanings', () => {
  const estimated = ratingPlan({ current: 4.2, count: 50, target: 4.5, method: 'display' });
  assert.equal(estimated.minimum, 20);
  assert.equal(estimated.maximum, 27);
  const impossible = ratingPlan({ current: 4.2, count: 50, target: 5 });
  assert.equal(impossible.minimum, Infinity);
  const roundedFive = ratingPlan({ current: 5, count: 100, target: 5 });
  assert.equal(roundedFive.minimum, 0);
  assert.equal(roundedFive.maximum, Infinity);
  assert.equal(ratingPlan({ current: 5, count: 100, target: 5, source: 'exact' }).maximum, 0);
});

test('invalid and impossible inputs are rejected', () => {
  for (const fields of [
    { current: 4.2, count: 2 }, { current: 4.23, count: 50 }, { current: NaN },
    { count: 0 }, { count: 1.5 }, { count: 10000001 }, { target: 6 }, { source: 'unknown' }
  ]) assert.throws(() => ratingPlan({ current: 4.2, count: 50, target: 4.5, ...fields }));
});
