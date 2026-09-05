import fs from "node:fs";

const baselines = Array.from({ length: 20 }, (_, index) => (30 + index) / 10);
const reviewCounts = [10, 20, 50, 100, 200, 500, 1000];
const declineThresholds = [0.1, 0.2, 0.5];
const header = [
  "baseline_exact_average",
  "starting_review_count",
  "incoming_rating",
  "decline_threshold",
  "minimum_incoming_ratings",
  "resulting_exact_average",
  "actual_decline",
  "formula_version",
].join(",");

const lines = [header];
for (const baseline of baselines) {
  for (const startingCount of reviewCounts) {
    for (const declineThreshold of declineThresholds) {
      const denominator = baseline - 1 - declineThreshold;
      const minimumRatings = Math.ceil(
        (declineThreshold * startingCount) / denominator - 1e-12,
      );
      const resultingAverage =
        (baseline * startingCount + minimumRatings) /
        (startingCount + minimumRatings);
      const actualDecline = baseline - resultingAverage;
      const previousAverage =
        minimumRatings === 1
          ? baseline
          : (baseline * startingCount + minimumRatings - 1) /
            (startingCount + minimumRatings - 1);

      if (
        actualDecline + 1e-10 < declineThreshold ||
        (minimumRatings > 1 && baseline - previousAverage >= declineThreshold - 1e-10)
      ) {
        throw new Error(
          `Threshold validation failed for R=${baseline}, N=${startingCount}, d=${declineThreshold}`,
        );
      }

      lines.push(
        [
          baseline.toFixed(1),
          startingCount,
          1,
          declineThreshold.toFixed(1),
          minimumRatings,
          resultingAverage.toFixed(6),
          actualDecline.toFixed(6),
          "RRI-1.0",
        ].join(","),
      );
    }
  }
}

const generated = `${lines.join("\n")}\n`;
if (process.argv.includes("--print")) {
  process.stdout.write(generated);
} else {
  const checkedIn = fs.readFileSync(
    new URL("./google-review-rating-resilience.csv", import.meta.url),
    "utf8",
  );
  if (generated.replace(/\r\n/g, "\n") !== checkedIn.replace(/\r\n/g, "\n")) {
    throw new Error("The checked-in CSV does not match the published method.");
  }
  console.log(`Verified ${lines.length - 1} rating-resilience scenarios.`);
}
