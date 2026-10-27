#!/usr/bin/env node
/* Makes maps/*.json on disk match a pull request's changes to them, as data only: it reads the PR's changed-file
   list and each file's content through the GitHub API via `gh`, and never checks out or runs anything else from
   the PR's branch. That's what lets a workflow safely build a preview for a PR from a fork, with a token that can
   write to this repo, without ever running that fork's own code with it.
     node tools/sync-pr-maps.js <pr-number> [out-manifest.json]
   The manifest (default: $RUNNER_TEMP/pr-maps-changed.json, or ./pr-maps-changed.json) lists the ids this PR
   added, modified or removed, for a later step to describe in a comment. */
'use strict';
var cp = require('child_process');
var fs = require('fs');
var path = require('path');

var pr = process.argv[2];
if (!pr) { console.error('usage: node tools/sync-pr-maps.js <pr-number> [out-manifest.json]'); process.exit(2); }
var out = process.argv[3] || path.join(process.env.RUNNER_TEMP || '.', 'pr-maps-changed.json');
var repo = process.env.GITHUB_REPOSITORY;
if (!repo) { console.error('GITHUB_REPOSITORY is not set'); process.exit(2); }
var ROOT = path.join(__dirname, '..');

function gh(args) { return cp.execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 }); }
function idOf(file) { return file.slice('maps/'.length, -'.json'.length); }

var files = JSON.parse(gh(['api', 'repos/' + repo + '/pulls/' + pr + '/files', '--paginate',
  '--jq', '[.[] | {filename, status, previous_filename}]']));
var mapFiles = files.filter(function (f) {
  return /^maps\/[^/]+\.json$/.test(f.filename) || (f.previous_filename && /^maps\/[^/]+\.json$/.test(f.previous_filename));
});
if (!mapFiles.length) { console.log('no maps/*.json changes in PR #' + pr); fs.writeFileSync(out, '{"added":[],"modified":[],"removed":[]}'); process.exit(0); }

var headSha = gh(['api', 'repos/' + repo + '/pulls/' + pr, '--jq', '.head.sha']).trim();
var manifest = { added: [], modified: [], removed: [] };

mapFiles.forEach(function (f) {
  if (f.status === 'removed') {
    var p = path.join(ROOT, f.filename);
    if (fs.existsSync(p)) { fs.unlinkSync(p); manifest.removed.push(idOf(f.filename)); console.log('removed (per PR #' + pr + '): ' + f.filename); }
    return;
  }
  if (f.status === 'renamed' && f.previous_filename && /^maps\/[^/]+\.json$/.test(f.previous_filename)) {
    var old = path.join(ROOT, f.previous_filename);
    if (fs.existsSync(old)) { fs.unlinkSync(old); manifest.removed.push(idOf(f.previous_filename)); console.log('removed (renamed away): ' + f.previous_filename); }
  }
  var existed = fs.existsSync(path.join(ROOT, f.filename));
  var apiPath = f.filename.split('/').map(encodeURIComponent).join('/');
  var content = gh(['api', 'repos/' + repo + '/contents/' + apiPath + '?ref=' + headSha, '--jq', '.content']);
  fs.writeFileSync(path.join(ROOT, f.filename), Buffer.from(content.replace(/\s+/g, ''), 'base64'));
  (existed ? manifest.modified : manifest.added).push(idOf(f.filename));
  console.log((existed ? 'updated' : 'added') + ' from PR #' + pr + ': ' + f.filename);
});

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(manifest));
console.log('manifest written to ' + out);
