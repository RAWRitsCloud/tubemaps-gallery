#!/usr/bin/env node
/* Posts (once) a PR comment showing the thumbnail and index entry a preview branch generated, so a reviewer can
   see a fork's map before merging it - the preview branch holds exactly what tools/build-index.js would produce
   on main after the merge, built from the PR's maps/*.json read as data (see sync-pr-maps.js).
     node tools/comment-pr-preview.js <pr-number> <preview-branch> <manifest.json>
   Does nothing if a comment with the marker is already there: a force-push to the preview branch refreshes the
   images in place (they're linked by branch name), so there's nothing new to say. */
'use strict';
var cp = require('child_process');
var fs = require('fs');

var pr = process.argv[2], branch = process.argv[3], manifestFile = process.argv[4];
if (!pr || !branch || !manifestFile) { console.error('usage: node tools/comment-pr-preview.js <pr-number> <preview-branch> <manifest.json>'); process.exit(2); }
var repo = process.env.GITHUB_REPOSITORY;
if (!repo) { console.error('GITHUB_REPOSITORY is not set'); process.exit(2); }

function gh(args, input) { return cp.execFileSync('gh', args, { encoding: 'utf8', input: input, maxBuffer: 1024 * 1024 * 16 }); }

var MARKER = '<!-- tube-map-gallery-preview -->';
var existing = JSON.parse(gh(['api', 'repos/' + repo + '/issues/' + pr + '/comments', '--paginate', '--jq', '[.[].body]']));
if (existing.some(function (b) { return b.indexOf(MARKER) >= 0; })) { console.log('already commented on #' + pr + '; the preview branch refreshes in place'); process.exit(0); }

var manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
var index = JSON.parse(fs.readFileSync('index.json', 'utf8'));
var byId = {}; index.maps.forEach(function (e) { byId[e.id] = e; });
var rawBase = 'https://raw.githubusercontent.com/' + repo + '/' + branch + '/';

var lines = ['Here’s what this PR would add to the gallery, generated from the map itself:', ''];
manifest.added.concat(manifest.modified).forEach(function (id) {
  var e = byId[id];
  if (!e) return;
  lines.push('### ' + e.title + (manifest.added.indexOf(id) >= 0 ? ' (new)' : ' (updated)'));
  lines.push('![' + e.title + '](' + rawBase + e.thumb + ')');
  lines.push('*' + e.about + '* — by ' + e.by);
  lines.push('');
});
manifest.removed.forEach(function (id) { lines.push('Removes **' + id + '** from the gallery.'); lines.push(''); });
lines.push('This preview updates itself if you push more changes to this PR. The real thumbnail and index entry are only generated once this is merged.');
lines.push(MARKER);

gh(['api', 'repos/' + repo + '/issues/' + pr + '/comments', '-F', 'body=@-'], lines.join('\n'));
console.log('commented on #' + pr);
