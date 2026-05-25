import fs from "fs";
import path from "path";

const root = path.resolve(".");
const vanillaRoot =
  process.env.EU5_GAME_ROOT ||
  "D:/SteamLibrary/steamapps/common/Europa Universalis V/game";
const vanillaCultureDir = path.join(vanillaRoot, "in_game/common/cultures");

const requestedGroups = [
  ["egypt_nile_group", "Egypt and Nile", ["egyptian", "upper_egyptian", "lower_egyptian", "nubian", "medjay", "libyan"]],
  ["mesopotamian_group", "Mesopotamian", ["sumerian", "akkadian", "babylonian", "assyrian", "amorite", "kassite", "elamite", "hurrian", "gutian"]],
  ["anatolian_bronze_group", "Anatolian", ["hittite", "luwian", "hattian", "lycian", "carian", "palaic", "phrygian"]],
  ["levant_bronze_group", "Levantine", ["canaanite", "ugaritic", "phoenician", "moabite", "edomite", "ammonite", "aramaean"]],
  ["arabian_bronze_group", "Arabian", ["arabian", "midianite", "dilmunite", "sabaean"]],
  ["iranian_plateau_group", "Iranian Plateau", ["margian", "bactrian", "arian", "mede", "persian", "gedrosian"]],
  ["caucasus_bronze_group", "Caucasian", ["kartvelian", "colchian", "urartian", "albanian_caucasian", "nakh", "circassian"]],
  ["steppe_bronze_group", "Steppe", ["sintashta", "andronovo", "cimmerian", "scythian", "saka", "roxolani"]],
  ["aegean_bronze_group", "Aegean", ["mycenaean", "minoan", "aeolian", "ionian", "dorian", "arcadian", "cycladic"]],
  ["balkans_bronze_group", "Balkan", ["thracian", "illyrian", "dacian", "paeonian", "pelasgian", "triballian"]],
  ["italic_bronze_group", "Italic", ["latin", "etruscan", "umbrian", "samnite", "sicel", "nuragic", "ligurian"]],
  ["iberian_bronze_group", "Iberian", ["iberian", "tartessian", "lusitanian", "celtiberian", "aquitanian"]],
  ["gaulish_bronze_group", "Gaulish", ["gaulish", "armorican", "lepontic"]],
  ["germanic_nordic_group", "Germanic and Nordic", ["nordic", "jutlandic", "germanic"]],
  ["britain_bronze_group", "Britannic", ["britannic", "caledonian", "hibernian"]],
  ["indic_bronze_group", "Indus and Vedic", ["harappan", "vedic", "dravidian", "gandharan"]],
  ["central_asian_bronze_group", "Central Asian", ["tocharian", "sogdian", "ferghana"]],
  ["north_african_bronze_group", "North African", ["berber", "garamantian", "libu"]],
  ["sea_peoples_group", "Sea Peoples", ["sherden", "peleset", "tjekker", "denyen", "lukka"]],
];

const supplementalGroups = [
  ["east_asian_bronze_group", "East Asian Bronze", ["shang", "zhou", "sanxingdui", "dongyi", "baiyue", "qiang", "jomon", "mumun"]],
  ["southeast_asian_bronze_group", "Southeast Asian Bronze", ["austroasiatic", "vietic", "mon", "khmer", "austronesian"]],
  ["siberian_bronze_group", "Siberian Bronze", ["karasuk", "yeniseian", "tungusic"]],
  ["african_bronze_group", "African Bronze", ["puntite", "cushitic", "nilo_saharan", "bantu", "nok", "mande", "khoisan"]],
  ["american_bronze_group", "American Bronze", ["olmec", "mayan", "zapotec", "poverty_point", "puebloan", "andean", "chorrera", "arawak", "tupi", "araucanian", "saqqaq"]],
  ["oceanian_bronze_group", "Oceanian Bronze", ["lapita", "papuan", "aboriginal"]],
];

const allGroups = [...requestedGroups, ...supplementalGroups];
const groupByCulture = new Map();
for (const [group, , cultures] of allGroups) {
  for (const culture of cultures) groupByCulture.set(culture, group);
}

const languageFamilies = [
  ["kemetic_language_family", "Kemetic", "rgb { 203 166 92 }"],
  ["sumerian_language_family", "Sumerian", "rgb { 164 126 82 }"],
  ["akkadian_language_family", "Akkadian", "rgb { 155 94 63 }"],
  ["anatolian_language_family", "Anatolian", "rgb { 166 118 74 }"],
  ["hurro_urartian_language_family", "Hurro-Urartian", "rgb { 120 112 142 }"],
  ["aegean_language_family", "Aegean", "rgb { 82 128 185 }"],
  ["pre_indo_european_language_family", "Mediterranean", "rgb { 139 156 115 }"],
  ["bronze_steppe_language_family", "Steppe", "rgb { 151 139 91 }"],
  ["bronze_caucasian_language_family", "Caucasian", "rgb { 99 141 107 }"],
  ["bronze_american_language_family", "American", "rgb { 156 105 76 }"],
  ["bronze_oceanian_language_family", "Oceanian", "rgb { 80 146 151 }"],
  ["bronze_siberian_language_family", "Siberian", "rgb { 128 152 173 }"],
];

const languages = [
  ["egyptian_bronze_language", "Egyptian", "kemetic_language_family", "rgb { 214 177 91 }", ["Ramesses", "Seti", "Merenptah", "Amenmose", "Khaemwaset"], ["Tausret", "Nefertari", "Iset", "Henuttawy", "Mutemwiya"]],
  ["nubian_bronze_language", "Nubian", "eastern_sudanic_language_family", "rgb { 122 78 49 }", ["Amani", "Arakamani", "Teriteqas", "Nastasen"], ["Amanishakheto", "Amanitore", "Maletasen"]],
  ["libyan_bronze_language", "Libyan", "semitic_language_family", "rgb { 189 132 74 }", ["Meshwesh", "Meryey", "Ded", "Mesis"], ["Tia", "Kasa", "Tameri"]],
  ["sumerian_bronze_language", "Sumerian", "sumerian_language_family", "rgb { 178 136 76 }", ["Ur_Nammu", "Gudea", "Lugalbanda", "Enmerkar"], ["Kubaba", "Ninsun", "Shagshag"]],
  ["akkadian_bronze_language", "Akkadian", "akkadian_language_family", "rgb { 153 89 56 }", ["Hammurabi", "Kadashman", "Ashur", "Tukulti", "Adad"], ["Tashmetu", "Kubaba", "Beltani", "Shibtu"]],
  ["elamite_bronze_language", "Elamite", "sumerian_language_family", "rgb { 108 90 82 }", ["Untash", "Shilhak", "Humban", "Kidin"], ["Napir_Asu", "Nahhunte", "Kiririsha"]],
  ["hurrian_bronze_language", "Hurrian", "hurro_urartian_language_family", "rgb { 104 111 147 }", ["Tushratta", "Shuttarna", "Artatama", "Kikkuli"], ["Kelu_Heba", "Tadu_Heba", "Gilukhepa"]],
  ["anatolian_bronze_language", "Anatolian", "anatolian_language_family", "rgb { 171 121 72 }", ["Hattusili", "Tudhaliya", "Suppiluliuma", "Muwatalli"], ["Puduhepa", "Danuhepa", "Asmunikal"]],
  ["luwian_bronze_language", "Luwian", "anatolian_language_family", "rgb { 191 139 73 }", ["Kupanta", "Piyama", "Tarkasnawa", "Walmu"], ["Arawanna", "Massanauzzi", "Muwatti"]],
  ["levantine_bronze_language", "Canaanite", "semitic_language_family", "rgb { 184 144 67 }", ["Abi_Milku", "Rib_Hadda", "Abdi_Ashirta", "Aziru"], ["Batnoam", "Jezebel", "Asherah", "Baalat"]],
  ["arabian_bronze_language", "Arabian", "south_semitic_language_family", "rgb { 174 137 78 }", ["Yatha", "Karib", "Sumuhu", "Abiyasa"], ["Shamsi", "Zabiba", "Tabua"]],
  ["iranian_bronze_language", "Iranian", "iranic_language_family", "rgb { 119 141 89 }", ["Ariya", "Vishtaspa", "Frada", "Arshaka"], ["Atossa", "Roxana", "Parysatis"]],
  ["caucasian_bronze_language", "Caucasian", "bronze_caucasian_language_family", "rgb { 92 139 104 }", ["Argishti", "Menua", "Sarduri", "Aramu"], ["Tariria", "Nana", "Medea"]],
  ["steppe_bronze_language", "Steppe", "bronze_steppe_language_family", "rgb { 149 135 91 }", ["Arianta", "Skula", "Idanthyrsus", "Spargapises"], ["Tomyris", "Api", "Targitaia"]],
  ["aegean_bronze_language", "Aegean", "aegean_language_family", "rgb { 75 126 190 }", ["Agamemnon", "Atreus", "Eteocles", "Alaksandu"], ["Helen", "Clytemnestra", "Ariadne", "Phaedra"]],
  ["balkanic_bronze_language", "Balkan", "pre_indo_european_language_family", "rgb { 112 139 121 }", ["Teres", "Dromichaetes", "Bardylis", "Pleuratus"], ["Bendis", "Teuta", "Etuta"]],
  ["italic_bronze_language", "Italic", "romance_language_family", "rgb { 148 111 108 }", ["Tarquinius", "Numa", "Titus", "Tullus"], ["Tanaquil", "Rhea", "Larthia"]],
  ["iberian_bronze_language", "Iberian", "pre_indo_european_language_family", "rgb { 180 118 84 }", ["Arganthonios", "Istolatius", "Indibilis"], ["Orissia", "Balsa", "Helike"]],
  ["celtic_bronze_language", "Celtic", "celtic_language_family", "rgb { 81 145 91 }", ["Brennus", "Ambigatus", "Segovesus"], ["Onomaris", "Camulata", "Brigantia"]],
  ["germanic_bronze_language", "Nordic", "germanic_language_family", "rgb { 95 131 154 }", ["Hadding", "Frodi", "Skjold", "Hagbard"], ["Signe", "Yrsa", "Hervor"]],
  ["brittonic_bronze_language", "Britannic", "celtic_language_family", "rgb { 92 130 99 }", ["Cunobelin", "Bran", "Caratacos"], ["Cartimandua", "Boudica", "Brigantia"]],
  ["indic_bronze_language", "Vedic", "indic_language_family", "rgb { 177 121 64 }", ["Bharata", "Divodasa", "Sudas", "Purukutsa"], ["Ghosha", "Apala", "Lopamudra"]],
  ["dravidian_bronze_language", "Dravidian", "dravidian_language_family", "rgb { 136 101 69 }", ["Kannan", "Velan", "Maran", "Ariyan"], ["Kanni", "Valli", "Malli"]],
  ["east_asian_bronze_language", "East Asian", "chinese_language_family", "rgb { 180 80 65 }", ["Wu Ding", "Wu Yi", "Di Xin", "Fa"], ["Fu Hao", "Bi", "Jiang"]],
  ["southeast_asian_bronze_language", "Southeast Asian", "austroasiatic_language_family", "rgb { 77 139 94 }", ["Kambu", "Soma", "Fan", "Lac"], ["Soma", "Au Co", "Mera"]],
  ["siberian_bronze_language", "Siberian", "bronze_siberian_language_family", "rgb { 118 151 171 }", ["Kara", "Targan", "Tumen"], ["Saran", "Altana", "Kara"]],
  ["african_bronze_language", "African", "bantu_language_family", "rgb { 120 104 67 }", ["Nok", "Kaya", "Mansa", "Tano"], ["Amina", "Sona", "Nia"]],
  ["american_bronze_language", "American", "bronze_american_language_family", "rgb { 151 90 62 }", ["Ajaw", "Kuk", "Nacxit", "Yohl"], ["Ixchel", "Yohl", "Atotoztli"]],
  ["oceanian_bronze_language", "Oceanian", "bronze_oceanian_language_family", "rgb { 69 135 147 }", ["Langi", "Tala", "Motu", "Ratu"], ["Sina", "Hina", "Lina"]],
];

const defaultCulture = {
  egypt_nile_group: ["egyptian_bronze_language", "egyptian_gfx middle_east_gfx", "rgb { 214 177 91 }"],
  mesopotamian_group: ["akkadian_bronze_language", "middle_east_gfx", "rgb { 158 97 62 }"],
  anatolian_bronze_group: ["anatolian_bronze_language", "middle_east_gfx east_mediterranean_gfx", "rgb { 173 120 74 }"],
  levant_bronze_group: ["levantine_bronze_language", "levantine_gfx middle_east_gfx", "rgb { 184 144 67 }"],
  arabian_bronze_group: ["arabian_bronze_language", "arabian_gfx middle_east_gfx", "rgb { 174 137 78 }"],
  iranian_plateau_group: ["iranian_bronze_language", "persian_gfx middle_east_gfx", "rgb { 119 141 89 }"],
  caucasus_bronze_group: ["caucasian_bronze_language", "caucasian_gfx", "rgb { 92 139 104 }"],
  steppe_bronze_group: ["steppe_bronze_language", "central_asian_gfx", "rgb { 149 135 91 }"],
  aegean_bronze_group: ["aegean_bronze_language", "greek_gfx east_mediterranean_gfx mediterranean_gfx", "rgb { 75 126 190 }"],
  balkans_bronze_group: ["balkanic_bronze_language", "south_slavic_gfx eastern_european_gfx european_gfx", "rgb { 112 139 121 }"],
  italic_bronze_group: ["italic_bronze_language", "west_mediterranean_gfx mediterranean_gfx european_gfx", "rgb { 148 111 108 }"],
  iberian_bronze_group: ["iberian_bronze_language", "iberian_gfx west_mediterranean_gfx european_gfx", "rgb { 180 118 84 }"],
  gaulish_bronze_group: ["celtic_bronze_language", "celtic_gfx western_european_gfx european_gfx", "rgb { 81 145 91 }"],
  germanic_nordic_group: ["germanic_bronze_language", "north_german_gfx european_gfx", "rgb { 95 131 154 }"],
  britain_bronze_group: ["brittonic_bronze_language", "british_gfx celtic_gfx european_gfx", "rgb { 92 130 99 }"],
  indic_bronze_group: ["indic_bronze_language", "indian_gfx", "rgb { 177 121 64 }"],
  central_asian_bronze_group: ["iranian_bronze_language", "central_asian_gfx", "rgb { 134 126 88 }"],
  north_african_bronze_group: ["libyan_bronze_language", "amazigh_gfx maghrebi_gfx", "rgb { 174 126 77 }"],
  sea_peoples_group: ["aegean_bronze_language", "east_mediterranean_gfx mediterranean_gfx", "rgb { 92 139 166 }"],
  east_asian_bronze_group: ["east_asian_bronze_language", "east_asian_gfx", "rgb { 180 80 65 }"],
  southeast_asian_bronze_group: ["southeast_asian_bronze_language", "indochina_gfx", "rgb { 77 139 94 }"],
  siberian_bronze_group: ["siberian_bronze_language", "central_asian_gfx", "rgb { 118 151 171 }"],
  african_bronze_group: ["african_bronze_language", "african_gfx", "rgb { 120 104 67 }"],
  american_bronze_group: ["american_bronze_language", "american_gfx", "rgb { 151 90 62 }"],
  oceanian_bronze_group: ["oceanian_bronze_language", "austronesian_gfx", "rgb { 69 135 147 }"],
};

const cultureOverrides = {
  upper_egyptian: ["egyptian_bronze_language", "egyptian_gfx middle_east_gfx", "rgb { 197 146 72 }"],
  lower_egyptian: ["egyptian_bronze_language", "egyptian_gfx middle_east_gfx", "rgb { 225 187 94 }"],
  nubian: ["nubian_bronze_language", "nubian_gfx east_african_gfx african_gfx", "rgb { 120 78 50 }"],
  medjay: ["nubian_bronze_language", "nubian_gfx saharan_gfx", "rgb { 155 105 59 }"],
  libyan: ["libyan_bronze_language", "amazigh_gfx maghrebi_gfx", "rgb { 188 132 73 }"],
  sumerian: ["sumerian_bronze_language", "middle_east_gfx", "rgb { 184 139 76 }"],
  elamite: ["elamite_bronze_language", "persian_gfx middle_east_gfx", "rgb { 111 89 80 }"],
  hurrian: ["hurrian_bronze_language", "caucasian_gfx middle_east_gfx", "rgb { 104 111 147 }"],
  hittite: ["anatolian_bronze_language", "middle_east_gfx east_mediterranean_gfx", "rgb { 169 113 68 }"],
  luwian: ["luwian_bronze_language", "east_mediterranean_gfx mediterranean_gfx", "rgb { 191 139 73 }"],
  phrygian: ["anatolian_bronze_language", "east_mediterranean_gfx mediterranean_gfx", "rgb { 152 102 100 }"],
  urartian: ["caucasian_bronze_language", "caucasian_gfx middle_east_gfx", "rgb { 91 116 128 }"],
  minoan: ["aegean_bronze_language", "greek_gfx east_mediterranean_gfx mediterranean_gfx", "rgb { 67 151 176 }"],
  mycenaean: ["aegean_bronze_language", "greek_gfx east_mediterranean_gfx mediterranean_gfx", "rgb { 81 119 183 }"],
  nuragic: ["italic_bronze_language", "west_mediterranean_gfx mediterranean_gfx", "rgb { 126 119 79 }"],
  sherden: ["aegean_bronze_language", "west_mediterranean_gfx mediterranean_gfx", "rgb { 101 136 157 }"],
  peleset: ["levantine_bronze_language", "levantine_gfx east_mediterranean_gfx", "rgb { 91 142 169 }"],
  lukka: ["luwian_bronze_language", "east_mediterranean_gfx mediterranean_gfx", "rgb { 86 151 165 }"],
  harappan: ["indic_bronze_language", "indian_gfx", "rgb { 174 116 61 }"],
  dravidian: ["dravidian_bronze_language", "dravidian_gfx indian_gfx", "rgb { 130 95 67 }"],
  jomon: ["east_asian_bronze_language", "japanese_gfx east_asian_gfx", "rgb { 145 96 73 }"],
  mumun: ["east_asian_bronze_language", "east_asian_gfx", "rgb { 120 126 94 }"],
  papuan: ["oceanian_bronze_language", "papuan_gfx", "rgb { 101 111 142 }"],
  aboriginal: ["oceanian_bronze_language", "aboriginal_gfx", "rgb { 145 98 64 }"],
};

const displayName = {
  albanian_caucasian: "Caucasian Albanian",
  upper_egyptian: "Upper Egyptian",
  lower_egyptian: "Lower Egyptian",
  sea_peoples_group: "Sea Peoples",
  egypt_nile_group: "Egypt and Nile",
  iranian_plateau_group: "Iranian Plateau",
  germanic_nordic_group: "Germanic and Nordic",
  indic_bronze_group: "Indus and Vedic",
  east_asian_bronze_group: "East Asian Bronze",
  southeast_asian_bronze_group: "Southeast Asian Bronze",
  american_bronze_group: "American Bronze",
  oceanian_bronze_group: "Oceanian Bronze",
  african_bronze_group: "African Bronze",
  siberian_bronze_group: "Siberian Bronze",
  nilo_saharan: "Nilo-Saharan",
  poverty_point: "Poverty Point",
};

const adjectives = {
  medjay: "Medjay",
  mede: "Median",
  nakh: "Nakh",
  sintashta: "Sintashta",
  andronovo: "Andronovo",
  saka: "Saka",
  roxolani: "Roxolani",
  margian: "Margian",
  paeonian: "Paeonian",
  pelasgian: "Pelasgian",
  celtiberian: "Celtiberian",
  lepontic: "Lepontic",
  hittite: "Hittite",
  luwian: "Luwian",
  hattian: "Hattian",
  palaic: "Palaic",
  lukka: "Lukkan",
  peleset: "Peleset",
  tjekker: "Tjekker",
  denyen: "Denyen",
  sherden: "Sherden",
  harappan: "Harappan",
  vedic: "Vedic",
  jomon: "Jomon",
  mumun: "Mumun",
  shang: "Shang",
  zhou: "Zhou",
  sanxingdui: "Sanxingdui",
  dongyi: "Dongyi",
  baiyue: "Baiyue",
  qiang: "Qiang",
  lapita: "Lapita",
  papuan: "Papuan",
  aboriginal: "Aboriginal",
  olmec: "Olmec",
  mayan: "Mayan",
  zapotec: "Zapotec",
  poverty_point: "Poverty Point",
  puebloan: "Puebloan",
  chorrera: "Chorrera",
  saqqaq: "Saqqaq",
};

function titleFromId(id) {
  if (displayName[id]) return displayName[id];
  return id
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function adjFromId(id) {
  if (adjectives[id]) return adjectives[id];
  const name = titleFromId(id);
  if (name.endsWith("ian") || name.endsWith("ic") || name.endsWith("ite") || name.endsWith("an")) return name;
  return `${name}ian`;
}

function ensureDir(rel) {
  fs.mkdirSync(path.join(root, rel), { recursive: true });
}

function writeText(rel, text) {
  const normalized = text.replace(/\r+\n/g, "\n").replace(/\r/g, "\n").replace(/\n/g, "\r\n");
  fs.writeFileSync(path.join(root, rel), normalized, "utf8");
}

function parseVanillaCultureSources() {
  const sources = new Map();
  if (!fs.existsSync(vanillaCultureDir)) return sources;
  for (const file of fs.readdirSync(vanillaCultureDir)) {
    if (!file.endsWith(".txt")) continue;
    const source = path.basename(file, ".txt");
    const text = fs.readFileSync(path.join(vanillaCultureDir, file), "utf8");
    for (const match of text.matchAll(/^([A-Za-z0-9_]+)\s*=\s*\{/gm)) {
      sources.set(match[1], source);
    }
  }
  return sources;
}

const cultureSource = parseVanillaCultureSources();
const allCultures = new Set(groupByCulture.keys());

function blockAt(text, startIndex) {
  const open = text.indexOf("{", startIndex);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(open + 1, i);
    }
  }
  return "";
}

function parseCountryLocations() {
  const text = fs.readFileSync(path.join(root, "main_menu/setup/start/10_countries.txt"), "utf8");
  const countries = new Map();
  for (const match of text.matchAll(/^\s*([A-Z0-9_]+)\s*=\s*\{/gm)) {
    const block = blockAt(text, match.index);
    const own = /own_control_core\s*=\s*\{([\s\S]*?)\}/.exec(block);
    if (!own) continue;
    const locs = own[1].replace(/#.*$/gm, "").trim().split(/\s+/).filter(Boolean);
    countries.set(match[1], locs);
  }
  return countries;
}

const countryLocations = parseCountryLocations();
const locationOverrides = new Map();

function setLocation(culture, locations) {
  for (const loc of locations) locationOverrides.set(loc, culture);
}

function setTag(tag, culture) {
  setLocation(culture, countryLocations.get(tag) || []);
}

function configureLocationOverrides() {
  setTag("0001G", "mycenaean");
  setLocation("minoan", ["candia", "chania", "elounda", "gergeri", "hagios_pavlos", "rethymno", "siteia", "viannos"]);
  setLocation("cycladic", ["amorgos", "andros", "ikaria", "kythira", "kythnos", "milos", "mykonos", "naxos", "samos", "sporades"]);
  setLocation("ionian", ["athens", "chios", "eretria", "eretreia", "karystos", "negroponte", "oreos", "samos", "balat", "bodrum"]);
  setLocation("aeolian", ["demetrias", "farsala", "larissa", "stomio", "tyrnavos"]);
  setLocation("arcadian", ["andritsaina", "karytaina", "kalavryta", "tripolitsa", "veligosti"]);
  setLocation("dorian", ["karpathos", "kos", "rodos"]);

  setTag("0002G", "lower_egyptian");
  setLocation("upper_egyptian", ["akhmim", "al_mima", "ashmunayn", "aswan", "asyut", "atfih", "beni_suef", "dara", "edfu", "el_bahnasa", "el_balyana", "el_buwit", "esna", "hiw", "kom_ombo", "manfalut", "minya", "qena", "qus", "sharuna", "tahna", "tidah"]);
  setLocation("libyan", ["el_alamein", "matruh", "sallum", "wadi_el_natrun", "kharibta", "tarrana"]);
  setLocation("egyptian", ["giza", "ramsis"]);
  setLocation("medjay", ["aswan", "kom_ombo", "nekhel", "qatya"]);
  setLocation("canaanite", ["beersheba", "hebron", "irbid", "jerusalem", "nablus", "nawa", "safed"]);
  setLocation("phoenician", ["acre"]);
  setLocation("peleset", ["gaza", "jaffa", "majdal"]);

  setTag("HATTI", "hittite");
  setLocation("hattian", ["amasya", "corum", "cankiri", "tosya", "sungurlu", "zile"]);
  setLocation("luwian", ["adana", "anavarza", "ayas", "comana_cil", "corycus", "ereglu_kar", "eregli_kar", "iskenderun", "kilis", "larende", "mut", "silifke", "sis", "tarsus"]);
  setLocation("denyen", ["adana", "ayas", "iskenderun", "tarsus"]);
  setLocation("hurrian", ["afrin", "al_bab", "aleppo", "ayntab", "birecik", "manbij", "suruc", "urfa"]);

  setTag("SIDON", "phoenician");
  setTag("ALASI", "canaanite");
  setTag("AMURU", "amorite");
  setTag("ARWAD", "phoenician");
  setTag("BERIT", "phoenician");
  setTag("BYBLO", "phoenician");
  setTag("UGART", "ugaritic");
  setTag("HABIR", "aramaean");
  setLocation("moabite", ["karak", "madaba", "suwayda"]);
  setLocation("edomite", ["al_quwayrah", "aqaba", "maan", "shoubak", "sughar"]);
  setLocation("midianite", ["haql", "aqaba"]);
  setTag("SASU", "edomite");
  setTag("SUTU", "aramaean");
  setLocation("ammonite", ["amman", "madaba"]);

  setTag("ASYRI", "assyrian");
  setLocation("hurrian", ["akre", "amadiya", "bahcesaray", "duhok", "erbil", "hakkari", "rawanduz", "zakho"]);
  setTag("MITAN", "hurrian");
  setTag("KASSI", "kassite");
  setLocation("babylonian", ["baghdad", "balad_ruz", "basra", "dayr_aqul", "hillah", "karbala", "khalis", "nasiriyah", "numaniyyah", "rusafa", "samawa", "wasit"]);
  setLocation("sumerian", ["abadan", "basra", "nasiriyah", "samawa", "suq_al_shuyukh", "zuwayr"]);
  setTag("ELAM", "elamite");
  setLocation("gutian", ["dehdasht", "dehdez", "dishmok", "izeh", "lordegan", "masjed_soleyman"]);

  setTag("AZZI", "urartian");
  setTag("HAJAS", "colchian");
  setTag("PALA", "palaic");
  setTag("HAPAL", "luwian");
  setTag("KUWAL", "luwian");
  setTag("MASA", "phrygian");
  setTag("WILUS", "luwian");
  setTag("LUKKA", "lukka");
  setTag("PARTH", "lycian");
  setLocation("carian", ["marmaris", "milas", "mugla", "tavas"]);

  setTag("DIMUN", "dilmunite");
  setTag("MAGAN", "arabian");
  setLocation("sabaean", ["nizwa", "bahla", "ibri", "suhar", "sur"]);

  setTag("LIBYA", "libu");
  setLocation("garamantian", ["siwa", "awjila"]);

  setTag("NURAG", "nuragic");
  setLocation("sherden", ["cagliari", "oristano"]);
  setTag("IAPYG", "samnite");
  setTag("SICAN", "sicel");
  setTag("SICEL", "sicel");
  setTag("ELYMI", "sicel");
  setTag("BALES", "iberian");
  setTag("ARGAR", "iberian");
  setTag("TARTS", "tartessian");
  setTag("BALSA", "lusitanian");
  setTag("CARTI", "tartessian");
  setTag("MALAK", "tartessian");

  setLocation("akkadian", ["samarra", "tikrit", "ukbara"]);
  setLocation("margian", ["dehistan", "merv", "nisa"]);
  setLocation("pelasgian", ["atalanti", "gravia", "loidoriki", "salona", "zetounion"]);
  setLocation("paeonian", ["bitola", "edessa", "kastoria", "ohrid", "prilep", "serres", "skopje", "stipon", "veles"]);
  setLocation("celtiberian", ["albarracin", "calatayud", "cuenca", "daroca", "medinaceli", "siguenza", "soria", "teruel"]);
  setLocation("lepontic", ["bellinzona", "bergamo", "chiavenna", "como", "lugano"]);
}

configureLocationOverrides();

const exactCultureMap = new Map(Object.entries({
  lower_egyptian_culture: "lower_egyptian",
  upper_egyptian_culture: "upper_egyptian",
  coptic_culture: "egyptian",
  bedouin_culture: "midianite",
  libyan_arabic_culture: "libu",
  toubou_culture: "garamantian",
  greek_culture: "mycenaean",
  cappadocian_greek_culture: "hittite",
  pontic_greek_culture: "colchian",
  griko_culture: "mycenaean",
  gothic_culture: "cimmerian",
  turkish_culture: "hittite",
  turkoman_culture: "margian",
  syriac_culture: "aramaean",
  levantine_culture: "canaanite",
  iraqi_culture: "babylonian",
  mandean_culture: "akkadian",
  mizrahi: "aramaean",
  romanyoti: "mycenaean",
  sephardi: "canaanite",
  ashkenazi: "canaanite",
  italki: "etruscan",
  armenian_culture: "urartian",
  georgian_culture: "kartvelian",
  abkhazian_culture: "circassian",
  chechen_culture: "nakh",
  circassian_culture: "circassian",
  avar_culture: "albanian_caucasian",
  lezgin_culture: "albanian_caucasian",
  alan_culture: "cimmerian",
  farsi_culture: "persian",
  khorasani_culture: "arian",
  tajik_culture: "bactrian",
  adhari_culture: "mede",
  baloch_culture: "gedrosian",
  dehwar_culture: "gedrosian",
  afghan_culture: "gandharan",
  zaza_culture: "gutian",
  kurdish_culture: "gutian",
  gilak_culture: "mede",
  mazanderani_culture: "mede",
  semnani_culture: "mede",
  lur_culture: "elamite",
  pamiri_culture: "bactrian",
  pashtun_culture: "gandharan",
  khorezmian_culture: "sogdian",
  uyghur_culture: "tocharian",
  kyrgyz_culture: "ferghana",
  uzbek_culture: "saka",
  oirat_culture: "saka",
  mongolian_culture: "andronovo",
  crimean: "cimmerian",
  nogai: "roxolani",
  astrakhani: "scythian",
  kazani: "sintashta",
  mishar: "sintashta",
  swedish: "nordic",
  norwegian: "nordic",
  danish: "jutlandic",
  sapmi: "nordic",
  finnish: "sintashta",
  karelian: "sintashta",
  komi: "sintashta",
  english: "britannic",
  welsh: "britannic",
  cornish: "britannic",
  northumbrian: "caledonian",
  scottish: "caledonian",
  highland: "caledonian",
  norse_gael: "caledonian",
  irish: "hibernian",
  anglo_irish: "hibernian",
  norman: "gaulish",
  angevin: "gaulish",
  french: "gaulish",
  francien: "gaulish",
  poitevin: "gaulish",
  occitan: "gaulish",
  burgundian: "gaulish",
  breton: "armorican",
  gallo: "armorican",
  basque: "aquitanian",
  castilian: "iberian",
  catalan: "iberian",
  aragonese: "iberian",
  andalusi: "tartessian",
  portuguese: "lusitanian",
  galician: "lusitanian",
  leonese: "lusitanian",
  latin: "latin",
  median: "latin",
  neapolitan: "samnite",
  sicilian: "sicel",
  venetian: "umbrian",
  lombard: "ligurian",
  emilian: "etruscan",
  tuscan: "etruscan",
  ligurian: "ligurian",
  dalmatian: "illyrian",
  albanian: "illyrian",
  croatian: "illyrian",
  serbian: "triballian",
  bosnian: "illyrian",
  bulgarian: "thracian",
  romanian: "dacian",
  hungarian: "dacian",
  slovak: "triballian",
  ruthenian: "cimmerian",
  muscovite: "andronovo",
  novgorodian: "andronovo",
  yemeni_culture: "sabaean",
  hijazi_culture: "midianite",
  najdi_culture: "arabian",
  omani_culture: "arabian",
  mahri_culture: "sabaean",
  sindhi: "harappan",
  punjabi: "gandharan",
  lahnda: "gandharan",
  dehlavi: "vedic",
  hindavi: "vedic",
  rajput: "vedic",
  bengali: "vedic",
  tamil: "dravidian",
  telugu: "dravidian",
  kannadiga: "dravidian",
  malayalam: "dravidian",
  gond: "dravidian",
  somali_culture: "puntite",
  amhara: "cushitic",
  tigray: "cushitic",
  nubian: "nubian",
  berber: "berber",
  tuareg: "garamantian",
  kabyle: "berber",
  zhongyuan_culture: "shang",
  jilu_culture: "shang",
  qin_culture: "zhou",
  shu_culture: "sanxingdui",
  jin_culture: "zhou",
  jianghuai_culture: "baiyue",
  gan_culture: "baiyue",
  zhuang_culture: "baiyue",
  yi_culture: "qiang",
  hmong_culture: "baiyue",
  korean_culture: "mumun",
  jurchen_culture: "dongyi",
  saigoku_culture: "jomon",
  tougoku_culture: "jomon",
  khmer_culture: "khmer",
  mon_culture: "mon",
  vietnamese_culture: "vietic",
  malay_culture: "austronesian",
  javanese_culture: "austronesian",
  nahua_culture: "olmec",
  maya_culture: "mayan",
  zapotec_culture: "zapotec",
}));

function byNamePattern(old) {
  if (/egypt|coptic/.test(old)) return "egyptian";
  if (/liby|maghreb|tunis|moroccan|algerian/.test(old)) return "berber";
  if (/arab|bedouin|najdi|hijazi/.test(old)) return "arabian";
  if (/yemen|saba/.test(old)) return "sabaean";
  if (/assy|iraq|babylon/.test(old)) return "babylonian";
  if (/syria|arama|levant/.test(old)) return "aramaean";
  if (/hebrew|jew|mizrahi|sephardi|ashkenazi/.test(old)) return "canaanite";
  if (/greek|hellen|aegean/.test(old)) return "mycenaean";
  if (/turk|anatol/.test(old)) return "hittite";
  if (/armen/.test(old)) return "urartian";
  if (/georg|kart/.test(old)) return "kartvelian";
  if (/circass|adyg/.test(old)) return "circassian";
  if (/chechen|nakh|ingush/.test(old)) return "nakh";
  if (/pers|farsi/.test(old)) return "persian";
  if (/baloch/.test(old)) return "gedrosian";
  if (/afghan|pasht/.test(old)) return "gandharan";
  if (/khorezm|sogd/.test(old)) return "sogdian";
  if (/mongol|oirat/.test(old)) return "andronovo";
  if (/tatar|nogai|crimean/.test(old)) return "scythian";
  if (/swed|norse|nord|norweg/.test(old)) return "nordic";
  if (/danish|jut/.test(old)) return "jutlandic";
  if (/german|saxon|francon|frisian|bavarian|alemannic|holsat/.test(old)) return "germanic";
  if (/english|welsh|cornish/.test(old)) return "britannic";
  if (/scot|highland/.test(old)) return "caledonian";
  if (/irish|gael/.test(old)) return "hibernian";
  if (/breton|armor/.test(old)) return "armorican";
  if (/french|occitan|burgund|poitevin/.test(old)) return "gaulish";
  if (/basque|aquitan/.test(old)) return "aquitanian";
  if (/castil|catalan|aragon/.test(old)) return "iberian";
  if (/portugu|galician|leonese/.test(old)) return "lusitanian";
  if (/andalus|tartess/.test(old)) return "tartessian";
  if (/ital|latin|median/.test(old)) return "latin";
  if (/sicil/.test(old)) return "sicel";
  if (/lombard|ligur/.test(old)) return "ligurian";
  if (/tuscan|etrusc/.test(old)) return "etruscan";
  if (/romanian|vlach/.test(old)) return "dacian";
  if (/bulgar|thrac/.test(old)) return "thracian";
  if (/serb|tribal/.test(old)) return "triballian";
  if (/croat|bosn|alban/.test(old)) return "illyrian";
  if (/punjab|gandhar/.test(old)) return "gandharan";
  if (/sindh|harapp/.test(old)) return "harappan";
  if (/tamil|telugu|kannad|malayalam|dravid|gond/.test(old)) return "dravidian";
  if (/dehlav|hind|bengal|rajput|vedic|sanskrit/.test(old)) return "vedic";
  if (/china|zhong|jilu|jin|qin/.test(old)) return "shang";
  if (/shu|yi/.test(old)) return "sanxingdui";
  if (/japan|saigoku|tougoku/.test(old)) return "jomon";
  if (/korea/.test(old)) return "mumun";
  if (/khmer/.test(old)) return "khmer";
  if (/viet/.test(old)) return "vietic";
  if (/malay|java|sunda|austrones/.test(old)) return "austronesian";
  if (/papua/.test(old)) return "papuan";
  if (/aborig|austral/.test(old)) return "aboriginal";
  if (/nahua|aztec/.test(old)) return "olmec";
  if (/maya/.test(old)) return "mayan";
  if (/zapotec|mixtec/.test(old)) return "zapotec";
  if (/andean|quechua|aymara|inca/.test(old)) return "andean";
  return null;
}

function bySource(old, source) {
  switch (source) {
    case "egypt": return byNamePattern(old) || "egyptian";
    case "levantine":
    case "israelite": return byNamePattern(old) || "canaanite";
    case "arabia": return byNamePattern(old) || "arabian";
    case "persian": return byNamePattern(old) || "persian";
    case "caucasian": return byNamePattern(old) || "kartvelian";
    case "greek": return byNamePattern(old) || "mycenaean";
    case "italian": return byNamePattern(old) || "latin";
    case "iberian": return byNamePattern(old) || "iberian";
    case "french":
    case "netherlands": return byNamePattern(old) || "gaulish";
    case "german":
    case "west_slavic": return byNamePattern(old) || "germanic";
    case "scandinavian":
    case "finno_ugric":
    case "permic":
    case "baltic": return byNamePattern(old) || "nordic";
    case "british": return byNamePattern(old) || "britannic";
    case "south_slavic": return byNamePattern(old) || "illyrian";
    case "carpathian": return byNamePattern(old) || "dacian";
    case "east_slavic": return byNamePattern(old) || "andronovo";
    case "tartar":
    case "turkic": return byNamePattern(old) || "saka";
    case "indo_aryan":
    case "bengal": return byNamePattern(old) || "vedic";
    case "dravidian": return byNamePattern(old) || "dravidian";
    case "maghrebi": return byNamePattern(old) || "berber";
    case "horn_of_africa":
    case "east_african": return byNamePattern(old) || "cushitic";
    case "west_african": return byNamePattern(old) || "mande";
    case "kongolese": return byNamePattern(old) || "bantu";
    case "south_africa": return byNamePattern(old) || "khoisan";
    case "east_asia": return byNamePattern(old) || "shang";
    case "south_east_asia": return byNamePattern(old) || "austroasiatic";
    case "indonesia": return byNamePattern(old) || "austronesian";
    case "papuan": return "papuan";
    case "oceanic": return "lapita";
    case "australian": return "aboriginal";
    case "alaska":
    case "canadian": return "saqqaq";
    case "eastcoast":
    case "central_north_american":
    case "great_bassin": return byNamePattern(old) || "poverty_point";
    case "aridoamerican": return byNamePattern(old) || "puebloan";
    case "central_america":
    case "mesoamerican": return byNamePattern(old) || "olmec";
    case "peruvian": return byNamePattern(old) || "andean";
    case "southamerican":
    case "argentinian": return byNamePattern(old) || "chorrera";
    case "brasilian":
    case "caribbean": return byNamePattern(old) || "arawak";
    default: return byNamePattern(old) || "andronovo";
  }
}

function mapOldCulture(old) {
  if (allCultures.has(old)) return old;
  if (exactCultureMap.has(old)) return exactCultureMap.get(old);
  return bySource(old, cultureSource.get(old) || "");
}

function cultureForLocation(location, oldCulture) {
  return locationOverrides.get(location) || mapOldCulture(oldCulture);
}

function generateCultureGroupFile() {
  let text = "# Bronze Era total conversion culture groups. Vanilla medieval groups are not used by scenario pops.\n\n";
  for (const [group] of allGroups) {
    text += `${group} = {\n}\n\n`;
  }
  return text;
}

function generateLanguageFamilyFile() {
  let text = "# Language families used by the Bronze Era culture overhaul.\n\n";
  for (const [id, , color] of languageFamilies) {
    text += `${id} = {\n\tcolor = ${color}\n}\n\n`;
  }
  return text;
}

function generateLanguageFile() {
  let text = "# Compact Bronze Age name pools for generated cultures.\n\n";
  for (const [id, , family, color, male, female] of languages) {
    text += `${id} = {\n`;
    text += `\tcolor = ${color}\n`;
    text += `\tfamily = ${family}\n\n`;
    text += `\tmale_names = { ${male.join(" ")} }\n`;
    text += `\tfemale_names = { ${female.join(" ")} }\n`;
    text += `\tdynasty_names = { ${male.join(" ")} }\n`;
    text += `\tlowborn = { ${male.slice(0, 3).join(" ")} }\n`;
    text += `}\n\n`;
  }
  return text;
}

function generateCultureFile() {
  let text = "# Bronze Era total conversion cultures, centered on the 1205 BCE collapse horizon.\n\n";
  for (const [group, , cultures] of allGroups) {
    for (let index = 0; index < cultures.length; index++) {
      const culture = cultures[index];
      const defaults = defaultCulture[group];
      const [language, tags, color] = cultureOverrides[culture] || [
        defaults[0],
        defaults[1],
        shiftColor(defaults[2], index),
      ];
      text += `${culture} = {\n`;
      text += `\tlanguage = ${language}\n`;
      text += `\tcolor = ${color}\n`;
      text += `\ttags = { ${tags} }\n`;
      text += `\topinions = {\n\t}\n`;
      text += `\tculture_groups = {\n\t\t${group}\n\t}\n`;
      text += `}\n\n`;
    }
  }
  return text;
}

function shiftColor(color, index) {
  const match = /rgb\s*\{\s*(\d+)\s+(\d+)\s+(\d+)\s*\}/.exec(color);
  if (!match) return color;
  const [r, g, b] = match.slice(1).map(Number);
  const shift = (index % 7) * 11;
  const clamp = (value) => Math.max(35, Math.min(225, value + shift - 22));
  return `rgb { ${clamp(r)} ${clamp(g)} ${clamp(b)} }`;
}

function generateLocalization() {
  let text = "l_english:\n";
  for (const [group, label] of allGroups) {
    text += ` ${group}: \"${displayName[group] || label}\"\n`;
    text += ` ${group}_desc: \"Cultures of the ${displayName[group] || label} sphere in the Bronze Era setup.\"\n`;
  }
  for (const culture of allCultures) {
    text += ` ${culture}: \"${titleFromId(culture)}\"\n`;
    text += ` ${culture}_ADJ: \"${adjFromId(culture)}\"\n`;
  }
  for (const [id, label] of languageFamilies) {
    text += ` ${id}: \"${label}\"\n`;
  }
  for (const [id, label] of languages) {
    text += ` ${id}: \"${label}\"\n`;
  }
  return text;
}

function rewritePops() {
  const rel = "main_menu/setup/start/06_pops.txt";
  const file = path.join(root, rel);
  const input = fs.readFileSync(file, "utf8");
  const lines = input.split(/\r?\n/);
  const weightsByLocation = new Map();
  let currentLocation = null;
  for (const line of lines) {
    const loc = /^([A-Za-z0-9_]+)\s*=\s*\{\s*$/.exec(line);
    if (loc && loc[1] !== "locations") currentLocation = loc[1];
    const culture = /\bculture\s*=\s*([A-Za-z0-9_]+)/.exec(line);
    if (!culture || !currentLocation) continue;
    const nextCulture = cultureForLocation(currentLocation, culture[1]);
    const sizeMatch = /\bsize\s*=\s*([0-9.]+)/.exec(line);
    const weight = sizeMatch ? Number(sizeMatch[1]) || 0 : 1;
    if (!weightsByLocation.has(currentLocation)) weightsByLocation.set(currentLocation, new Map());
    const weights = weightsByLocation.get(currentLocation);
    weights.set(nextCulture, (weights.get(nextCulture) || 0) + weight);
  }

  const dominantByLocation = new Map();
  for (const [location, weights] of weightsByLocation) {
    if (locationOverrides.has(location)) {
      dominantByLocation.set(location, locationOverrides.get(location));
      continue;
    }
    const [dominant] = [...weights.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    dominantByLocation.set(location, dominant);
  }

  currentLocation = null;
  const counts = new Map();
  const output = lines.map((line) => {
    const loc = /^([A-Za-z0-9_]+)\s*=\s*\{\s*$/.exec(line);
    if (loc && loc[1] !== "locations") currentLocation = loc[1];
    return line.replace(/\bculture\s*=\s*([A-Za-z0-9_]+)/g, (_whole, oldCulture) => {
      const nextCulture = dominantByLocation.get(currentLocation) || cultureForLocation(currentLocation, oldCulture);
      counts.set(nextCulture, (counts.get(nextCulture) || 0) + 1);
      return `culture = ${nextCulture}`;
    });
  }).join("\n");
  writeText(rel, output);
  return counts;
}

function rewriteCharacters() {
  const rel = "main_menu/setup/start/05_characters.txt";
  const file = path.join(root, rel);
  const input = fs.readFileSync(file, "utf8");
  const counts = new Map();
  const output = input.replace(/\bculture\s*=\s*([A-Za-z0-9_]+)/g, (_whole, oldCulture) => {
    const nextCulture = mapOldCulture(oldCulture);
    counts.set(nextCulture, (counts.get(nextCulture) || 0) + 1);
    return `culture = ${nextCulture}`;
  });
  writeText(rel, output);
  return counts;
}

function updateCountries() {
  const rel = "main_menu/setup/start/10_countries.txt";
  const file = path.join(root, rel);
  let text = fs.readFileSync(file, "utf8");
  text = text.replace("accepted_cultures = { hellenic }", "accepted_cultures = { mycenaean }");
  text = text.replace("tolerated_cultures = { ionian aeolian dorian arcadian }", "tolerated_cultures = { minoan ionian aeolian dorian arcadian cycladic }");
  text = text.replace("accepted_cultures = { egyptian }", "accepted_cultures = { upper_egyptian lower_egyptian }");
  text = text.replace("accepted_cultures = { anatolian }", "accepted_cultures = { hittite }");
  text = text.replace(
    /(accepted_cultures = \{ upper_egyptian lower_egyptian \})(?!\s*tolerated_cultures)/,
    "$1\n\t\ttolerated_cultures = { nubian medjay libyan canaanite phoenician peleset }",
  );
  text = text.replace(
    /(accepted_cultures = \{ hittite \})(?!\s*tolerated_cultures)/,
    "$1\n\t\ttolerated_cultures = { luwian hattian palaic hurrian phrygian lukka }",
  );
  writeText(rel, text);
}

function validateCultureReferences() {
  const files = [
    "main_menu/setup/start/05_characters.txt",
    "main_menu/setup/start/06_pops.txt",
    "main_menu/setup/start/10_countries.txt",
  ];
  const invalid = new Map();
  for (const rel of files) {
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    for (const match of text.matchAll(/\bculture\s*=\s*([A-Za-z0-9_]+)|\b(?:accepted_cultures|tolerated_cultures)\s*=\s*\{([^}]*)\}/g)) {
      const cultures = match[1] ? [match[1]] : match[2].trim().split(/\s+/).filter(Boolean);
      for (const culture of cultures) {
        if (!allCultures.has(culture)) {
          if (!invalid.has(rel)) invalid.set(rel, new Set());
          invalid.get(rel).add(culture);
        }
      }
    }
  }
  return invalid;
}

function writeReport(popCounts, characterCounts, invalid) {
  const rows = [...popCounts.entries()].sort((a, b) => b[1] - a[1]);
  let text = "Bronze Era culture generation report\n";
  text += "====================================\n\n";
  text += `Defined cultures: ${allCultures.size}\n`;
  text += `Defined culture groups: ${allGroups.length}\n`;
  text += `Location overrides: ${locationOverrides.size}\n\n`;
  text += "Top pop culture assignments:\n";
  for (const [culture, count] of rows.slice(0, 80)) text += `- ${culture}: ${count}\n`;
  text += "\nCharacter culture assignments:\n";
  for (const [culture, count] of [...characterCounts.entries()].sort((a, b) => b[1] - a[1])) text += `- ${culture}: ${count}\n`;
  if (invalid.size > 0) {
    text += "\nInvalid/unconverted references:\n";
    for (const [file, cultures] of invalid) text += `- ${file}: ${[...cultures].sort().join(", ")}\n`;
  } else {
    text += "\nInvalid/unconverted references: none\n";
  }
  writeText("tools/bronze_culture_generation_report.txt", text);
}

ensureDir("in_game/common/culture_groups");
ensureDir("in_game/common/cultures");
ensureDir("in_game/common/language_families");
ensureDir("in_game/common/languages");
ensureDir("main_menu/localization/english");
ensureDir("tools");

writeText("in_game/common/culture_groups/00_bronze_age_culture_groups.txt", generateCultureGroupFile());
writeText("in_game/common/language_families/00_bronze_age_language_families.txt", generateLanguageFamilyFile());
writeText("in_game/common/languages/00_bronze_age_languages.txt", generateLanguageFile());
writeText("in_game/common/cultures/00_bronze_age_cultures.txt", generateCultureFile());
writeText("main_menu/localization/english/Bronze_cultures_l_english.yml", generateLocalization());

const popCounts = rewritePops();
const characterCounts = rewriteCharacters();
updateCountries();
const invalid = validateCultureReferences();
writeReport(popCounts, characterCounts, invalid);

if (invalid.size > 0) {
  for (const [file, cultures] of invalid) {
    console.error(`${file}: ${[...cultures].sort().join(", ")}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Generated ${allCultures.size} cultures in ${allGroups.length} groups.`);
  console.log(`Rewrote ${[...popCounts.values()].reduce((a, b) => a + b, 0)} pop culture references.`);
  console.log(`Rewrote ${[...characterCounts.values()].reduce((a, b) => a + b, 0)} character culture references.`);
}
