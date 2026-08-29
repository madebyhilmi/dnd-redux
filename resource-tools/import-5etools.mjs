import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const input = process.argv[2];
const encounterInput = process.argv[3];
if (!input) throw new Error('Usage: node resource-tools/import-5etools.mjs <bestiary.json> [encounter.json]');
const data = JSON.parse(await readFile(input, 'utf8'));
const out = path.resolve('systems/wayhouse-5e2024/resource_instances');
await mkdir(out, { recursive: true });
const value = value => ({ value });
const stamp = () => new Date().toISOString().replace('Z', '000');
const slug = text => text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const meta = () => ({ id: randomUUID(), updated_at: value(stamp()) });
const clean = text => String(text ?? '')
  .replace(/\{@hit ([+-]?\d+)\}/g, '$1')
  .replace(/\{@damage ([^}]+)\}/g, '$1')
  .replace(/\{@dc (\d+)\}/g, 'DC $1')
  .replace(/\{@(?:condition|creature|variantrule) ([^}|]+)(?:\|[^}]*)?\}/g, '$1')
  .replace(/\{@(?:atkr|actSave|actSaveFail|actSaveSuccess|actTrigger|actResponse|recharge)[^}]*\}/g, '')
  .replace(/\{@h\}/g, 'Hit:').replace(/\s+/g, ' ').trim();
const entries = x => (x?.entries ?? []).map(e => typeof e === 'string' ? clean(e) : clean(JSON.stringify(e))).join('\n\n');
const crId = cr => `cr_${String(cr ?? '0').replace('/', '_')}`;
const xpByCr = { '0':0,'1/8':25,'1/4':50,'1/2':100,'1':200,'2':450,'3':700,'4':1100,'5':1800,'6':2300,'7':2900,'8':3900,'9':5000,'10':5900 };
const alignment = a => ({ 'L,E':'lawful_evil','L,G':'lawful_good','N,E':'neutral_evil','N,G':'neutral_good','C,E':'chaotic_evil','C,G':'chaotic_good','N':'true_neutral','U':'unaligned' }[a?.join(',')] ?? 'true_neutral');
const size = s => ({ T:'tiny',S:'small',M:'medium',L:'large',H:'huge',G:'gargantuan' }[s?.[0]] ?? 'medium');
const action = a => ({ resource_id:'monster_action', stats:{ action_name:value(clean(a.name)), action_description:value(entries(a)), action_type:value(/\{@atkr m,r/.test(JSON.stringify(a))?'melee_or_ranged':/\{@atkr m/.test(JSON.stringify(a))?'melee':/\{@atkr r/.test(JSON.stringify(a))?'ranged':'none'), action_attack_bonus:value(Number(JSON.stringify(a).match(/\{@hit ([+-]?\d+)/)?.[1] ?? 0)), action_damage_variants:value([]), ...meta() } });
const trait = t => ({ resource_id:'monster_trait', stats:{ trait_name:value(clean(t.name)), trait_description:value(entries(t)), ...meta() } });

for (const m of data.monster ?? []) {
  const id = slug(m.name); const formula = m.hp?.formula ?? '1d8'; const hit = formula.match(/(\d+)d(\d+)\s*([+-]\s*\d+)?/i);
  const stats = { id, name:value(m.name), source:value('wayhouse_campaign'), tag:value(typeof m.type === 'object' ? (m.type.tags ?? []).join(', ') : ''), armor_class:value(Number(typeof m.ac?.[0] === 'object' ? m.ac[0].ac : m.ac?.[0] ?? 10)), hit_points:value({resource_id:'dice_roll',stats:{dice_amount:value(Number(hit?.[1]??1)),dice_type:value(`d${hit?.[2]??8}`),constant:value(Number((hit?.[3]??'0').replace(/\s/g,''))),...meta()}}), cr:value(crId(m.cr)), xp:value(xpByCr[String(m.cr)] ?? 0), initiative:value(Math.floor(((m.dex??10)-10)/2)), speed:value(Number(m.speed?.walk??30)), burrow_speed:value(Number(m.speed?.burrow??0)), climb_speed:value(Number(m.speed?.climb??0)), fly_speed:value(Number(m.speed?.fly??0)), swim_speed:value(Number(m.speed?.swim??0)), strength_score:value(m.str??10), dexterity_score:value(m.dex??10), constitution_score:value(m.con??10), intelligence_score:value(m.int??10), wisdom_score:value(m.wis??10), charisma_score:value(m.cha??10), strength_saving_throw_modifier:value(Number(m.save?.str??0)), dexterity_saving_throw_modifier:value(Number(m.save?.dex??0)), constitution_saving_throw_modifier:value(Number(m.save?.con??0)), intelligence_saving_throw_modifier:value(Number(m.save?.int??0)), wisdom_saving_throw_modifier:value(Number(m.save?.wis??0)), charisma_saving_throw_modifier:value(Number(m.save?.cha??0)), skills:value(Object.entries(m.skill??{}).map(([k,v])=>`${k} ${v}`).join(', ')), gear:value((m.gear??[]).map(String).join(', ')), vulnerabilities:value((m.vulnerable??[]).join(', ')), resistances:value((m.resist??[]).map(String).join(', ')), immunities:value((m.immune??[]).map(String).join(', ')), senses:value((m.senses??[]).join(', ')), languages:value((m.languages??[]).join(', ')), size:value(size(m.size)), type:value(typeof m.type==='string'?m.type:m.type?.type??'humanoid'), alignment:value(alignment(m.alignment)), traits:value((m.trait??[]).map(trait)), actions:value((m.action??[]).map(action)), bonus_actions:value((m.bonus??[]).map(action)), reactions:value((m.reaction??[]).map(action)), legendary_actions:value((m.legendary??[]).map(action)), spells:value([]), habitat:value(m.environment??[]), treasure:value(m.treasure??[]), updated_at:value(stamp()) };
  await writeFile(path.join(out, `monster_${id}.rpg.json`), `${JSON.stringify({system:'wayhouse-5e2024',resource_id:'monster',stats},null,2)}\n`);
  process.stderr.write(`Imported ${m.name}\n`);
}

if (encounterInput) {
  const encounter = JSON.parse(await readFile(encounterInput, 'utf8'));
  const pool = [];
  for (const item of encounter.items ?? []) {
    const encodedName = String(item.h).split('_')[0];
    const monsterId = slug(decodeURIComponent(encodedName));
    const monster = JSON.parse(await readFile(path.join(out, `monster_${monsterId}.rpg.json`), 'utf8'));
    pool.push({ system:'wayhouse-5e2024', resource_id:'monster_combat_template_entry', stats:{ min:value(item.c??1), max:value(item.c??1), weight:value(1), combatant:value({resource_id:'monster',stats:monster.stats}), ...meta() } });
  }
  const id = 'hive_assault';
  const stats = { id, name:value('Hive Assault'), description:value('A hard encounter for three level-5 characters at the Wayhouse.'), source:value('wayhouse_campaign'), combatant_pool:value(pool), updated_at:value(stamp()) };
  await writeFile(path.join(out, `encounter_template_${id}.rpg.json`), `${JSON.stringify({system:'wayhouse-5e2024',resource_id:'encounter_template',stats},null,2)}\n`);
  process.stderr.write('Imported Hive Assault\n');
}
