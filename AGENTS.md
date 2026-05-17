# Agent Notes

## Project Layout

- `bawk-worker/` is the Cloudflare Worker app.
- `bawk-worker/public/` is served as static assets by Wrangler.
- Source art assets currently live outside the Worker:
  - `models/base-map.glb`
  - `models/npc-*.glb`
  - `animations/*.glb`

## Static Asset Sync

Run this from the repository root after changing map, NPC, or animation source assets:

```sh
mkdir -p bawk-worker/public/assets/models bawk-worker/public/assets/animations
cp models/base-map.glb bawk-worker/public/assets/base-map.glb
cp models/npc-*.glb bawk-worker/public/assets/models/
cp animations/*.glb bawk-worker/public/assets/animations/
node --input-type=module - <<'NODE'
import fs from "node:fs/promises";
import path from "node:path";

const animationDir = path.resolve("animations");
const outputPath = path.resolve("bawk-worker/public/assets/animations/manifest.json");
const files = (await fs.readdir(animationDir))
	.filter((file) => /^(f|m)_.*\.glb$/.test(file))
	.map((file) => file.replace(/\.glb$/, ""))
	.sort();

await fs.writeFile(outputPath, `${JSON.stringify(files, null, 2)}\n`);
NODE
```

This manifest format assumes each animation GLB is a single logical animation. If animation GLBs become multi-clip packs again, the manifest and browser code may need to include clip names per file.

## Worker Commands

Run from `bawk-worker/`:

```sh
npm run build:client
npm run dev
npm test -- --run
```

`npm run dev` rebuilds the client bundle once and starts `wrangler dev`. After code edits, run `npm run build:client`; Wrangler will reload the static bundle.
