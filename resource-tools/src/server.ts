import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const root = process.cwd();
const instancesDir = path.join(root, 'systems', '5e2024', 'resource_instances');
const value = (v: unknown) => ({ value: v });
const now = () => new Date().toISOString().replace('Z', '000');
const slug = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const nestedMeta = () => ({ id: randomUUID(), updated_at: value(now()) });

async function save(resourceId: string, id: string, document: unknown, overwrite: boolean) {
  await mkdir(instancesDir, { recursive: true });
  const file = path.join(instancesDir, `${resourceId}_${slug(id)}.rpg.json`);
  if (!overwrite) {
    try { await readFile(file); throw new Error(`Resource already exists: ${path.relative(root, file)}. Set overwrite=true to replace it.`); }
    catch (error: any) { if (error.code !== 'ENOENT') throw error; }
  }
  await writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
  return path.relative(root, file);
}

const common = { id: z.string().min(1).optional(), name: z.string().min(1), source: z.string().default('wayhouse_campaign'), overwrite: z.boolean().default(false) };
const trait = z.object({ name: z.string().min(1), description: z.string().default('') });
const action = z.object({ name: z.string().min(1), description: z.string().default(''), type: z.enum(['none', 'melee', 'ranged', 'melee_or_ranged']).default('none'), attackBonus: z.number().int().default(0) });

function makeTrait(input: z.infer<typeof trait>) { return { resource_id: 'monster_trait', stats: { trait_name: value(input.name), trait_description: value(input.description), ...nestedMeta() } }; }
function makeAction(input: z.infer<typeof action>) { return { resource_id: 'monster_action', stats: { action_name: value(input.name), action_description: value(input.description), action_type: value(input.type), action_attack_bonus: value(input.attackBonus), action_damage_variants: value([]), ...nestedMeta() } }; }

function buildServer() {
  const server = new McpServer({ name: 'wayhouse-rpg-companion', version: '0.1.0' });

  server.registerTool('create_item', {
    description: 'Create an RPG Companion App 5e item resource instance in the Wayhouse repository.',
    inputSchema: z.object({ ...common, description: z.string().default(''), type: z.string().default('adventuring_gear'), rarity: z.string().default('common'), isMagic: z.boolean().default(false), requiresAttunement: z.boolean().default(false) })
  }, async (input) => {
    const id = input.id ?? slug(input.name);
    const document = { system: '5e2024', resource_id: 'item', stats: { id, name: value(input.name), source: value(input.source), description: value(input.description), type: value(input.type), rarity: value(input.rarity), is_magic: value(input.isMagic), requires_attunement: value(input.requiresAttunement), is_cursed: value(false), is_intelligent: value(false), is_spellcasting_focus: value(false), effects: value([]), quantity: value(1), updated_at: value(now()) } };
    const file = await save('item', id, document, input.overwrite);
    return { content: [{ type: 'text', text: `Created ${file}` }], structuredContent: { file, id } };
  });

  server.registerTool('create_monster', {
    description: 'Create an RPG Companion App 5e monster resource instance in the Wayhouse repository.',
    inputSchema: z.object({ ...common, armorClass: z.number().int().default(10), hitDice: z.object({ amount: z.number().int().nonnegative(), die: z.enum(['d4','d6','d8','d10','d12','d20']), modifier: z.number().int().default(0) }).default({ amount: 1, die: 'd8', modifier: 0 }), cr: z.string().default('cr_0'), xp: z.number().int().nonnegative().default(0), initiative: z.number().int().default(0), speed: z.number().int().nonnegative().default(30), burrowSpeed: z.number().int().nonnegative().default(0), climbSpeed: z.number().int().nonnegative().default(0), flySpeed: z.number().int().nonnegative().default(0), swimSpeed: z.number().int().nonnegative().default(0), abilities: z.object({ str: z.number().int().default(10), dex: z.number().int().default(10), con: z.number().int().default(10), int: z.number().int().default(10), wis: z.number().int().default(10), cha: z.number().int().default(10) }).default({ str:10,dex:10,con:10,int:10,wis:10,cha:10 }), size: z.string().default('medium'), creatureType: z.string().default('humanoid'), alignment: z.string().default('true_neutral'), tag: z.string().default(''), skills: z.string().default(''), vulnerabilities: z.string().default(''), resistances: z.string().default(''), immunities: z.string().default(''), senses: z.string().default(''), languages: z.string().default(''), traits: z.array(trait).default([]), actions: z.array(action).default([]), bonusActions: z.array(action).default([]), reactions: z.array(action).default([]), legendaryActions: z.array(action).default([]) })
  }, async (input) => {
    const id = input.id ?? slug(input.name); const a = input.abilities; const hp = { resource_id: 'dice_roll', stats: { dice_amount: value(input.hitDice.amount), dice_type: value(input.hitDice.die), constant: value(input.hitDice.modifier), ...nestedMeta() } };
    const stats: any = { id, name: value(input.name), source: value(input.source), tag: value(input.tag), armor_class: value(input.armorClass), hit_points: value(hp), cr: value(input.cr), xp: value(input.xp), initiative: value(input.initiative), speed: value(input.speed), burrow_speed: value(input.burrowSpeed), climb_speed: value(input.climbSpeed), fly_speed: value(input.flySpeed), swim_speed: value(input.swimSpeed), strength_score: value(a.str), dexterity_score: value(a.dex), constitution_score: value(a.con), intelligence_score: value(a.int), wisdom_score: value(a.wis), charisma_score: value(a.cha), strength_saving_throw_modifier: value(0), dexterity_saving_throw_modifier: value(0), constitution_saving_throw_modifier: value(0), intelligence_saving_throw_modifier: value(0), wisdom_saving_throw_modifier: value(0), charisma_saving_throw_modifier: value(0), skills: value(input.skills), gear: value(''), vulnerabilities: value(input.vulnerabilities), resistances: value(input.resistances), immunities: value(input.immunities), senses: value(input.senses), languages: value(input.languages), size: value(input.size), type: value(input.creatureType), alignment: value(input.alignment), traits: value(input.traits.map(makeTrait)), actions: value(input.actions.map(makeAction)), bonus_actions: value(input.bonusActions.map(makeAction)), reactions: value(input.reactions.map(makeAction)), legendary_actions: value(input.legendaryActions.map(makeAction)), spells: value([]), habitat: value([]), treasure: value([]), updated_at: value(now()) };
    const file = await save('monster', id, { system: '5e2024', resource_id: 'monster', stats }, input.overwrite);
    return { content: [{ type: 'text', text: `Created ${file}` }], structuredContent: { file, id } };
  });

  server.registerTool('create_encounter', {
    description: 'Create an encounter template using monsters that already exist in this repository.',
    inputSchema: z.object({ ...common, description: z.string().default(''), monsters: z.array(z.object({ id: z.string().min(1), min: z.number().int().positive().default(1), max: z.number().int().positive().default(1), weight: z.number().positive().default(1) })).min(1) })
  }, async (input) => {
    const pool = [];
    for (const entry of input.monsters) {
      const file = path.join(instancesDir, `monster_${slug(entry.id)}.rpg.json`);
      const monster = JSON.parse(await readFile(file, 'utf8'));
      pool.push({ system: '5e2024', resource_id: 'monster_combat_template_entry', stats: { min: value(entry.min), max: value(entry.max), weight: value(entry.weight), combatant: value({ resource_id: 'monster', stats: monster.stats }), ...nestedMeta() } });
    }
    const id = input.id ?? slug(input.name); const stats = { id, name: value(input.name), description: value(input.description), source: value(input.source), combatant_pool: value(pool), updated_at: value(now()) };
    const file = await save('encounter_template', id, { system: '5e2024', resource_id: 'encounter_template', stats }, input.overwrite);
    return { content: [{ type: 'text', text: `Created ${file}` }], structuredContent: { file, id } };
  });

  server.registerTool('list_resources', { description: 'List Wayhouse RPG Companion resource instances.', inputSchema: z.object({ type: z.enum(['all','item','monster','encounter_template']).default('all') }), annotations: { readOnlyHint: true } }, async ({ type }) => {
    const files = (await readdir(instancesDir)).filter(f => f.endsWith('.rpg.json') && (type === 'all' || f.startsWith(`${type}_`))).sort();
    return { content: [{ type: 'text', text: files.join('\n') || 'No resources yet.' }], structuredContent: { files } };
  });
  return server;
}

serveStdio(buildServer);
