#!/bin/bash
# Lighthouse CI Performance Gate
# Fails build if Lighthouse score drops below thresholds
# Usage: ./scripts/lighthouse-ci.sh [port]

set -e

PORT="${1:-3000}"
BASE_URL="http://localhost:$PORT"
CHROME=/home/sri/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome
REPORT_DIR="test-results/lighthouse"
REPORT_BASE="$REPORT_DIR/report"
PASS_THRESHOLD=90
WARN_THRESHOLD=50
# Dev mode thresholds (looser — dev server overhead)
DEV_TBT_THRESHOLD=2000
DEV_TTI_THRESHOLD=20000
# Production thresholds (strict)
PROD_TBT_THRESHOLD=600
PROD_TTI_THRESHOLD=5000

mkdir -p "$REPORT_DIR"

echo "=== Lighthouse CI Performance Gate ==="
echo "Target: $BASE_URL"
echo "Pass threshold: $PASS_THRESHOLD%"
echo "Warn threshold: $WARN_THRESHOLD%"
echo ""

# Wait for server to be ready
echo "Waiting for server on port $PORT..."
for i in $(seq 1 30); do
  if curl -s "$BASE_URL" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Run Lighthouse
echo "Running Lighthouse audit..."
CHROME_PATH=$CHROME npx lighthouse "$BASE_URL" \
  --output=json \
  --output=html \
  --output-path="$REPORT_DIR/report" \
  --chrome-flags="--disable-gpu --no-sandbox --headless=new" \
  --form-factor=mobile \
  --throttling.cpu-throttling=4 \
  --throttling.rtt-mLatency=40 \
  --throttling.download-throughput=1000000 \
  --throttling.upload-throughput=500000 \
  --quiet 2>/dev/null

# Evaluate scores
python3 << PYEOF
import json, sys, os

import glob
report_path = glob.glob("$REPORT_BASE" + "*")[0]
html_path = glob.glob("$REPORT_BASE" + "*")[0]
for p in glob.glob("$REPORT_BASE" + "*"):
    if p.endswith(".json"): report_path = p
    elif p.endswith(".html"): html_path = p

with open(report_path) as f:
    data = json.load(f)

categories = data.get('categories', {})
audits = data.get('audits', {})

results = []
errors = []

for name, cat in categories.items():
    score = cat.get('score', 0) or 0
    pct = int(score * 100)
    if pct < $WARN_THRESHOLD:
        results.append(f"FAIL {name}: {pct}%")
        errors.append(f"{name} score {pct}% below warn threshold ({$WARN_THRESHOLD}%)")
    elif pct < $PASS_THRESHOLD:
        results.append(f"WARN {name}: {pct}%")
    else:
        results.append(f"PASS {name}: {pct}%")

# Check key metrics
is_dev = '$PORT' == '3000' or '$PORT' == '3001'
tbt_threshold = $DEV_TBT_THRESHOLD if is_dev else $PROD_TBT_THRESHOLD
tti_threshold = $DEV_TTI_THRESHOLD if is_dev else $PROD_TTI_THRESHOLD
key_metrics = {
    'first-contentful-paint': 2000,
    'largest-contentful-paint': 4000,
    'speed-index': 2000,
    'total-blocking-time': tbt_threshold,
    'cumulative-layout-shift': 0.1,
    'interactive': tti_threshold,
}

for metric, threshold in key_metrics.items():
    if metric in audits:
        a = audits[metric]
        val = a.get('numericValue', 0) or 0
        if val > threshold:
            results.append(f"FAIL {metric}: {val:.0f}ms (threshold: {threshold}ms)")
            errors.append(f"{metric} exceeded threshold: {val:.0f}ms > {threshold}ms")
        else:
            results.append(f"PASS {metric}: {val:.0f}ms")

print("\n=== RESULTS ===")
for r in results:
    print(f"  {r}")

if errors:
    print("\n=== ERRORS ===")
    for e in errors:
        print(f"  - {e}")
    print(f"\nBuild FAILED: {len(errors)} performance threshold(s) exceeded")
    sys.exit(1)
else:
    print("\nAll thresholds passed")
    print(f"HTML report: {html_path.replace('.json', '.html')}")
PYEOF
