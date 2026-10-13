# Tenance render kit (Mac)

Renders the Tenance videos on your Mac's GPU. The cloud Claude session still writes the scenes,
checks the results and schedules the posts. Your Mac only renders.

You need Node.js (LTS from https://nodejs.org, or `brew install node`).

## 1. Quick test (works straight from the zip)

```bash
cd ~/Downloads/tenance-render      # wherever you unzipped it
./setup.sh
```

`setup.sh` installs the renderer, prints `GPU OK` when Chromium uses the Apple GPU,
and times a 3-frame test render. Send the last lines of its output to the cloud session.

## 2. Connect it to the cloud session (job queue)

1. On GitHub, create an empty **private** repository named `tenance-render`.
2. Tell the cloud session it exists. It pushes this kit there and writes render jobs into `jobs/`.
3. On the Mac:

```bash
git clone https://github.com/itsmohamed464/tenance-render.git ~/tenance-render
cd ~/tenance-render
./setup.sh
caffeinate -i ./worker.sh
```

Leave that Terminal open and the Mac plugged in. The worker checks for new jobs every 30 seconds,
renders them, and pushes the videos to `results/`. Stop it with Ctrl+C.

## Optional: Claude on the Mac

In a second Terminal tab: `cd ~/tenance-render && claude remote-control`.
That session shows up in the Claude Code app. The worker runs either way.

## How jobs work

- `jobs/*.txt`: one render id per line (for example `X22-de`), written by the cloud session
- `results/<id>.done` / `<id>.failed`: written by the worker, next to the MP4 and contact sheet
- delete a `.done` or `.failed` file to render that id again
