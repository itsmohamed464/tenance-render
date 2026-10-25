// Renderer v2: AI footage + 3D phone UI + word-synced captions + full sound design
// usage: node r2.mjs <id...> [--preview=t1,t2,...] [--fps=60]
import fs from 'fs';
import path from 'path';
import { spawn, spawnSync, execFileSync } from 'child_process';
import { once } from 'events';
import { chromium } from 'playwright-core';

const D = path.dirname(new URL(import.meta.url).pathname);
const VID = path.join(D, '../vid');
const FF = process.env.FFMPEG || [path.join(VID, 'node_modules/ffmpeg-static/ffmpeg'), path.join(D, '../node_modules/ffmpeg-static/ffmpeg'), path.join(D, 'node_modules/ffmpeg-static/ffmpeg')].find((f) => fs.existsSync(f));
const AUD = path.join(D, 'audio');
const OUT = path.join(D, 'out');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const ids = argv.filter((a) => !a.startsWith('--'));
const FPS = Number(opt.fps || 60);

// music: segs play the track from `src` starting at video time `at` (number or K key + lead);
// `onset` aligns a single track's beat drop to K.turn + lead.
const MUSIC = {
  A: { f: 'm2A2.mp3', onset: 9.22, lead: 0.1, db: -12, boost: 0.9, amb: [{ f: 'rain2.mp3', t0: 0, end: 'becker', db: 7, fin: 0.25, fout: 0.3 }] },
  B: { f: 'm2B2.mp3', onset: 8.05, lead: 0.1, db: -17.5, boost: 0.8 },
  C: { f: 'm2C2.mp3', segs: [{ src: 0, at: 0 }, { src: 11.72, at: 'turn', lead: -0.05 }], db: -17, boost: 0.8 },
  D: { f: 'm3D1.mp3', onset: 8.65, lead: 0.1, db: -16, boost: 0.8 },
  E: { f: 'm3E3.mp3', segs: [{ src: 0.8, at: 0, db: -6 }, { src: 15.2, at: 'turn', lead: -0.05 }], db: -20, boost: 1.0, amb: [{ f: 'sfx_wind.mp3', t0: 0, end: 'turn', db: -16, fin: 0.3, fout: 0.5 }] },
  F: { f: 'm3F2.mp3', segs: [{ src: 0, at: 0 }, { src: 11.15, at: 'turn', lead: -0.05 }], db: -17, boost: 0.8 },
  G: { f: 'm3D3.mp3', segs: [{ src: 0.4, at: 0, db: -2 }, { src: 9.5, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  H: { f: 'm2A3.mp3', segs: [{ src: 0, at: 0, db: -3 }, { src: 9.1, at: 'turn', lead: -0.05 }], db: -17, boost: 0.8 },
  X2: { f: 'm3E2.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -2 }, { src: 5.7, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X3: { f: 'm3D2.mp3', segs: [{ f: 'm3E1.mp3', src: 0, at: 0, db: -2 }, { src: 19.75, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X4: { f: 'm2B2.mp3', segs: [{ src: 0, at: 0, db: -4 }, { src: 8.2, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X5: { f: 'm3D3.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 9.5, at: 'turn', lead: -0.05 }], db: -17, boost: 0.8 },
  X6: { f: 'm3D1.mp3', segs: [{ f: 'm2B2.mp3', src: 0, at: 0, db: -5 }, { src: 8.9, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X26: { f: 'm3F3.mp3', segs: [{ f: 'm3E2.mp3', src: 0, at: 0, db: -4 }, { src: 9.15, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X25: { f: 'm3D2.mp3', segs: [{ f: 'm3E3.mp3', src: 0.8, at: 0, db: -5 }, { src: 19.75, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X24: { f: 'm2C2.mp3', segs: [{ f: 'm2A1.mp3', src: 0, at: 0, db: -5 }, { src: 11.72, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X23: { f: 'm3E1.mp3', segs: [{ f: 'm2B1.mp3', src: 0, at: 0, db: -4 }, { src: 14.95, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X22: { f: 'm3F2.mp3', segs: [{ f: 'm2B3.mp3', src: 0, at: 0, db: -4 }, { src: 11.2, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X13: { f: 'm3F3.mp3', segs: [{ f: 'm2B3.mp3', src: 0, at: 0, db: -4 }, { src: 9.15, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X14: { f: 'm3D3.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 9.5, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X15: { f: 'm2C1.mp3', segs: [{ f: 'm2A1.mp3', src: 0, at: 0, db: -4 }, { src: 7.4, at: 'turn', lead: -0.05 }], db: -17, boost: 0.8 },
  X16: { f: 'm3F1.mp3', segs: [{ f: 'm2B1.mp3', src: 0, at: 0, db: -4 }, { src: 9.15, at: 'turn', lead: -0.05 }], db: -17, boost: 0.8 },
  X17: { f: 'm3E1.mp3', segs: [{ f: 'm3E3.mp3', src: 0.8, at: 0, db: -5 }, { src: 14.95, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X18: { f: 'm2B2.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 8.2, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X19: { f: 'm3E2.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -2 }, { src: 5.7, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X20: { f: 'm3D1.mp3', segs: [{ f: 'm2B2.mp3', src: 0, at: 0, db: -5 }, { src: 8.9, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X27: { f: 'm3E2.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 5.7, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X28: { f: 'm3F3.mp3', segs: [{ f: 'm2B3.mp3', src: 0, at: 0, db: -4 }, { src: 9.15, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X29: { f: 'm3D1.mp3', segs: [{ f: 'm2B2.mp3', src: 0, at: 0, db: -5 }, { src: 8.9, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X30: { f: 'm3D3.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 9.5, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X31: { f: 'm3E1.mp3', segs: [{ f: 'm2B1.mp3', src: 0, at: 0, db: -4 }, { src: 14.95, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X32: { f: 'm2C2.mp3', segs: [{ f: 'm2A1.mp3', src: 0, at: 0, db: -5 }, { src: 11.72, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X33: { f: 'm3E2.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 5.7, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X34: { f: 'm3F3.mp3', segs: [{ f: 'm2B3.mp3', src: 0, at: 0, db: -4 }, { src: 9.15, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X35: { f: 'm3D1.mp3', segs: [{ f: 'm2B2.mp3', src: 0, at: 0, db: -5 }, { src: 8.9, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X36: { f: 'm3D3.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 9.5, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X37: { f: 'm3E1.mp3', segs: [{ f: 'm2B1.mp3', src: 0, at: 0, db: -4 }, { src: 14.95, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X38: { f: 'm2C2.mp3', segs: [{ f: 'm2A1.mp3', src: 0, at: 0, db: -5 }, { src: 11.72, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X39: { f: 'm3E2.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 5.7, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X40: { f: 'm3F3.mp3', segs: [{ f: 'm2B3.mp3', src: 0, at: 0, db: -4 }, { src: 9.15, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X41: { f: 'm3D1.mp3', segs: [{ f: 'm2B2.mp3', src: 0, at: 0, db: -5 }, { src: 8.9, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X42: { f: 'm3D3.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 9.5, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X43: { f: 'm3E1.mp3', segs: [{ f: 'm2B1.mp3', src: 0, at: 0, db: -4 }, { src: 14.95, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X44: { f: 'm2C2.mp3', segs: [{ f: 'm2A1.mp3', src: 0, at: 0, db: -5 }, { src: 11.72, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X45: { f: 'm3F3.mp3', segs: [{ f: 'm2B3.mp3', src: 0, at: 0, db: -4 }, { src: 9.15, at: 'turn', lead: -0.05 }], db: -17, boost: 0.9 },
  X46: { f: 'm3E2.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 5.7, at: 'turn', lead: -0.05 }], db: -17, boost: 0.9 },
  X47: { f: 'm3F3.mp3', segs: [{ f: 'm2B3.mp3', src: 0, at: 0, db: -4 }, { src: 9.15, at: 'turn', lead: -0.05 }], db: -16, boost: 0.9 },
  X48: { f: 'm3E2.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 5.7, at: 'turn', lead: -0.05 }], db: -16, boost: 0.9 },
  X49: { f: 'm3D2.mp3', segs: [{ f: 'm2A2.mp3', src: 0, at: 0, db: -4 }, { src: 6.0, at: 'turn', lead: -0.05 }], db: -16, boost: 0.9 },
  X50: { f: 'm3F2.mp3', segs: [{ f: 'm2B2.mp3', src: 0, at: 0, db: -4 }, { src: 6.0, at: 'turn', lead: -0.05 }], db: -16, boost: 0.9 },
  X21: { f: 'm2A3.mp3', segs: [{ f: 'm2A1.mp3', src: 0, at: 0, db: -4 }, { src: 9.1, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X12: { f: 'm3D1.mp3', segs: [{ f: 'm3E3.mp3', src: 0.8, at: 0, db: -5 }, { src: 8.9, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X11: { f: 'm2B2.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -3 }, { src: 8.2, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X10: { f: 'm2A3.mp3', segs: [{ f: 'm2A1.mp3', src: 0, at: 0, db: -4 }, { src: 9.1, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X9: { f: 'm3E3.mp3', segs: [{ f: 'm2B1.mp3', src: 0, at: 0, db: -4 }, { src: 15.25, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  X8: { f: 'm2C1.mp3', segs: [{ f: 'm2B3.mp3', src: 0, at: 0, db: -3 }, { src: 7.4, at: 'turn', lead: -0.05 }], db: -17, boost: 0.8 },
  X7: { f: 'm3F1.mp3', segs: [{ src: 0, at: 0, db: -3 }, { src: 9.15, at: 'turn', lead: -0.05 }], db: -17, boost: 0.8 },
  X1: { f: 'm3F3.mp3', segs: [{ src: 0, at: 0, db: -3 }, { src: 9.15, at: 'turn', lead: -0.05 }], db: -16, boost: 0.8 },
  W3: { f: 'm3D1.mp3', segs: [{ src: 8.9, at: 0 }], db: -17, boost: 0.8 },
  W2: { f: 'm3E2.mp3', segs: [{ f: 'm2C3.mp3', src: 0, at: 0, db: -4 }, { src: 5.7, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  W1: { f: 'm3E1.mp3', segs: [{ src: 0, at: 0, db: -2 }, { src: 14.95, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
  I: { f: 'm3D2.mp3', segs: [{ src: 0.3, at: 0, db: -4 }, { src: 19.75, at: 'turn', lead: -0.05 }], db: -18, boost: 0.8 },
};
const V = {
  'A-de': { name: 'ticket9-de', concept: 'A', lang: 'de', tempo: 1.0, off: 0.30 },
  'A-en': { name: 'ticket9-en', concept: 'A', lang: 'en', tempo: 1.06, off: 0.30 },
  'B-de': { name: 'nk9-de', concept: 'B', lang: 'de', tempo: 1.0, off: 0.10 },
  'B-en': { name: 'utility9-en', concept: 'B', lang: 'en', tempo: 1.0, off: 0.10 },
  'C-de': { name: 'vertrag9-de', concept: 'C', lang: 'de', tempo: 1.0, off: 0.15 },
  'C-en': { name: 'lease9-en', concept: 'C', lang: 'en', tempo: 1.0, off: 0.15 },
  'D-de': { name: 'miete10-de', concept: 'D', lang: 'de', tempo: 1.0, off: 0.15 },
  'D-en': { name: 'rent10-en', concept: 'D', lang: 'en', tempo: 1.0, off: 0.15 },
  'E-de': { name: 'winter10-de', concept: 'E', lang: 'de', tempo: 1.0, off: 0.15 },
  'E-en': { name: 'winter10-en', concept: 'E', lang: 'en', tempo: 1.0, off: 0.15 },
  'F-de': { name: 'auszug10-de', concept: 'F', lang: 'de', tempo: 1.0, off: 0.15 },
  'F-en': { name: 'moveout10-en', concept: 'F', lang: 'en', tempo: 1.0, off: 0.15 },
  'G-de': { name: 'leerstand12-de', concept: 'G', lang: 'de', tempo: 1.0, off: 0.15 },
  'G-en': { name: 'vacancy12-en', concept: 'G', lang: 'en', tempo: 1.0, off: 0.15 },
  'H-de': { name: 'nachzahlung12-de', concept: 'H', lang: 'de', tempo: 1.0, off: 0.15 },
  'H-en': { name: 'backpay12-en', concept: 'H', lang: 'en', tempo: 1.0, off: 0.15 },
  'I-de': { name: 'handwerker12-de', concept: 'I', lang: 'de', tempo: 1.0, off: 0.15 },
  'I-en': { name: 'plumber12-en', concept: 'I', lang: 'en', tempo: 1.0, off: 0.15 },
  'W3-de': { name: 'winterchecks12-de', concept: 'W3', lang: 'de', tempo: 1.0, off: 0.15 },
  'W3-en': { name: 'winterchecks12-en', concept: 'W3', lang: 'en', tempo: 1.0, off: 0.15 },
  'W2-de': { name: 'schimmel12-de', concept: 'W2', lang: 'de', tempo: 1.0, off: 0.15 },
  'W2-en': { name: 'mold12-en', concept: 'W2', lang: 'en', tempo: 1.0, off: 0.15 },
  'W1-de': { name: 'schnee12-de', concept: 'W1', lang: 'de', tempo: 1.0, off: 0.15 },
  'W1-en': { name: 'snow12-en', concept: 'W1', lang: 'en', tempo: 1.0, off: 0.15 },
  'X1-de': { name: 'heizfallen13-de', concept: 'X1', lang: 'de', tempo: 1.0, off: 0.15 },
  'X1-en': { name: 'heattraps13-en', concept: 'X1', lang: 'en', tempo: 1.0, off: 0.15 },
  'X2-de': { name: 'rohrbruch13-de', concept: 'X2', lang: 'de', tempo: 1.0, off: 0.15 },
  'X2-en': { name: 'burstpipe13-en', concept: 'X2', lang: 'en', tempo: 1.0, off: 0.15 },
  'X3-de': { name: 'heizungsausfall13-de', concept: 'X3', lang: 'de', tempo: 1.0, off: 0.15 },
  'X3-en': { name: 'heatingout13-en', concept: 'X3', lang: 'en', tempo: 1.0, off: 0.15 },
  'X4-de': { name: 'auszug14-de', concept: 'X4', lang: 'de', tempo: 1.0, off: 0.15 },
  'X4-en': { name: 'moveout14-en', concept: 'X4', lang: 'en', tempo: 1.0, off: 0.15 },
  'X5-de': { name: 'kaution14-de', concept: 'X5', lang: 'de', tempo: 1.0, off: 0.15 },
  'X5-en': { name: 'deposit14-en', concept: 'X5', lang: 'en', tempo: 1.0, off: 0.15 },
  'X6-de': { name: 'miete14-de', concept: 'X6', lang: 'de', tempo: 1.0, off: 0.15 },
  'X6-en': { name: 'rentday14-en', concept: 'X6', lang: 'en', tempo: 1.0, off: 0.15 },
  'X7-de': { name: 'dokumente15-de', concept: 'X7', lang: 'de', tempo: 1.0, off: 0.15 },
  'X7-en': { name: 'documents15-en', concept: 'X7', lang: 'en', tempo: 1.0, off: 0.15 },
  'X8-de': { name: 'heizung412-15-de', concept: 'X8', lang: 'de', tempo: 1.0, off: 0.15 },
  'X8-en': { name: 'heating412-15-en', concept: 'X8', lang: 'en', tempo: 1.0, off: 0.15 },
  'X9-de': { name: 'treppenhaus15-de', concept: 'X9', lang: 'de', tempo: 1.0, off: 0.15 },
  'X9-en': { name: 'stairwell15-en', concept: 'X9', lang: 'en', tempo: 1.0, off: 0.15 },
  'X10-de': { name: 'fristen16-de', concept: 'X10', lang: 'de', tempo: 1.0, off: 0.15 },
  'X10-en': { name: 'deadlines16-en', concept: 'X10', lang: 'en', tempo: 1.0, off: 0.15 },
  'X11-de': { name: 'unterschrift16-de', concept: 'X11', lang: 'de', tempo: 1.0, off: 0.15 },
  'X11-en': { name: 'signing16-en', concept: 'X11', lang: 'en', tempo: 1.0, off: 0.15 },
  'X12-de': { name: 'wasserschaden16-de', concept: 'X12', lang: 'de', tempo: 1.0, off: 0.15 },
  'X12-en': { name: 'leak16-en', concept: 'X12', lang: 'en', tempo: 1.0, off: 0.15 },
  'X13-de': { name: 'zaehler17-de', concept: 'X13', lang: 'de', tempo: 1.0, off: 0.15 },
  'X13-en': { name: 'meter17-en', concept: 'X13', lang: 'en', tempo: 1.0, off: 0.15 },
  'X14-de': { name: 'termin17-de', concept: 'X14', lang: 'de', tempo: 1.0, off: 0.15 },
  'X14-en': { name: 'slot17-en', concept: 'X14', lang: 'en', tempo: 1.0, off: 0.15 },
  'X15-de': { name: 'tickets17-de', concept: 'X15', lang: 'de', tempo: 1.0, off: 0.15 },
  'X15-en': { name: 'tickets17-en', concept: 'X15', lang: 'en', tempo: 1.0, off: 0.15 },
  'X16-de': { name: 'posten18-de', concept: 'X16', lang: 'de', tempo: 1.0, off: 0.15 },
  'X16-en': { name: 'lineitems18-en', concept: 'X16', lang: 'en', tempo: 1.0, off: 0.15 },
  'X17-de': { name: 'hausueberblick18-de', concept: 'X17', lang: 'de', tempo: 1.0, off: 0.15 },
  'X17-en': { name: 'overview18-en', concept: 'X17', lang: 'en', tempo: 1.0, off: 0.15 },
  'X18-de': { name: 'nachmieter18-de', concept: 'X18', lang: 'de', tempo: 1.0, off: 0.15 },
  'X18-en': { name: 'nexttenant18-en', concept: 'X18', lang: 'en', tempo: 1.0, off: 0.15 },
  'X19-de': { name: 'rauchmelder19-de', concept: 'X19', lang: 'de', tempo: 1.0, off: 0.15 },
  'X19-en': { name: 'smokealarm19-en', concept: 'X19', lang: 'en', tempo: 1.0, off: 0.15 },
  'X20-de': { name: 'einzug19-de', concept: 'X20', lang: 'de', tempo: 1.0, off: 0.15 },
  'X20-en': { name: 'movein19-en', concept: 'X20', lang: 'en', tempo: 1.0, off: 0.15 },
  'X27-de': { name: 'lueften20-de', concept: 'X27', lang: 'de', tempo: 1.0, off: 0.15 },
  'X27-en': { name: 'airing20-en', concept: 'X27', lang: 'en', tempo: 1.0, off: 0.15 },
  'X28-de': { name: 'schneealarm20-de', concept: 'X28', lang: 'de', tempo: 1.0, off: 0.15 },
  'X28-en': { name: 'snowalert20-en', concept: 'X28', lang: 'en', tempo: 1.0, off: 0.15 },
  'X29-de': { name: 'quittung20-de', concept: 'X29', lang: 'de', tempo: 1.0, off: 0.15 },
  'X29-en': { name: 'receipt20-en', concept: 'X29', lang: 'en', tempo: 1.0, off: 0.15 },
  'X30-de': { name: 'suche21-de', concept: 'X30', lang: 'de', tempo: 1.0, off: 0.15 },
  'X30-en': { name: 'search21-en', concept: 'X30', lang: 'en', tempo: 1.0, off: 0.15 },
  'X31-de': { name: 'kaution21-de', concept: 'X31', lang: 'de', tempo: 1.0, off: 0.15 },
  'X31-en': { name: 'deposit21-en', concept: 'X31', lang: 'en', tempo: 1.0, off: 0.15 },
  'X32-de': { name: 'abschlag21-de', concept: 'X32', lang: 'de', tempo: 1.0, off: 0.15 },
  'X32-en': { name: 'advance21-en', concept: 'X32', lang: 'en', tempo: 1.0, off: 0.15 },
  'X33-de': { name: 'heizung22-de', concept: 'X33', lang: 'de', tempo: 1.0, off: 0.15 },
  'X33-en': { name: 'heating22-en', concept: 'X33', lang: 'en', tempo: 1.0, off: 0.15 },
  'X34-de': { name: 'zaehlerfoto22-de', concept: 'X34', lang: 'de', tempo: 1.0, off: 0.15 },
  'X34-en': { name: 'meterphoto22-en', concept: 'X34', lang: 'en', tempo: 1.0, off: 0.15 },
  'X35-de': { name: 'wasser22-de', concept: 'X35', lang: 'de', tempo: 1.0, off: 0.15 },
  'X35-en': { name: 'water22-en', concept: 'X35', lang: 'en', tempo: 1.0, off: 0.15 },
  'X36-de': { name: 'einzug23-de', concept: 'X36', lang: 'de', tempo: 1.0, off: 0.15 },
  'X36-en': { name: 'movein23-en', concept: 'X36', lang: 'en', tempo: 1.0, off: 0.15 },
  'X37-de': { name: 'mieteingang23-de', concept: 'X37', lang: 'de', tempo: 1.0, off: 0.15 },
  'X37-en': { name: 'rentstatus23-en', concept: 'X37', lang: 'en', tempo: 1.0, off: 0.15 },
  'X38-de': { name: 'schornstein23-de', concept: 'X38', lang: 'de', tempo: 1.0, off: 0.15 },
  'X38-en': { name: 'chimney23-en', concept: 'X38', lang: 'en', tempo: 1.0, off: 0.15 },
  'X39-de': { name: 'steuer24-de', concept: 'X39', lang: 'de', tempo: 1.0, off: 0.15 },
  'X39-en': { name: 'taxes24-en', concept: 'X39', lang: 'en', tempo: 1.0, off: 0.15 },
  'X40-de': { name: 'chat24-de', concept: 'X40', lang: 'de', tempo: 1.0, off: 0.15 },
  'X40-en': { name: 'threads24-en', concept: 'X40', lang: 'en', tempo: 1.0, off: 0.15 },
  'X41-de': { name: 'auszug24-de', concept: 'X41', lang: 'de', tempo: 1.0, off: 0.15 },
  'X41-en': { name: 'moveout24-en', concept: 'X41', lang: 'en', tempo: 1.0, off: 0.15 },
  'X42-de': { name: 'winterliste25-de', concept: 'X42', lang: 'de', tempo: 1.0, off: 0.15 },
  'X42-en': { name: 'winterlist25-en', concept: 'X42', lang: 'en', tempo: 1.0, off: 0.15 },
  'X43-de': { name: 'wochenstart25-de', concept: 'X43', lang: 'de', tempo: 1.0, off: 0.15 },
  'X43-en': { name: 'mondayplan25-en', concept: 'X43', lang: 'en', tempo: 1.0, off: 0.15 },
  'X44-de': { name: 'willkommen25-de', concept: 'X44', lang: 'de', tempo: 1.0, off: 0.15 },
  'X44-en': { name: 'welcome25-en', concept: 'X44', lang: 'en', tempo: 1.0, off: 0.15 },
  'X45-de': { name: 'kiverwalter26-de', concept: 'X45', lang: 'de', tempo: 1.0, off: 0.15 },
  'X45-en': { name: 'aimanager26-en', concept: 'X45', lang: 'en', tempo: 1.0, off: 0.15 },
  'X46-de': { name: 'montag26-de', concept: 'X46', lang: 'de', tempo: 1.0, off: 0.15 },
  'X46-en': { name: 'monday26-en', concept: 'X46', lang: 'en', tempo: 1.0, off: 0.15 },
  'X47-de': { name: 'kichat26-de', concept: 'X47', lang: 'de', tempo: 1.07, off: 0.15 },
  'X47-en': { name: 'aichat26-en', concept: 'X47', lang: 'en', tempo: 1.07, off: 0.15 },
  'X48-de': { name: 'kimontag26-de', concept: 'X48', lang: 'de', tempo: 1.07, off: 0.15 },
  'X48-en': { name: 'aimonday26-en', concept: 'X48', lang: 'en', tempo: 1.07, off: 0.15 },
  'X49-de': { name: 'kibesichtigung26d-de', concept: 'X49', lang: 'de', tempo: 1.07, off: 0.15 },
  'X49-en': { name: 'aiviewing26d-en', concept: 'X49', lang: 'en', tempo: 1.07, off: 0.15 },
  'X50-de': { name: 'kivertrag26d-de', concept: 'X50', lang: 'de', tempo: 1.07, off: 0.15 },
  'X50-en': { name: 'ailease26d-en', concept: 'X50', lang: 'en', tempo: 1.07, off: 0.15 },
  'X21-de': { name: 'nachrichten19-de', concept: 'X21', lang: 'de', tempo: 1.0, off: 0.15 },
  'X21-en': { name: 'messages19-en', concept: 'X21', lang: 'en', tempo: 1.0, off: 0.15 },
  'X22-de': { name: 'abnahme20-de', concept: 'X22', lang: 'de', tempo: 1.0, off: 0.15 },
  'X22-en': { name: 'signoff20-en', concept: 'X22', lang: 'en', tempo: 1.0, off: 0.15 },
  'X23-de': { name: 'frostschutz20-de', concept: 'X23', lang: 'de', tempo: 1.0, off: 0.15 },
  'X23-en': { name: 'awaymode20-en', concept: 'X23', lang: 'en', tempo: 1.0, off: 0.15 },
  'X24-de': { name: 'anfrage20-de', concept: 'X24', lang: 'de', tempo: 1.0, off: 0.15 },
  'X24-en': { name: 'requests20-en', concept: 'X24', lang: 'en', tempo: 1.0, off: 0.15 },
  'X25-de': { name: 'schluessel21-de', concept: 'X25', lang: 'de', tempo: 1.0, off: 0.15 },
  'X25-en': { name: 'keys21-en', concept: 'X25', lang: 'en', tempo: 1.0, off: 0.15 },
  'X26-de': { name: 'versicherung21-de', concept: 'X26', lang: 'de', tempo: 1.0, off: 0.15 },
  'X26-en': { name: 'insurance21-en', concept: 'X26', lang: 'en', tempo: 1.0, off: 0.15 },
};

// per-effect trims (dB, on top of cue level) and max lengths (s) so effects never bury the voice
const SFXTRIM = { buzz: -12, counter: -10, chime: -9, pop: -7, whoosh: -7, thud: -4, unfold: -10, binder: -7, receipts: -5, vortex: -7, impact: -3, send: -4, typing: -4, drip: -3, refresh: -8, kaching: -4, boiler: -6, sting: -3, shutter: -4, keys: -3, shiver: -5, heater: -7 };
const SFXDUR = { buzz: 1.5, binder: 1.0, unfold: 1.8, counter: 1.1, receipts: 1.3, sting: 1.7, refresh: 2.4, heater: 1.9 };
function maxVol(f) {
  const res = spawnSyncText(FF, ['-hide_banner', '-i', f, '-af', 'volumedetect', '-f', 'null', '-']);
  const m = /max_volume: (-?[\d.]+) dB/.exec(res);
  return m ? +m[1] : 0;
}
function spawnSyncText(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 << 20 });
  return String(r.stdout || '') + String(r.stderr || '');
}
function ffErr(args) {
  // run ffmpeg and return stderr text
  const r = spawnSyncText(FF, args);
  return r;
}

function words(v) {
  const w = JSON.parse(fs.readFileSync(path.join(D, 'words', `${v.concept}_${v.lang}.json`), 'utf8'));
  return w.map((x) => ({ text: x.text, start: +(v.off + x.start / v.tempo).toFixed(3), end: +(v.off + x.end / v.tempo).toFixed(3) }));
}

function mixAudio(v, cues, T, outWav, K) {
  const M = MUSIC[v.concept];
  const END = v.words[v.words.length - 1].end;
  const args = ['-y', '-hide_banner', '-loglevel', 'error'];
  const fc = [];
  args.push('-i', path.join(AUD, `vo_${v.concept}_${v.lang}.mp3`));
  fc.push(`[0:a]aformat=sample_rates=48000:channel_layouts=stereo${v.tempo !== 1 ? `,atempo=${v.tempo}` : ''},highpass=f=70,acompressor=threshold=0.08:ratio=3:attack=6:release=90:makeup=1.6,adelay=${Math.round(v.off * 1000)}:all=1,apad=whole_dur=${T.toFixed(3)}[vo]`);
  fc.push(`[vo]asplit=3[voa0][vok][vok2]`);
  fc.push(`[voa0]volume=${process.env.MUTE === 'vo' ? 0 : 1}[voa]`);
  let nIn = 1;
  const segs = (M.segs || [{ src: Math.max(0, M.onset - (K.turn + M.lead)), at: 0 }]).map((g) => ({ f: g.f || M.f, src: g.src, db: g.db || 0, at: typeof g.at === 'string' ? K[g.at] + (g.lead || 0) : g.at }));
  const ml = [];
  segs.forEach((g, i) => {
    const nx = segs[i + 1];
    const dur = (nx ? nx.at : T) - g.at;
    args.push('-i', path.join(AUD, g.f));
    fc.push(`[${nIn}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=start=${g.src.toFixed(3)}:duration=${(dur + 0.08).toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=${i ? 0.03 : 0.12},afade=t=out:st=${Math.max(0, dur - 0.02).toFixed(3)}:d=0.08,volume=${g.db}dB,adelay=${Math.round(g.at * 1000)}:all=1[ms${i}]`);
    ml.push(`[ms${i}]`);
    nIn++;
  });
  fc.push(`${ml.join('')}amix=inputs=${ml.length}:normalize=0:duration=longest,volume=${M.db}dB,volume='1+${M.boost}*min(max((t-${(END + 0.05).toFixed(2)})/0.35,0),1)':eval=frame,afade=t=out:st=${(T - 0.6).toFixed(2)}:d=0.6,apad=whole_dur=${T.toFixed(3)},atrim=0:${T.toFixed(3)}[m0]`);
  fc.push('[m0][vok]sidechaincompress=threshold=0.025:ratio=5:attack=20:release=280:makeup=1[mus]');
  const labels = ['[voa]', '[mus]'];
  const fxl = [];
  (M.amb || []).forEach((a, i) => {
    args.push('-i', path.join(AUD, a.f));
    const t1 = (typeof a.end === 'string' ? K[a.end] : a.end) - a.t0;
    fc.push(`[${nIn}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${(t1 + 0.05).toFixed(3)},volume=${a.db}dB,afade=t=in:d=${a.fin},afade=t=out:st=${Math.max(0, t1 - a.fout).toFixed(3)}:d=${a.fout},adelay=${Math.round(a.t0 * 1000)}:all=1[a${i}]`);
    fxl.push(`[a${i}]`);
    nIn++;
  });
  cues.forEach((c, i) => {
    const f = path.join(AUD, `sfx_${c.name}.mp3`);
    args.push('-i', f);
    const g = -1 - SFXPEAK[c.name] + c.db + (SFXTRIM[c.name] || 0);
    const d = SFXDUR[c.name];
    fc.push(`[${nIn + i}:a]aformat=sample_rates=48000:channel_layouts=stereo${c.from ? `,atrim=start=${c.from},asetpts=PTS-STARTPTS` : ''}${d ? `,atrim=0:${d},afade=t=out:st=${(d - 0.3).toFixed(2)}:d=0.3` : ''},volume=${g.toFixed(1)}dB,adelay=${Math.max(0, Math.round(c.t * 1000))}:all=1[s${i}]`);
    fxl.push(`[s${i}]`);
  });
  if (fxl.length) {
    fc.push(`${fxl.join('')}amix=inputs=${fxl.length}:normalize=0:duration=longest,apad=whole_dur=${T.toFixed(3)}[fx0]`);
    fc.push('[fx0][vok2]sidechaincompress=threshold=0.04:ratio=3:attack=4:release=220:makeup=1[fx]');
    labels.push('[fx]');
  } else fc.push('[vok2]anullsink');
  const lab2 = process.env.MUTE === 'bed' ? ['[voa]'] : labels;
  if (process.env.MUTE === 'bed') labels.slice(1).forEach((l) => fc.push(`${l}anullsink`));
  fc.push(`${lab2.join('')}amix=inputs=${lab2.length}:normalize=0:duration=longest,atrim=0:${T.toFixed(3)},alimiter=limit=0.9:attack=3:release=40[mix]`);
  const pre = outWav.replace(/\.wav$/, '.pre.wav');
  execFileSync(FF, [...args, '-filter_complex', fc.join(';'), '-map', '[mix]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', pre], { stdio: 'inherit' });
  // two-pass loudnorm to -14 LUFS
  const m = ffErr(['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-']);
  const j = JSON.parse(m.slice(m.lastIndexOf('{'), m.lastIndexOf('}') + 1));
  const ln = `loudnorm=I=-14:TP=-1.5:LRA=9:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', '-i', pre, '-af', `${ln},aresample=48000,aformat=sample_fmts=s16:channel_layouts=stereo`, '-ac', '2', '-c:a', 'pcm_s16le', outWav], { stdio: 'inherit' });
  return j;
}

const SFXPEAK = {};
for (const f of fs.readdirSync(AUD).filter((x) => x.startsWith('sfx_'))) SFXPEAK[f.slice(4, -4)] = maxVol(path.join(AUD, f));

// macOS (render kit): real GPU via Metal in new-headless Chromium; Linux cloud container: no GPU, SwiftShader is faster than the GPU path
const MAC = process.platform === 'darwin';
const BASEARGS = ['--allow-file-access-from-files', '--force-color-profile=srgb', '--font-render-hinting=none'];
let browser;
if (MAC) {
  const args = ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', ...BASEARGS];
  try { browser = await chromium.launch({ channel: 'chromium', args }); } catch (e) { console.log('new-headless launch failed, falling back:', String(e).slice(0, 120)); browser = await chromium.launch({ args }); }
} else {
  const exe = ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(fs.existsSync);
  browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', ...BASEARGS] });
}
for (const id of ids) {
  const v = V[id];
  if (!v) throw new Error('unknown id ' + id);
  v.words = words(v);
  const t0 = Date.now();
  const CFG = { id, concept: v.concept, lang: v.lang, words: v.words };
  const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="st.css"></head><body><div id="stage"></div><script>window.CFG=${JSON.stringify(CFG)};</script>${/^[WX]/.test(v.concept) ? `<script type="module">import * as THREE from './three.module.min.js'; window.THREE = THREE; const ld = (s) => new Promise((r, j) => { const e = document.createElement('script'); e.src = s; e.onload = r; e.onerror = () => j(new Error('load ' + s)); document.body.appendChild(e); }); try { await ld('../vid/gsap.min.js'); await ld('rt.js'); await ld('sw.js'); window.__ok = 1; } catch (e) { window.__err = String(e.stack || e); window.__ok = 1; }</script>` : '<script src="../vid/gsap.min.js"></script><script src="rt.js"></script><script src="sc.js"></script>'}</body></html>`;
  const hp = path.join(D, `${id}.html`);
  fs.writeFileSync(hp, html);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + hp);
  if (/^[WX]/.test(v.concept)) { await page.waitForFunction(() => window.__ok, null, { timeout: 30000 }); const e = await page.evaluate(() => window.__err); if (e) errs.push(e); }
  await page.evaluate(() => window.ready && window.ready());
  if (errs.length) { console.error(id, 'page errors:', errs.join('\n')); process.exitCode = 1; await page.close(); continue; }
  const T = await page.evaluate(() => window.T);
  const cues = await page.evaluate(() => window.CUES);
  const K = await page.evaluate(() => window.K);
  if (opt.preview) {
    const ts = String(opt.preview).split(',').map(Number);
    const outs = [];
    for (const t of ts) {
      await page.evaluate((x) => window.seek(x), t);
      const f = path.join(OUT, `${id}_p${t.toFixed(2)}.jpg`);
      fs.writeFileSync(f, await page.screenshot({ type: 'jpeg', quality: 88 }));
      outs.push(f);
    }
    const sheet = path.join(OUT, `${id}_prev.jpg`);
    const n = outs.length;
    execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', ...outs.flatMap((f) => ['-i', f]), '-filter_complex', outs.map((_, i) => `[${i}]scale=270:480[v${i}]`).join(';') + ';' + outs.map((_, i) => `[v${i}]`).join('') + `hstack=${n}`, sheet]);
    console.log(id, 'T=' + T.toFixed(2), 'K=' + JSON.stringify(K), 'preview ->', sheet);
    await page.close();
    continue;
  }
  const silent = path.join(OUT, `${v.name}.silent.mp4`);
  const shots = [];
  const N = Math.round(T * FPS);
  const cdp = await page.context().newCDPSession(page);
  if (!(opt['audio-only'] && fs.existsSync(silent))) {
  const ff = spawn(FF, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(opt.crf || 20), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-movflags', '+faststart', silent], { stdio: ['pipe', 'ignore', 'inherit'] });
  const done = once(ff, 'close');
  const sheetT = [0.3, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, T - 0.9, T - 0.1].filter((t) => t < T);
  const sheetF = sheetT.map((t) => Math.round(t * FPS));
  for (let f = 0; f < N; f++) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    const buf = Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93, optimizeForSpeed: true })).data, 'base64');
    if (sheetF.includes(f)) { const p = path.join(OUT, `${v.name}.f${f}.jpg`); fs.writeFileSync(p, buf); shots.push(p); }
    if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
    if (f % 120 === 0) process.stdout.write(`${id} ${f}/${N}\r`);
  }
  ff.stdin.end();
  await done;
  }
  await page.close();
  const wav = path.join(OUT, `${v.name}.wav`);
  const ln = mixAudio(v, cues, T, wav, K);
  const final = path.join(OUT, `${v.name}.mp4`);
  execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', T.toFixed(3), '-movflags', '+faststart', final]);
  if (shots.length) {
    execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', ...shots.flatMap((f) => ['-i', f]), '-filter_complex', shots.map((_, i) => `[${i}]scale=216:384[v${i}]`).join(';') + ';' + shots.map((_, i) => `[v${i}]`).join('') + `hstack=${shots.length}`, path.join(OUT, `${v.name}.sheet.jpg`)]);
    shots.forEach((f) => fs.unlinkSync(f));
  }
  console.log(`${id} -> ${v.name}.mp4 T=${T.toFixed(2)} frames=${N} render=${((Date.now() - t0) / 1000).toFixed(0)}s inLUFS=${ln.input_i} size=${fs.statSync(final).size}`);
}
await browser.close();
