#!/usr/bin/env node
/**
 * Local image admin — list folders/files under a root and move/rename with dry-run by default.
 *
 * Usage:
 *   node scripts/image-admin.mjs list
 *   node scripts/image-admin.mjs list --root "GT TRAILERS"
 *   node scripts/image-admin.mjs list --json
 *   node scripts/image-admin.mjs move images/old.png images/trailers/digger/new.png
 *   node scripts/image-admin.mjs move images/old.png images/trailers/digger/new.png --apply
 *
 * Paths are relative to the project root (parent of scripts/). Moves stay under that root.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp']);

function parseArgs(argv) {
    const args = { _: [], flags: {} };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--root') {
            args.flags.root = argv[++i];
        } else if (a === '--apply') {
            args.flags.apply = true;
        } else if (a === '--json') {
            args.flags.json = true;
        } else if (a === '--files-only') {
            args.flags.filesOnly = true;
        } else if (a.startsWith('--')) {
            console.error(`Unknown flag: ${a}`);
            process.exit(1);
        } else {
            args._.push(a);
        }
    }
    return args;
}

function resolveUnderProject(rel) {
    const cleaned = rel.replace(/^[/\\]+/, '');
    const resolved = path.resolve(PROJECT_ROOT, cleaned);
    const relBack = path.relative(PROJECT_ROOT, resolved);
    if (relBack.startsWith('..') || path.isAbsolute(relBack)) {
        throw new Error(`Path must stay under project root: ${rel}`);
    }
    return resolved;
}

function walkFiles(dir, { filesOnly } = {}) {
    const out = [];
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
        if (e.code === 'ENOENT') return out;
        throw e;
    }
    for (const ent of entries) {
        const full = path.join(dir, ent.name);
        const rel = path.relative(PROJECT_ROOT, full).split(path.sep).join('/');
        if (ent.isDirectory()) {
            if (!filesOnly) {
                out.push({ kind: 'dir', rel, full });
            }
            out.push(...walkFiles(full, { filesOnly }));
        } else {
            const ext = path.extname(ent.name).toLowerCase();
            if (filesOnly && !IMAGE_EXT.has(ext)) continue;
            out.push({ kind: 'file', rel, full, ext });
        }
    }
    return out;
}

function cmdList(flags) {
    const rootRel = flags.root || 'images';
    const rootFull = resolveUnderProject(rootRel);
    if (!fs.existsSync(rootFull)) {
        console.error(`Root does not exist: ${rootRel}`);
        process.exit(1);
    }
    const items = walkFiles(rootFull, { filesOnly: flags.filesOnly });
    if (flags.json) {
        console.log(JSON.stringify(items, null, 2));
        return;
    }
    console.log(`Project: ${PROJECT_ROOT}`);
    console.log(`Root:    ${rootRel}\n`);
    for (const item of items) {
        const tag = item.kind === 'dir' ? '[dir] ' : '      ';
        console.log(`${tag}${item.rel}`);
    }
    const files = items.filter((i) => i.kind === 'file');
    const dirs = items.filter((i) => i.kind === 'dir');
    console.log(`\n${dirs.length} folders, ${files.length} files.`);
}

function cmdMove(fromRel, toRel, flags) {
    const from = resolveUnderProject(fromRel);
    const to = resolveUnderProject(toRel);
    if (!fs.existsSync(from)) {
        console.error(`Source not found: ${fromRel}`);
        process.exit(1);
    }
    const stat = fs.statSync(from);
    if (!stat.isFile()) {
        console.error(`Source must be a file: ${fromRel}`);
        process.exit(1);
    }
    const destDir = path.dirname(to);
    const dry = !flags.apply;
    console.log(dry ? 'DRY RUN (no changes). Use --apply to execute.\n' : 'APPLYING move…\n');
    console.log(`  From: ${path.relative(PROJECT_ROOT, from)}`);
    console.log(`  To:   ${path.relative(PROJECT_ROOT, to)}`);
    if (fs.existsSync(to)) {
        console.error('\nError: destination already exists.');
        process.exit(1);
    }
    if (!dry) {
        fs.mkdirSync(destDir, { recursive: true });
        fs.renameSync(from, to);
        console.log('\nDone.');
    } else {
        console.log('\nWould create parent dirs if needed, then rename.');
    }
}

function printUsage() {
    console.log(`
Image admin (local only) — GT Trailers

  node scripts/image-admin.mjs list [--root <dir>] [--files-only] [--json]
  node scripts/image-admin.mjs move <from> <to> [--apply]

  --root <dir>   Folder under project to scan (default: images)
                 Example: --root "GT TRAILERS"

  move is dry-run unless you pass --apply.

Category workflow: pick a folder layout under images/, e.g.
  images/trailers/digger/   images/trailers/boat/   images/accessories/
Then move files into the right folder with descriptive names:

  node scripts/image-admin.mjs move images/IMG_8451.jpg images/trailers/digger/digger-max-3500-deck.jpg --apply

After moving, update HTML/CSS paths to match (search repo for old path).
`);
}

const argv = process.argv.slice(2);
if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help') {
    printUsage();
    process.exit(argv.length === 0 ? 0 : 0);
}

const { _, flags } = parseArgs(argv);
const cmd = _[0];

if (cmd === 'list') {
    cmdList(flags);
} else if (cmd === 'move') {
    const from = _[1];
    const to = _[2];
    if (!from || !to) {
        console.error('Usage: node scripts/image-admin.mjs move <from> <to> [--apply]');
        process.exit(1);
    }
    cmdMove(from, to, flags);
} else {
    printUsage();
    process.exit(1);
}
