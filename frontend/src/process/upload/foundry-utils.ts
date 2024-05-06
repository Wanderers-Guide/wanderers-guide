import {
  fetchContentSources,
  fetchItemByName,
  fetchLanguageByName,
  fetchSpellByName,
  fetchTraitByName,
} from '@content/content-store';
import { makeRequest } from '@requests/request-manager';
import { ActionCost, ContentSource, Language, Rarity, Size, Trait } from '@typing/content';
import { toLabel } from '@utils/strings';
import { labelToVariable } from '@variables/variable-utils';
import * as _ from 'lodash-es';
import { evaluate } from 'mathjs/number';

export function convertToActionCost(actionType: string, actionValue?: number): ActionCost {
  if (actionType === 'action') {
    if (actionValue === 1) {
      return 'ONE-ACTION';
    } else if (actionValue === 2) {
      return 'TWO-ACTIONS';
    } else if (actionValue === 3) {
      return 'THREE-ACTIONS';
    }
  } else if (actionType === 'reaction') {
    return 'REACTION';
  } else if (actionType === 'free') {
    return 'FREE-ACTION';
  }
  return null;
}

export function convertToRarity(value?: string): Rarity {
  if (value === 'common') {
    return 'COMMON';
  } else if (value === 'uncommon') {
    return 'UNCOMMON';
  } else if (value === 'rare') {
    return 'RARE';
  } else if (value === 'unique') {
    return 'UNIQUE';
  }
  return 'COMMON';
}

export function convertToSize(value?: string): Size {
  switch (value) {
    case 'tiny':
      return 'TINY';
    case 'sm':
      return 'SMALL';
    case 'med':
      return 'MEDIUM';
    case 'lg':
      return 'LARGE';
    case 'huge':
      return 'HUGE';
    case 'grg':
      return 'GARGANTUAN';
    default:
      return (value?.toUpperCase() || 'MEDIUM') as Size;
  }
}

const FOUNDRY_TRAIT_MAP: Record<string, number> = {
  DEADLY_D_12: 2529,
  DEADLY_D_10: 1706,
  DEADLY_D_8: 1852,
  DEADLY_D_6: 1833,
  DEADLY_D_4: 2743,
  DEADLY_D12: 2529,
  DEADLY_D10: 1706,
  DEADLY_D8: 1852,
  DEADLY_D6: 1833,
  DEADLY_D4: 2743,
  VOLLEY_15: 2754,
  VOLLEY_20: 2762,
  VOLLEY_30: 1684,
  VOLLEY_60: 2753,
  ADDITIVE_0: 2763,
  ADDITIVE_1: 1518,
  ADDITIVE_2: 1522,
  ADDITIVE_3: 1509,
  ADDITIVE0: 2763,
  ADDITIVE1: 1518,
  ADDITIVE2: 1522,
  ADDITIVE3: 1509,
  VERSATILE_B: 1690,
  VERSATILE_P: 1854,
  VERSATILE_S: 1837,
  JOUSTING_D_4: 2744,
  JOUSTING_D_6: 1649,
  JOUSTING_D_8: 2745,
  JOUSTING_D_10: 2746,
  JOUSTING_D_12: 2747,
  JOUSTING_D4: 2744,
  JOUSTING_D6: 1649,
  JOUSTING_D8: 2745,
  JOUSTING_D10: 2746,
  JOUSTING_D12: 2747,
  TWO_HAND_D_4: 2750,
  TWO_HAND_D_6: 2749,
  TWO_HAND_D_8: 1831,
  TWO_HAND_D_10: 1644,
  TWO_HAND_D_12: 1597,
  TWO_HAND_D4: 2750,
  TWO_HAND_D6: 2749,
  TWO_HAND_D8: 1831,
  TWO_HAND_D10: 1644,
  TWO_HAND_D12: 1597,
  FREE_HAND: 1714,
  THROWN_5: 2756,
  THROWN_10: 1626,
  THROWN_15: 2755,
  THROWN_20: 1843,
  THROWN_25: 2757,
  THROWN_30: 2758,
  FATAL_D_12: 1670,
  FATAL_D_10: 1686,
  FATAL_D_8: 1653,
  FATAL_D_6: 2760,
  FATAL_D_4: 2761,
  FATAL_D12: 1670,
  FATAL_D10: 1686,
  FATAL_D8: 1653,
  FATAL_D6: 2760,
  FATAL_D4: 2761,
};

export async function getTraitIds(traitNames: string[], source: ContentSource) {
  const sources = await fetchContentSources({ ids: 'all', homebrew: false });

  const traitIds: number[] = [];
  for (const traitName of traitNames) {
    let trait = await fetchTraitByName(
      traitName,
      sources.map((s) => s.id)
    );
    if (!trait) {
      const traitId = FOUNDRY_TRAIT_MAP[traitName.trim().toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_')];
      if (traitId) {
        traitIds.push(traitId);
        continue;
      }
    }

    if (!trait) {
      console.error(
        `Trait not found: ${traitName}, ${traitName.trim().toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_')}`
      );
      await createTrait(toLabel(traitName), '', source.id);
      trait = await fetchTraitByName(
        traitName,
        sources.map((s) => s.id)
      );
    }
    if (trait) {
      traitIds.push(trait.id);
    }
  }
  return traitIds;
}

export async function getLanguageIds(languageNames: string[], source: ContentSource) {
  const sources = await fetchContentSources();

  const languageIds: number[] = [];
  for (const languageName of languageNames) {
    let languages = await fetchLanguageByName(
      languageName,
      sources.map((s) => s.id)
    );
    if (!languages || languages.length === 0) {
      await createLanguage(toLabel(languageName), '', 'COMMON', source.id);
      languages = await fetchLanguageByName(
        languageName,
        sources.map((s) => s.id)
      );
    }
    if (languages && languages.length > 0) {
      languageIds.push(languages[0].id);
    }
  }
  return languageIds;
}

export async function getSpellIds(spellNames: string[]) {
  const sources = await fetchContentSources();

  const spellIds: number[] = [];
  for (const spellName of spellNames) {
    const spells = await fetchSpellByName(
      spellName,
      sources.map((s) => s.id)
    );
    if (spells && spells.length > 0) {
      spellIds.push(spells[0].id);
    } else {
      console.warn(`Spell not found: ${spellName}`);
    }
  }
  return spellIds;
}

export async function getItemIds(itemNames: string[]) {
  const sources = await fetchContentSources();

  const itemIds: number[] = [];
  for (const itemName of itemNames) {
    const items = await fetchItemByName(
      itemName,
      sources.map((s) => s.id)
    );
    if (items && items.length > 0) {
      itemIds.push(items[0].id);
    } else {
      console.warn(`Item not found: ${itemName}`);
    }
  }
  return itemIds;
}

async function createTrait(
  name: string,
  description: string,
  content_source_id: number,
  meta_data?: Record<string, any>
) {
  return await makeRequest<Trait>('create-trait', {
    name,
    description,
    meta_data,
    content_source_id,
  });
}

async function createLanguage(
  name: string,
  description: string,
  rarity: Rarity,
  content_source_id: number,
  meta_data?: Record<string, any>
) {
  return await makeRequest<Language>('create-language', {
    name,
    speakers: '',
    script: '',
    rarity,
    description,
    meta_data,
    content_source_id,
  });
}

export async function findContentSource(id?: number, foundry_id?: string) {
  return await makeRequest<ContentSource>('find-content-source', {
    id,
    foundry_id: foundry_id === 'Pathfinder Core Rulebook' ? 'Pathfinder Player Core' : foundry_id,
  });
}

export function extractFromDescription(description?: string) {
  if (!description)
    return {
      description: '',
    };

  const pattern =
    /<p><strong>(Frequency|Trigger|Requirements|Area|Craft Requirements|Special|Heightened (.*?))<\/strong>(.*?)<\/p>/gs;

  const output: Record<string, string | Record<string, string>[]> = {};
  let match;
  while ((match = pattern.exec(description)) !== null) {
    const label = match[1].trim().toLowerCase().replace(/\s/g, '_');
    const heightenedAmount = (match[2] ?? '').trim();
    const text = match[3].trim();

    if (label.startsWith('heightened')) {
      if (!output.heightened) {
        output.heightened = [];
      }
      if (!_.isString(output.heightened)) {
        output.heightened.push({
          amount: heightenedAmount,
          text: text,
        });
      }
    } else {
      output[label] = text;
    }
  }

  output.description = description.replace(pattern, '');

  return output as Record<string, string>;
}

export const EQUIPMENT_TYPES = ['equipment', 'weapon', 'armor', 'shield', 'kit', 'consumable', 'backpack', 'treasure'];

//// Foundry Content Linking Parsing & Removal ////
// - Maybe save some of this data instead of deleting it all
export function stripFoundryLinking(text: string, level?: number) {
  text = text.replace(/@actor\.level/g, '1');
  if (level) {
    text = text.replace(/@item\.level/g, `${level}`);
  }

  text = stripCompendiumLinks(text);
  text = stripDamageLinks(text);
  text = stripCheckLinks(text, true);
  text = stripCheckLinks(text, false);
  text = stripDistanceLinks(text);
  text = stripMathLinks(text);
  text = stripNpcLinks(text);

  return text;
}

function stripDamageLinks(text: string) {
  const regex = /@Damage\[([^\]]+)d(\d+)\[([^\]]+)\]\]/gm;

  let newText = text;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const formula = match[1];
    const diceType = match[2];
    const damageType = match[3];

    let result = formula;
    try {
      result = evaluate(formula);
    } catch (e) {
      console.warn(e, formula);
    }

    newText = newText.replace(match[0], `${result}d${diceType} ${damageType}`);
  }

  // Alt version
  const regex2 = /@Damage\[([^\]]+)\[([^\]]+)\]\]/gm;
  while ((match = regex2.exec(text)) !== null) {
    const formula = match[1];
    const damageType = match[2];

    let result = formula;
    try {
      result = evaluate(formula);
    } catch (e) {
      console.warn(e, formula);
    }

    newText = newText.replace(match[0], `${result} ${damageType}`);
  }

  return newText;
}

function stripMathLinks(text: string) {
  const regex = /\[\[([^\]]+?)\(([^\]]+)\)\[([^\]]+)\]\]\]/gm;

  let newText = text;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const beginning = match[1];
    const formula = match[2];
    let words = match[3];
    words = words.replace(/[, ]/g, ' ');

    let result = formula;
    try {
      result = evaluate(formula);
    } catch (e) {
      console.warn(e, formula);
    }

    newText = newText.replace(match[0], `${result} ${words}`);
  }

  return newText;
}

function stripCheckLinks(text: string, basic: boolean) {
  const regex = basic
    ? /@Check\[type:([^\]]+)\|([^\]]+)\|basic:true\]/gm
    : /@Check\[type:([^\]]+)\|([^\]]+)\|basic:false\]/gm;

  let newText = text;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const type = match[1];
    const extra = match[2];

    newText = newText.replace(match[0], `basic ${toLabel(type)}`);
  }

  // Alt version
  const regex2 = /@Check\[type:([^\]]+)\|dc:([^\]]+)\]/gm;
  while ((match = regex2.exec(text)) !== null) {
    const type = match[1];
    const dc = match[2];

    newText = newText.replace(match[0], `${toLabel(type)} ${dc}`);
  }

  return newText;
}

function stripDistanceLinks(text: string) {
  const regex = /@Template\[type:([^\]]+)\|distance:([^\]]+)\]/gm;

  let newText = text;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const type = match[1];
    const distance = match[2];

    newText = newText.replace(match[0], `${distance}-foot ${type}`);
  }

  return newText;
}

function stripCompendiumLinks(text: string) {
  const regex = /@UUID\[Compendium\.([^\]]+)\]/gm;

  let newText = text;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const contentParts = match[1].split('.');
    const name = contentParts[contentParts.length - 1];

    // We convert them to a potential content link for further processing
    newText = newText.replace(match[0], `[[${name}]]`);
  }

  return newText;
}

function stripNpcLinks(text: string) {
  const regex = /@Localize\[PF2E\.NPC\.Abilities\.Glossary\.([^\]]+)\]/gm;

  let newText = text;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1];

    newText = newText.replace(match[0], `${name}`);
  }

  return newText;
}
