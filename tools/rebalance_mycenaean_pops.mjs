import fs from "node:fs";

const popsPath = "main_menu/setup/start/06_pops.txt";
const reportPath = "tools/mycenaean_population_rebalance_report.txt";

const leagueLocations = [
  "amorgos", "andravida", "andritsaina", "andros", "angelokastron", "argos", "balat", "bodonitsa", "bodrum", "candia",
  "cephalonia", "chania", "chios", "corinth", "damala", "elounda", "eretreia", "ermioni", "farsala", "gergeri",
  "hagios_pavlos", "ikaria", "karystos", "karytaina", "kleisoura", "kos", "kymi", "kythnos", "larissa", "leukas",
  "loidoriki", "megara", "milos", "mykonos", "nafpaktos", "nafplio", "naxos", "negroponte", "neopatras", "oreos", "pontikokastro",
  "rethymno", "samos", "siteia", "sporades", "stomio", "thebes", "tripolitsa", "tyrnavos", "viannos", "vonitsa",
  "xylokastro", "zakynthos", "zetounion", "chalandritsa", "kalavryta", "patras", "vostitsa", "athens", "demetrias",
  "atalanti", "gravia", "kalamata", "kyparissia", "leuktron", "modon", "karpathos", "rodos", "astros", "kythira",
  "monemvasia", "mystras", "oitylo", "veligosti", "livadeia", "salona"
];

const profiles = {
  great_mycenae: {
    label: "Tier 1 great palace - Mycenae/Tiryns sphere",
    pops: { nobles: 0.150, clergy: 0.090, burghers: 0.180, peasants: 2.350 }
  },
  great_thebes: {
    label: "Tier 1 great palace - Thebes",
    pops: { nobles: 0.130, clergy: 0.080, burghers: 0.150, peasants: 2.000 }
  },
  great_athens: {
    label: "Tier 1 palace - Athens, important but still pre-classical",
    pops: { nobles: 0.060, clergy: 0.040, burghers: 0.090, peasants: 1.370 }
  },
  great_pylos: {
    label: "Tier 1 great palace - Pylos agricultural administration",
    pops: { nobles: 0.100, clergy: 0.070, burghers: 0.100, peasants: 1.650 }
  },
  great_sparta: {
    label: "Tier 1 palace - Sparta region, warrior aristocracy",
    pops: { nobles: 0.090, clergy: 0.040, burghers: 0.030, peasants: 1.370 }
  },
  great_rhodes: {
    label: "Tier 1 maritime palace - Rhodes",
    pops: { nobles: 0.060, clergy: 0.040, burghers: 0.150, peasants: 1.280 }
  },
  secondary_port_large: {
    label: "Tier 2 important port and regional center",
    pops: { nobles: 0.035, clergy: 0.025, burghers: 0.035, peasants: 0.815 }
  },
  secondary_port: {
    label: "Tier 2 maritime center",
    pops: { nobles: 0.025, clergy: 0.018, burghers: 0.025, peasants: 0.645 }
  },
  secondary_inland: {
    label: "Tier 2 inland agricultural center",
    pops: { nobles: 0.035, clergy: 0.020, burghers: 0.020, peasants: 0.820 }
  },
  secondary_town: {
    label: "Tier 2 regional town",
    pops: { nobles: 0.030, clergy: 0.020, burghers: 0.025, peasants: 0.660 }
  },
  minor_palace: {
    label: "Tier 3 minor palace or heroic center",
    pops: { nobles: 0.030, clergy: 0.020, burghers: 0.020, peasants: 0.530 }
  },
  rural_center: {
    label: "Tier 3 rural center",
    pops: { nobles: 0.010, clergy: 0.006, burghers: 0.004, peasants: 0.342 }
  },
  rural_port: {
    label: "Tier 3 small port",
    pops: { nobles: 0.006, clergy: 0.004, burghers: 0.008, peasants: 0.264 }
  },
  rural_agricultural: {
    label: "Tier 3 agricultural village",
    pops: { nobles: 0.008, clergy: 0.006, peasants: 0.320 }
  },
  rural: {
    label: "Tier 3 rural village",
    pops: { nobles: 0.006, clergy: 0.004, peasants: 0.220 }
  },
  island_small: {
    label: "Tier 3 small island community",
    pops: { clergy: 0.002, burghers: 0.002, peasants: 0.122 }
  },
  island_port: {
    label: "Tier 3 small maritime island port",
    pops: { nobles: 0.005, clergy: 0.004, burghers: 0.008, peasants: 0.224 }
  },
  mountain: {
    label: "Tier 3 sparse mountain or pastoral community",
    pops: { nobles: 0.003, clergy: 0.002, peasants: 0.120 }
  }
};

const assignment = new Map([
  ["argos", "great_mycenae"],
  ["thebes", "great_thebes"],
  ["athens", "great_athens"],
  ["kalamata", "great_pylos"],
  ["mystras", "great_sparta"],
  ["rodos", "great_rhodes"],

  ["corinth", "secondary_port_large"],
  ["candia", "secondary_port_large"],
  ["larissa", "secondary_inland"],
  ["patras", "secondary_town"],
  ["nafplio", "secondary_town"],
  ["chios", "secondary_port"],
  ["samos", "secondary_port"],
  ["chania", "secondary_port"],
  ["naxos", "secondary_port"],

  ["demetrias", "minor_palace"],
  ["balat", "minor_palace"],
  ["livadeia", "rural_center"],
  ["megara", "rural_center"],
  ["farsala", "rural_center"],
  ["andravida", "rural_center"],
  ["tripolitsa", "rural_center"],
  ["tyrnavos", "rural_center"],
  ["chalandritsa", "rural_center"],
  ["kalavryta", "rural_center"],
  ["kyparissia", "rural_center"],
  ["modon", "rural_port"],
  ["nafpaktos", "rural_port"],
  ["rethymno", "rural_port"],
  ["siteia", "rural_port"],
  ["kos", "rural_port"],
  ["bodrum", "rural_port"],
  ["cephalonia", "island_port"],
  ["leukas", "island_port"],
  ["zakynthos", "island_port"],
  ["karystos", "island_port"],
  ["negroponte", "island_port"],
  ["eretreia", "island_port"],
  ["oreos", "rural_port"],
  ["kymi", "rural_port"],
  ["stomio", "rural_port"],
  ["vonitsa", "rural_port"],
  ["xylokastro", "rural_port"],
  ["zetounion", "rural_port"],
  ["elounda", "rural_port"],
  ["pontikokastro", "rural_port"],
  ["astros", "rural_agricultural"],
  ["monemvasia", "rural_port"],
  ["leuktron", "rural_agricultural"],
  ["vostitsa", "rural_port"],
  ["salona", "mountain"],
  ["gravia", "mountain"],
  ["atalanti", "rural_agricultural"],
  ["andritsaina", "mountain"],
  ["angelokastron", "mountain"],
  ["bodonitsa", "mountain"],
  ["karytaina", "mountain"],
  ["kleisoura", "mountain"],
  ["loidoriki", "mountain"],
  ["neopatras", "mountain"],
  ["oitylo", "mountain"],
  ["veligosti", "mountain"],
  ["damala", "rural_agricultural"],
  ["ermioni", "rural_port"],
  ["gergeri", "rural_agricultural"],
  ["viannos", "rural_agricultural"],
  ["hagios_pavlos", "rural"],
  ["karytaina", "mountain"],
  ["nafplio", "secondary_town"],

  ["amorgos", "island_small"],
  ["andros", "island_small"],
  ["ikaria", "island_small"],
  ["kythnos", "island_small"],
  ["milos", "island_small"],
  ["mykonos", "island_small"],
  ["sporades", "island_small"],
  ["karpathos", "island_small"],
  ["kythira", "island_small"]
]);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findBlock(text, location) {
  const re = new RegExp(`(^|\\n)${escapeRegex(location)} = \\{`);
  const match = re.exec(text);
  if (!match) return null;
  const blockStart = match.index + match[1].length;
  const braceStart = text.indexOf("{", blockStart);
  let depth = 0;
  for (let i = braceStart; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return { start: blockStart, end: i + 1, text: text.slice(blockStart, i + 1) };
    }
  }
  return null;
}

function parsePops(block) {
  const pops = [];
  const re = /define_pop = \{\s*type = (\w+)\s*size = ([0-9.]+)\s*culture = ([A-Za-z0-9_]+)\s*religion = ([A-Za-z0-9_]+)\s*\}/g;
  let match;
  while ((match = re.exec(block))) {
    pops.push({ type: match[1], size: Number(match[2]), culture: match[3], religion: match[4] });
  }
  return pops;
}

function dominantIdentity(pops) {
  if (!pops.length) return { culture: "mycenaean", religion: "mycenaean" };
  const byCulture = new Map();
  const byReligion = new Map();
  for (const pop of pops) {
    byCulture.set(pop.culture, (byCulture.get(pop.culture) ?? 0) + pop.size);
    byReligion.set(pop.religion, (byReligion.get(pop.religion) ?? 0) + pop.size);
  }
  const maxKey = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return { culture: maxKey(byCulture), religion: maxKey(byReligion) };
}

function totals(pops) {
  const result = { total: 0, nobles: 0, clergy: 0, burghers: 0, peasants: 0, tribesmen: 0, slaves: 0 };
  for (const pop of pops) {
    result.total += pop.size;
    result[pop.type] = (result[pop.type] ?? 0) + pop.size;
  }
  return result;
}

function popLines(location, profile, identity) {
  const orderedTypes = ["nobles", "clergy", "burghers", "peasants"];
  const lines = [`${location} = {`, `\t# Bronze Age Mycenaean rebalance: ${profile.label}`];
  for (const type of orderedTypes) {
    const size = profile.pops[type] ?? 0;
    if (size <= 0) continue;
    lines.push(`\tdefine_pop = {\ttype = ${type}\tsize = ${size.toFixed(3)}\tculture = ${identity.culture}\treligion = ${identity.religion} }`);
  }
  lines.push("}");
  return lines.join("\n");
}

let text = fs.readFileSync(popsPath, "utf8");
const report = [];
let oldGrand = { total: 0, nobles: 0, clergy: 0, burghers: 0, peasants: 0, tribesmen: 0, slaves: 0 };
let newGrand = { total: 0, nobles: 0, clergy: 0, burghers: 0, peasants: 0, tribesmen: 0, slaves: 0 };

const replacements = [];
for (const location of leagueLocations) {
  const block = findBlock(text, location);
  if (!block) throw new Error(`Missing pop block for ${location}`);
  const oldPops = parsePops(block.text);
  const identity = dominantIdentity(oldPops);
  const key = assignment.get(location) ?? "rural";
  const profile = profiles[key];
  const generated = popLines(location, profile, identity);
  const newPops = parsePops(generated);
  const oldTotals = totals(oldPops);
  const newTotals = totals(newPops);
  for (const k of Object.keys(oldGrand)) {
    oldGrand[k] += oldTotals[k] ?? 0;
    newGrand[k] += newTotals[k] ?? 0;
  }
  replacements.push({ start: block.start, end: block.end, generated });
  report.push({ location, profile: key, label: profile.label, identity, oldTotals, newTotals });
}

replacements.sort((a, b) => b.start - a.start);
for (const replacement of replacements) {
  text = text.slice(0, replacement.start) + replacement.generated + text.slice(replacement.end);
}

fs.writeFileSync(popsPath, text);

function fmt(num) {
  return num.toFixed(3);
}

function pct(part, total) {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0.0%";
}

const lines = [];
const initialBaselineTotal = 96.930; // First pass baseline: 75 original locations plus untouched nafpaktos.
lines.push("Mycenaean population rebalance report");
lines.push("====================================");
lines.push("");
lines.push(`Locations rebalanced: ${leagueLocations.length}`);
lines.push(`Initial pre-rebalance pop size estimate: ${fmt(initialBaselineTotal)}`);
lines.push(`Current input pop size before this run: ${fmt(oldGrand.total)}`);
lines.push(`New total pop size: ${fmt(newGrand.total)}`);
lines.push(`Reduction from initial estimate: ${fmt(initialBaselineTotal - newGrand.total)} (${pct(initialBaselineTotal - newGrand.total, initialBaselineTotal)})`);
lines.push("");
lines.push("New social structure:");
for (const type of ["peasants", "nobles", "clergy", "burghers", "tribesmen", "slaves"]) {
  lines.push(`- ${type}: ${fmt(newGrand[type])} (${pct(newGrand[type], newGrand.total)})`);
}
lines.push("");
lines.push("Location details:");
for (const row of report) {
  lines.push(`- ${row.location}: ${row.label}; ${row.identity.culture}/${row.identity.religion}; ${fmt(row.oldTotals.total)} -> ${fmt(row.newTotals.total)} total`);
}
lines.push("");
lines.push("Tier 1 palace centers:");
for (const location of ["argos", "thebes", "athens", "kalamata", "mystras", "rodos"]) {
  const row = report.find((entry) => entry.location === location);
  lines.push(`- ${location}: ${fmt(row.newTotals.total)} total, peasants ${pct(row.newTotals.peasants, row.newTotals.total)}, nobles ${pct(row.newTotals.nobles, row.newTotals.total)}, clergy ${pct(row.newTotals.clergy, row.newTotals.total)}, burghers ${pct(row.newTotals.burghers, row.newTotals.total)}`);
}

fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);
console.log(lines.slice(0, 18).join("\n"));
