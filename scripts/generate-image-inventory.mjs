#!/usr/bin/env node
/**
 * Build image-inventory.json for admin.html (static listing of folders + image files).
 *
 *   node scripts/generate-image-inventory.mjs
 *   node scripts/generate-image-inventory.mjs --root "GT TRAILERS"
 *
 * Re-run after adding/moving images, then commit image-inventory.json if the admin page should stay current on deploy.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(PROJECT_ROOT, 'image-inventory.json');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.ico']);

function parseArgs(argv) {
    const roots = ['images'];
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--root' && argv[i + 1]) {
            roots.push(argv[++i]);
        }
    }
    return { roots: [...new Set(roots)] };
}

function buildTree(absDir, relBase) {
    const name = path.basename(absDir);
    const node = {
        type: 'dir',
        name,
        path: relBase.split(path.sep).join('/'),
        children: [],
    };

    let entries;
    try {
        entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
        return node;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const ent of entries) {
        const full = path.join(absDir, ent.name);
        const rel = path.join(relBase, ent.name);
        if (ent.isDirectory()) {
            node.children.push(buildTree(full, rel));
        } else {
            const ext = path.extname(ent.name).toLowerCase();
            if (!IMAGE_EXT.has(ext)) continue;
            let size = 0;
            try {
                size = fs.statSync(full).size;
            } catch {
                /* ignore */
            }
            node.children.push({
                type: 'file',
                name: ent.name,
                path: rel.split(path.sep).join('/'),
                ext,
                size,
            });
        }
    }

    node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return node;
}

function countNodes(tree, counts = { dirs: 0, files: 0 }) {
    if (tree.type === 'file') {
        counts.files++;
        return counts;
    }
    counts.dirs++;
    for (const c of tree.children || []) countNodes(c, counts);
    return counts;
}

const { roots } = parseArgs(process.argv.slice(2));
const trees = [];
const missing = [];

for (const relRoot of roots) {
    const abs = path.join(PROJECT_ROOT, relRoot);
    if (!fs.existsSync(abs)) {
        missing.push(relRoot);
        continue;
    }
    const st = fs.statSync(abs);
    if (!st.isDirectory()) continue;
    trees.push({
        root: relRoot.replace(/\\/g, '/'),
        tree: buildTree(abs, relRoot),
    });
}

const payload = {
    generatedAt: new Date().toISOString(),
    project: path.basename(PROJECT_ROOT),
    roots: trees.map((t) => t.root),
    missingRoots: missing,
    forests: trees,
};

let totalFiles = 0;
let totalDirs = 0;
for (const { tree } of trees) {
    const c = countNodes(tree);
    totalFiles += c.files;
    totalDirs += c.dirs;
}
payload.summary = { imageFiles: totalFiles, folders: totalDirs };

fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
console.log(`Wrote ${path.relative(PROJECT_ROOT, OUT_FILE)}`);
console.log(`  Roots: ${payload.roots.join(', ')}`);
if (missing.length) console.log(`  Missing (skipped): ${missing.join(', ')}`);
console.log(`  Folders: ${totalDirs}, image files: ${totalFiles}`);
