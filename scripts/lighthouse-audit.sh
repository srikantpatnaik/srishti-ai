#!/bin/bash
# Lighthouse Performance Audit for Srishti AI
# Usage: ./scripts/lighthouse-audit.sh [url] [output_dir]

URL="${1:-http://localhost:3000}"
OUTPUT_DIR="${2:-.}"
CHROME=/home/sri/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome

echo "=== Lighthouse Performance Audit ==="
echo "URL: $URL"
echo "Chrome: $CHROME"
echo ""

npx lighthouse "$URL" \
  --output=json \
  --output=html \
  --output-path="$OUTPUT_DIR/lighthouse-report" \
  --chrome-flags="--disable-gpu --no-sandbox --headless=new" \
  --form-factor=mobile \
  --throttling.cpu-throttling=4 \
  --quiet 2>/dev/null

# Extract scores for summary
python3 << PYEOF
import json, os
report_path = os.path.join("$OUTPUT_DIR", "lighthouse-report.json")
html_path = os.path.join("$OUTPUT_DIR", "lighthouse-report.html")

if not os.path.exists(report_path):
    print("ERROR: Lighthouse report not generated")
    exit(1)

with open(report_path) as f:
    data = json.load(f)

categories = data.get('categories', {})
audits = data.get('audits', {})

print("=== SCORES ===")
for name, cat in categories.items():
    score = cat.get('score', 0) or 0
    pct = int(score * 100)
    emoji = "PASS" if pct >= 90 else "WARN" if pct >= 50 else "FAIL"
    print(f"  {emoji} {name}: {pct}%")

print("\n=== KEY METRICS ===")
for key in ['first-contentful-paint', 'largest-contentful-paint', 'speed-index',
            'total-blocking-time', 'cumulative-layout-shift', 'interactive']:
    if key in audits:
        a = audits[key]
        score = a.get('score', 0) or 0
        pct = int(score * 100)
        emoji = "PASS" if pct >= 90 else "WARN" if pct >= 50 else "FAIL"
        val = a.get('displayValue', 'N/A')
        print(f"  {emoji} {key}: {val}")

print(f"\nReport saved to: {html_path}")
PYEOF
