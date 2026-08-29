import { cp, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { gzipSync, gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const compiledRoot = process.argv[2];
const releaseRoot = process.argv[3] ?? '.release';
if (!compiledRoot) throw new Error('Usage: node resource-tools/prepare-release.mjs <dev-output> [release-folder]');

const oldId = 'wayhouse-5e2024';
const systemId = '5e2024';
const sourceSystem = path.join(compiledRoot, oldId);
const targetSystem = path.resolve(releaseRoot, systemId);

await mkdir(targetSystem, { recursive: true });
await cp(sourceSystem, targetSystem, { recursive: true, force: true });

const patchJson = object => JSON.parse(JSON.stringify(object).replaceAll(oldId, systemId).replaceAll('Wayhouse 5e 2024', '5.5e').replaceAll('WH24', '5.5e'));
const writeGzipJson = async (file, object) => writeFile(file, gzipSync(`${JSON.stringify(object, null, 2)}\n`));

const compiledSystem = patchJson(JSON.parse(gunzipSync(await readFile(path.join(targetSystem, 'system.rpg')))));
compiledSystem.id = systemId;
compiledSystem.name = '5.5e';
compiledSystem.abbreviation = '5.5e';
compiledSystem.version = '0.8.1';
await writeGzipJson(path.join(targetSystem, 'system.rpg'), compiledSystem);
const composedPath = path.join(targetSystem, 'system.composed.json');
const composedSystem = patchJson(JSON.parse(await readFile(composedPath, 'utf8')));
composedSystem.id = systemId;
composedSystem.name = '5.5e';
composedSystem.abbreviation = '5.5e';
composedSystem.version = '0.8.1';
await writeFile(composedPath, `${JSON.stringify(composedSystem, null, 2)}\n`);

const resourcesDir = path.join(targetSystem, 'resources');
for (const file of await readdir(resourcesDir)) {
  if (!file.endsWith('.rpg')) continue;
  const fullPath = path.join(resourcesDir, file);
  const resource = patchJson(JSON.parse(gunzipSync(await readFile(fullPath))));
  resource.system = systemId;
  await writeGzipJson(fullPath, resource);
}

const systems = { systems: [{ id: systemId, name: '5.5e', abbreviation: '5.5e', version: '0.8.1', min_app_version: '1.2.0', path: systemId }] };
await writeFile(path.resolve(releaseRoot, 'systems.json'), `${JSON.stringify(systems, null, 2)}\n`);
await writeGzipJson(path.resolve(releaseRoot, 'systems.rpg'), systems);

const resourcesJson = JSON.parse(await readFile(path.join(targetSystem, 'resources.json'), 'utf8'));
await writeFile(path.join(targetSystem, 'resources.json'), `${JSON.stringify(resourcesJson, null, 2)}\n`);
await writeGzipJson(path.join(targetSystem, 'resources.rpg'), resourcesJson);

const archive = path.join(targetSystem, 'resources.rpg.gzip');
const temporaryArchive = `${archive}.tmp`;
execFileSync('tar', ['-czf', temporaryArchive, '-C', targetSystem, 'resources']);
await rename(temporaryArchive, archive);

console.error(`Prepared canonical ${systemId} release at ${path.resolve(releaseRoot)}`);
