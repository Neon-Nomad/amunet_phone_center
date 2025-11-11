type MetricTags = Record<string, string>;

export const metrics = {
  increment(name: string, tags?: MetricTags) {
    // No-op placeholder, swap in StatsD/Prometheus client as needed.
    return;
  }
};
