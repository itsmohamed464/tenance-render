#!/bin/bash
# Tenance render worker (macOS). Pulls render jobs from this repo, renders them on this Mac's GPU,
# and pushes the finished MP4s + contact sheets back so the cloud session can QA and schedule them.
# Run:  caffeinate -i ./worker.sh     (keeps the Mac awake; keep it plugged in)   Stop: Ctrl+C
cd "$(dirname "$0")"
KIT=$PWD
REPO=$(git rev-parse --show-toplevel)
mkdir -p results logs v2/out jobs
echo "worker started in $KIT"
while true; do
  git -C "$REPO" pull -q --rebase --autostash || echo "pull failed, retrying later"
  git -C "$REPO" push -q 2>/dev/null
  for id in $(cat jobs/*.txt 2>/dev/null | sed 's/#.*//' | awk 'NF'); do
    [ -e "results/$id.done" ] && continue
    [ -e "results/$id.failed" ] && continue
    echo "$(date +%H:%M:%S) rendering $id"
    start=$(date +%s)
    ( cd v2 && node r2.mjs "$id" ) > "logs/$id.log" 2>&1
    name=$(grep -oE -- '-> [^ ]+\.mp4' "logs/$id.log" | tail -1 | cut -c4-)
    if [ -n "$name" ] && [ -f "v2/out/$name" ]; then
      cp "v2/out/$name" results/
      cp "v2/out/${name%.mp4}.sheet.jpg" results/ 2>/dev/null
      echo "$(tail -1 "logs/$id.log") wall=$(( $(date +%s) - start ))s" > "results/$id.done"
      echo "$(date +%H:%M:%S) done $id -> $name in $(( $(date +%s) - start ))s"
    else
      cp "logs/$id.log" "results/$id.failed"
      echo "$(date +%H:%M:%S) FAILED $id (see logs/$id.log)"
    fi
    git -C "$REPO" add "$KIT/results" "$KIT/logs"
    git -C "$REPO" commit -qm "render $id on mac" && (git -C "$REPO" push -q || echo "push failed, will retry")
  done
  sleep 30
done
