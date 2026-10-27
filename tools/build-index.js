#!/usr/bin/env node
/* Regenerates each map's thumbnail (maps/<id>.svg) and its index.json entry from maps/<id>.json, so adding a map
   is just adding that one file. Run after any change to maps/*.json:
     node tools/build-index.js
   Existing index.json fields (title, by, about) are left alone once an entry exists - only file/thumb are kept
   correct and new entries are filled in. by defaults to the git author of the map file's most recent commit.
   Entries and thumbnails for a maps/<id>.json that no longer exists are removed.

   Needs core.js from the app (no DOM, so it runs fine under Node): by default this fetches the deployed copy,
   since the app repo is private and the live site is not. Point CORE_JS_PATH at a local checkout to use that
   instead (for testing a change before it deploys). */
'use strict';
var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var ROOT = path.join(__dirname, '..');
var MAPS_DIR = path.join(ROOT, 'maps');
var INDEX_FILE = path.join(ROOT, 'index.json');
var CORE_JS_URL = process.env.CORE_JS_URL || 'https://black-rock-0b17f6503.6.azurestaticapps.net/core.js';
var ID_RE = /^[a-z0-9_-]+$/;

function loadCore() {
  if (process.env.CORE_JS_PATH) return fs.readFileSync(process.env.CORE_JS_PATH, 'utf8');
  return fetch(CORE_JS_URL).then(function (r) {
    if (!r.ok) throw new Error('could not fetch core.js: ' + r.status);
    return r.text();
  });
}

function gitAuthor(file) {
  try { return cp.execSync('git log -1 --format=%an -- ' + JSON.stringify(file), { cwd: ROOT, encoding: 'utf8' }).trim() || null; }
  catch (e) { return null; }
}

Promise.resolve(loadCore()).then(function (coreSrc) {
  var tmp = path.join(require('os').tmpdir(), 'tubemap-core-' + Date.now() + '.js');
  fs.writeFileSync(tmp, coreSrc);
  global.window = global;
  require(tmp);
  fs.unlinkSync(tmp);
  var C = global.window.TMCore;
  if (!C || !C.toSVG) throw new Error('core.js did not load as expected (no TMCore.toSVG)');

  var index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  var byId = {}; index.maps.forEach(function (e) { byId[e.id] = e; });

  var files = fs.readdirSync(MAPS_DIR).filter(function (f) { return f.endsWith('.json'); });
  var seen = {}, changed = false, failed = false;

  files.forEach(function (f) {
    var id = f.slice(0, -5);
    if (!ID_RE.test(id)) { console.error('skipping maps/' + f + ': the name must be only letters, numbers, - and _'); failed = true; return; }
    seen[id] = true;
    var raw;
    try { raw = JSON.parse(fs.readFileSync(path.join(MAPS_DIR, f), 'utf8')); }
    catch (e) { console.error('maps/' + f + ' is not valid JSON: ' + e.message); failed = true; return; }
    var r = C.normalise(raw);
    if (!r.map) { console.error('maps/' + f + ': ' + r.errors.join(' ')); failed = true; return; }

    var svgPath = path.join(MAPS_DIR, id + '.svg'), svg = C.toSVG(r.map);
    if (!fs.existsSync(svgPath) || fs.readFileSync(svgPath, 'utf8') !== svg) {
      fs.writeFileSync(svgPath, svg); console.log('wrote maps/' + id + '.svg'); changed = true;
    }

    var entry = byId[id];
    if (!entry) {
      entry = { id: id, title: r.map.docTitle || id, by: gitAuthor(path.join('maps', f)) || 'a contributor',
                about: r.map.subtitle || 'An unofficial map made with Tube Map Maker.', file: 'maps/' + f, thumb: 'maps/' + id + '.svg' };
      index.maps.push(entry); byId[id] = entry; console.log('added an index entry for ' + id); changed = true;
    } else if (entry.file !== 'maps/' + f || entry.thumb !== 'maps/' + id + '.svg') {
      entry.file = 'maps/' + f; entry.thumb = 'maps/' + id + '.svg'; changed = true;
    }
  });

  // drop entries and thumbnails for a map that is no longer there
  index.maps = index.maps.filter(function (e) {
    if (seen[e.id]) return true;
    console.log('removing the index entry for ' + e.id + ' (maps/' + e.id + '.json is gone)'); changed = true;
    return false;
  });
  fs.readdirSync(MAPS_DIR).filter(function (f) { return f.endsWith('.svg') && !seen[f.slice(0, -4)]; }).forEach(function (f) {
    fs.unlinkSync(path.join(MAPS_DIR, f)); console.log('removed orphaned maps/' + f); changed = true;
  });

  if (changed) fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 1) + '\n');
  console.log(changed ? 'index.json updated' : 'nothing to do');
  if (failed) process.exitCode = 1;
}).catch(function (e) { console.error(e.message || e); process.exitCode = 1; });
