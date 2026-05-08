import fs from "fs";
import path from "path";

const root = path.resolve(".");

const religionGroups = [
  ["egyptian_religion_group", "Egyptian", ["kemetic"]],
  ["mesopotamian_religion_group", "Mesopotamian", ["mesopotamian", "assyrian", "babylonian", "sumerian"]],
  ["anatolian_religion_group", "Anatolian", ["hittite", "luwian", "hattian"]],
  ["levantine_religion_group", "Levantine", ["canaanite", "phoenician", "ugaritic"]],
  ["arabian_religion_group", "Arabian", ["arabian_pagan", "dilmunite", "sabaean"]],
  ["iranian_religion_group", "Iranian", ["elamite", "iranic", "margian"]],
  ["caucasian_religion_group", "Caucasian", ["kartvelian_pagan", "urartian", "caucasian_pagan"]],
  ["steppe_religion_group", "Steppe", ["steppe_pagan", "saka_pagan", "scythian_pagan"]],
  ["aegean_religion_group", "Aegean", ["minoan", "mycenaean", "hellenic"]],
  ["balkan_religion_group", "Balkan", ["thracian_pagan", "illyrian_pagan", "dacian_pagan"]],
  ["italic_religion_group", "Italic", ["italic_pagan", "etruscan", "nuragic"]],
  ["iberian_religion_group", "Iberian", ["iberian_pagan", "tartessian", "lusitanian_pagan"]],
  ["celtic_religion_group", "Celtic", ["gaulish_pagan", "britannic_pagan"]],
  ["nordic_religion_group", "Nordic", ["nordic_pagan"]],
  ["indian_religion_group", "Indian", ["vedic", "dravidian_folk", "harappan"]],
  ["african_religion_group", "African", ["berber_pagan", "nubian", "garamantian"]],
  ["sea_peoples_religion_group", "Sea Peoples", ["sea_peoples_cult"]],
  ["east_asian_religion_group", "East Asian", ["shang_rites", "zhou_rites", "sanxingdui_rites", "baiyue_rites", "jomon_rites", "mumun_rites"]],
  ["southeast_asian_religion_group", "Southeast Asian", ["austroasiatic_rites", "khmer_rites", "austronesian_rites"]],
  ["siberian_religion_group", "Siberian", ["karasuk_rites"]],
  ["sub_saharan_religion_group", "Sub-Saharan", ["puntite_rites", "cushitic_rites", "nilo_saharan_rites", "mande_rites", "bantu_rites", "khoisan_rites"]],
  ["american_religion_group", "American", ["olmec_rites", "mayan_rites", "zapotec_rites", "puebloan_rites", "andean_rites", "woodland_rites", "arawak_rites", "tupi_rites", "saqqaq_rites"]],
  ["oceanian_religion_group", "Oceanian", ["lapita_rites", "papuan_rites", "dreaming_ways"]],
];

const groupByReligion = new Map();
for (const [group, , religions] of religionGroups) {
  for (const religion of religions) groupByReligion.set(religion, group);
}

const allReligions = [...groupByReligion.keys()];

const vanillaRemovalStubs = {
  "in_game/common/religion_groups": [
    "00_default.txt",
  ],
  "in_game/common/religions": [
    "buddhist.txt",
    "christian.txt",
    "dharmic.txt",
    "druze.txt",
    "folk_african.txt",
    "folk_argentinian.txt",
    "folk_aridoamerica.txt",
    "folk_asian.txt",
    "folk_australian.txt",
    "folk_brazilian.txt",
    "folk_caribbean.txt",
    "folk_central_america.txt",
    "folk_european.txt",
    "folk_melanesia.txt",
    "folk_micronesia.txt",
    "folk_north_america.txt",
    "folk_papuan.txt",
    "folk_permic.txt",
    "folk_peruvian.txt",
    "folk_polynesia.txt",
    "folk_se_asian.txt",
    "folk_south_american.txt",
    "israelite.txt",
    "mandean.txt",
    "manichaeism.txt",
    "muslim.txt",
    "tonal.txt",
    "yazidi.txt",
    "zoroastrian.txt",
  ],
  "in_game/common/holy_sites": [
    "bogomilism.txt",
    "bosnian_church.txt",
    "catholic.txt",
    "hellenism.txt",
    "hindu.txt",
    "inti.txt",
    "islam.txt",
    "jain.txt",
    "mahayana.txt",
    "mayan.txt",
    "mesoamerican.txt",
    "nestorian.txt",
    "orthodox.txt",
    "sanjiao.txt",
    "shinto.txt",
    "theravada.txt",
  ],
  "in_game/common/gods": [
    "common.txt",
    "folk_african.txt",
    "folk_american.txt",
    "folk_asian.txt",
    "folk_default.txt",
    "hellenism.txt",
    "hindu.txt",
    "inti.txt",
    "mesoamerican.txt",
    "norse.txt",
    "tengri.txt",
  ],
  "in_game/common/religious_aspects": [
    "anglican.txt",
    "bogomilism.txt",
    "calvinist.txt",
    "catharism.txt",
    "common.txt",
    "folk_african.txt",
    "folk_american.txt",
    "folk_asian.txt",
    "folk_default.txt",
    "hellenism.txt",
    "hussite.txt",
    "inti.txt",
    "miaphysite.txt",
    "norse.txt",
    "paulicianism.txt",
    "protestant.txt",
    "tengri.txt",
    "tonal.txt",
  ],
  "in_game/common/religious_factions": [
    "shinto.txt",
  ],
  "in_game/common/religious_figures": [
    "00_muslim.txt",
    "01_hindu.txt",
  ],
  "in_game/common/religious_focuses": [
    "nahuatl.txt",
  ],
  "in_game/common/religious_schools": [
    "hinduism.txt",
    "ibadi.txt",
    "jain.txt",
    "shia.txt",
    "sufi.txt",
    "sunni.txt",
  ],
};

const religionDisplay = {
  kemetic: "Kemetic",
  mesopotamian: "Mesopotamian",
  assyrian: "Ashurite",
  babylonian: "Babylonian",
  sumerian: "Sumerian",
  hittite: "Hittite",
  luwian: "Luwian",
  hattian: "Hattian",
  canaanite: "Canaanite",
  phoenician: "Phoenician",
  ugaritic: "Ugaritic",
  arabian_pagan: "Arabian Rites",
  dilmunite: "Dilmunite",
  sabaean: "Sabaean",
  elamite: "Elamite",
  iranic: "Iranic",
  margian: "Margian",
  kartvelian_pagan: "Kartvelian Rites",
  urartian: "Urartian",
  caucasian_pagan: "Caucasian Rites",
  steppe_pagan: "Steppe Rites",
  saka_pagan: "Saka Rites",
  scythian_pagan: "Scythian Rites",
  minoan: "Minoan",
  mycenaean: "Mycenaean",
  hellenic: "Hellenic",
  thracian_pagan: "Thracian Rites",
  illyrian_pagan: "Illyrian Rites",
  dacian_pagan: "Dacian Rites",
  italic_pagan: "Italic Rites",
  etruscan: "Etruscan",
  nuragic: "Nuragic",
  iberian_pagan: "Iberian Rites",
  tartessian: "Tartessian",
  lusitanian_pagan: "Lusitanian Rites",
  gaulish_pagan: "Gaulish Rites",
  britannic_pagan: "Britannic Rites",
  nordic_pagan: "Nordic Rites",
  vedic: "Vedic",
  dravidian_folk: "Dravidian Folk Rites",
  harappan: "Harappan",
  berber_pagan: "Berber Rites",
  nubian: "Nubian",
  garamantian: "Garamantian",
  sea_peoples_cult: "Sea Peoples Cult",
  shang_rites: "Shang Rites",
  zhou_rites: "Zhou Rites",
  sanxingdui_rites: "Sanxingdui Rites",
  baiyue_rites: "Baiyue Rites",
  jomon_rites: "Jomon Rites",
  mumun_rites: "Mumun Rites",
  austroasiatic_rites: "Austroasiatic Rites",
  khmer_rites: "Khmer Rites",
  austronesian_rites: "Austronesian Rites",
  karasuk_rites: "Karasuk Rites",
  puntite_rites: "Puntite Rites",
  cushitic_rites: "Cushitic Rites",
  nilo_saharan_rites: "Nilo-Saharan Rites",
  mande_rites: "Mande Rites",
  bantu_rites: "Bantu Rites",
  khoisan_rites: "Khoisan Rites",
  olmec_rites: "Olmec Rites",
  mayan_rites: "Mayan Rites",
  zapotec_rites: "Zapotec Rites",
  puebloan_rites: "Puebloan Rites",
  andean_rites: "Andean Rites",
  woodland_rites: "Woodland Rites",
  arawak_rites: "Arawak Rites",
  tupi_rites: "Tupi Rites",
  saqqaq_rites: "Saqqaq Rites",
  lapita_rites: "Lapita Rites",
  papuan_rites: "Papuan Rites",
  dreaming_ways: "Dreaming Ways",
};

const groupDisplay = Object.fromEntries(religionGroups.map(([id, label]) => [id, label]));

const religionProfiles = {
  temple: {
    tags: "folk_european_gfx pagan_gfx",
    modifier: {
      monthly_legitimacy: 0.1,
      global_clergy_estate_power: 0.1,
      global_build_buildings_cost: -0.03,
      global_pop_conversion_speed_modifier: -0.1,
    },
  },
  river: {
    tags: "folk_african_gfx pagan_gfx",
    modifier: {
      monthly_legitimacy: 0.1,
      global_monthly_food_modifier: 0.05,
      global_clergy_estate_power: 0.1,
      global_pop_conversion_speed_modifier: -0.1,
    },
  },
  tribal: {
    tags: "folk_european_gfx pagan_gfx",
    modifier: {
      global_levy_size_modifier: 0.05,
      army_light_infantry_power: 0.05,
      tolerance_heathen: 0.5,
      global_pop_conversion_speed_modifier: -0.05,
    },
  },
  steppe: {
    tags: "folk_european_gfx pagan_gfx",
    modifier: {
      army_light_cavalry_power: 0.1,
      movement_speed_if_no_road: 0.05,
      global_levy_size_modifier: 0.05,
      global_pop_conversion_speed_modifier: -0.05,
    },
  },
  maritime: {
    tags: "folk_european_gfx pagan_gfx",
    modifier: {
      global_maritime_presence_modifier: 0.1,
      global_trade_protection_factor: 0.1,
      ship_build_speed: 0.05,
      naval_morale_attrition_cost: -0.001,
    },
  },
  mountain: {
    tags: "folk_european_gfx pagan_gfx",
    modifier: {
      global_defensive: 0.1,
      retreat_delay: -5,
      tolerance_heathen: 0.5,
    },
  },
  indic: {
    tags: "dharmic_gfx pagan_gfx",
    modifier: {
      global_max_literacy: 5,
      global_monthly_food_modifier: 0.05,
      global_clergy_estate_power: 0.05,
      global_pop_conversion_speed_modifier: -0.05,
    },
  },
  forest: {
    tags: "folk_european_gfx pagan_gfx",
    modifier: {
      global_wild_game_output_modifier: 0.1,
      expand_rgo_forestry_cost_modifier: -0.1,
      global_levy_size_modifier: 0.05,
    },
  },
};

const religionData = {
  kemetic: { color: "rgb { 212 174 82 }", profile: "river" },
  mesopotamian: { color: "rgb { 170 122 75 }", profile: "temple" },
  assyrian: { color: "rgb { 145 90 58 }", profile: "temple", modifier: { army_heavy_infantry_power: 0.05 } },
  babylonian: { color: "rgb { 183 126 72 }", profile: "temple" },
  sumerian: { color: "rgb { 195 141 79 }", profile: "temple", modifier: { global_monthly_food_modifier: 0.05 } },
  hittite: { color: "rgb { 164 107 68 }", profile: "temple", modifier: { global_defensive: 0.05 } },
  luwian: { color: "rgb { 189 132 73 }", profile: "temple" },
  hattian: { color: "rgb { 128 107 83 }", profile: "mountain" },
  canaanite: { color: "rgb { 184 143 70 }", profile: "temple" },
  phoenician: { color: "rgb { 94 145 166 }", profile: "maritime" },
  ugaritic: { color: "rgb { 122 128 168 }", profile: "maritime", modifier: { global_max_literacy: 3 } },
  arabian_pagan: { color: "rgb { 175 137 78 }", profile: "tribal" },
  dilmunite: { color: "rgb { 78 151 153 }", profile: "maritime" },
  sabaean: { color: "rgb { 191 146 70 }", profile: "temple" },
  elamite: { color: "rgb { 109 87 80 }", profile: "temple" },
  iranic: { color: "rgb { 125 145 86 }", profile: "tribal" },
  margian: { color: "rgb { 142 126 86 }", profile: "temple" },
  kartvelian_pagan: { color: "rgb { 94 137 103 }", profile: "mountain" },
  urartian: { color: "rgb { 90 114 133 }", profile: "temple" },
  caucasian_pagan: { color: "rgb { 98 132 112 }", profile: "mountain" },
  steppe_pagan: { color: "rgb { 146 134 92 }", profile: "steppe" },
  saka_pagan: { color: "rgb { 129 135 91 }", profile: "steppe" },
  scythian_pagan: { color: "rgb { 116 123 92 }", profile: "steppe" },
  minoan: { color: "rgb { 68 150 177 }", profile: "maritime" },
  mycenaean: { color: "rgb { 76 119 185 }", profile: "temple", modifier: { army_heavy_infantry_power: 0.05 } },
  hellenic: { color: "rgb { 88 133 196 }", profile: "tribal", modifier: { skill_of_new_artists: 0.05 } },
  thracian_pagan: { color: "rgb { 111 137 119 }", profile: "tribal" },
  illyrian_pagan: { color: "rgb { 90 126 124 }", profile: "mountain" },
  dacian_pagan: { color: "rgb { 100 135 98 }", profile: "tribal" },
  italic_pagan: { color: "rgb { 151 112 106 }", profile: "tribal" },
  etruscan: { color: "rgb { 137 98 105 }", profile: "temple", modifier: { global_max_literacy: 3 } },
  nuragic: { color: "rgb { 126 119 79 }", profile: "maritime" },
  iberian_pagan: { color: "rgb { 179 117 84 }", profile: "tribal" },
  tartessian: { color: "rgb { 195 127 72 }", profile: "maritime" },
  lusitanian_pagan: { color: "rgb { 135 128 88 }", profile: "tribal" },
  gaulish_pagan: { color: "rgb { 82 145 91 }", profile: "forest" },
  britannic_pagan: { color: "rgb { 92 130 99 }", profile: "forest" },
  nordic_pagan: { color: "rgb { 95 131 154 }", profile: "forest" },
  vedic: { color: "rgb { 177 121 64 }", profile: "indic" },
  dravidian_folk: { color: "rgb { 132 95 67 }", profile: "indic" },
  harappan: { color: "rgb { 174 116 61 }", profile: "river" },
  berber_pagan: { color: "rgb { 174 126 77 }", profile: "tribal" },
  nubian: { color: "rgb { 122 78 49 }", profile: "river" },
  garamantian: { color: "rgb { 157 111 67 }", profile: "tribal" },
  sea_peoples_cult: { color: "rgb { 75 137 166 }", profile: "maritime", modifier: { auto_slave_raid_different_religion: "yes" } },
  shang_rites: { color: "rgb { 180 80 65 }", profile: "temple" },
  zhou_rites: { color: "rgb { 165 98 70 }", profile: "temple" },
  sanxingdui_rites: { color: "rgb { 154 111 84 }", profile: "temple" },
  baiyue_rites: { color: "rgb { 86 141 99 }", profile: "forest" },
  jomon_rites: { color: "rgb { 145 96 73 }", profile: "forest" },
  mumun_rites: { color: "rgb { 120 126 94 }", profile: "tribal" },
  austroasiatic_rites: { color: "rgb { 77 139 94 }", profile: "forest" },
  khmer_rites: { color: "rgb { 91 132 78 }", profile: "river" },
  austronesian_rites: { color: "rgb { 68 138 151 }", profile: "maritime" },
  karasuk_rites: { color: "rgb { 118 151 171 }", profile: "steppe" },
  puntite_rites: { color: "rgb { 135 106 72 }", profile: "maritime" },
  cushitic_rites: { color: "rgb { 130 115 72 }", profile: "tribal" },
  nilo_saharan_rites: { color: "rgb { 109 114 82 }", profile: "river" },
  mande_rites: { color: "rgb { 132 102 66 }", profile: "tribal" },
  bantu_rites: { color: "rgb { 107 119 68 }", profile: "forest" },
  khoisan_rites: { color: "rgb { 146 106 72 }", profile: "tribal" },
  olmec_rites: { color: "rgb { 154 92 62 }", profile: "temple" },
  mayan_rites: { color: "rgb { 130 111 70 }", profile: "temple" },
  zapotec_rites: { color: "rgb { 143 99 64 }", profile: "temple" },
  puebloan_rites: { color: "rgb { 160 112 78 }", profile: "tribal" },
  andean_rites: { color: "rgb { 151 105 73 }", profile: "temple" },
  woodland_rites: { color: "rgb { 103 130 83 }", profile: "forest" },
  arawak_rites: { color: "rgb { 83 139 123 }", profile: "maritime" },
  tupi_rites: { color: "rgb { 82 134 84 }", profile: "forest" },
  saqqaq_rites: { color: "rgb { 118 151 171 }", profile: "tribal" },
  lapita_rites: { color: "rgb { 69 135 147 }", profile: "maritime" },
  papuan_rites: { color: "rgb { 101 111 142 }", profile: "forest" },
  dreaming_ways: { color: "rgb { 145 98 64 }", profile: "tribal" },
};

const cultureReligionMap = {
  egyptian: "kemetic",
  upper_egyptian: "kemetic",
  lower_egyptian: "kemetic",
  nubian: "nubian",
  medjay: "nubian",
  libyan: "berber_pagan",
  sumerian: "sumerian",
  akkadian: "mesopotamian",
  babylonian: "babylonian",
  assyrian: "assyrian",
  amorite: "mesopotamian",
  kassite: "babylonian",
  elamite: "elamite",
  hurrian: "caucasian_pagan",
  gutian: "caucasian_pagan",
  hittite: "hittite",
  luwian: "luwian",
  hattian: "hattian",
  lycian: "luwian",
  carian: "luwian",
  palaic: "hattian",
  phrygian: "hittite",
  canaanite: "canaanite",
  ugaritic: "ugaritic",
  phoenician: "phoenician",
  moabite: "canaanite",
  edomite: "canaanite",
  ammonite: "canaanite",
  aramaean: "canaanite",
  arabian: "arabian_pagan",
  midianite: "arabian_pagan",
  dilmunite: "dilmunite",
  sabaean: "sabaean",
  margian: "margian",
  bactrian: "iranic",
  arian: "iranic",
  mede: "iranic",
  persian: "iranic",
  gedrosian: "iranic",
  kartvelian: "kartvelian_pagan",
  colchian: "kartvelian_pagan",
  urartian: "urartian",
  albanian_caucasian: "caucasian_pagan",
  nakh: "caucasian_pagan",
  circassian: "caucasian_pagan",
  sintashta: "steppe_pagan",
  andronovo: "steppe_pagan",
  cimmerian: "scythian_pagan",
  scythian: "scythian_pagan",
  saka: "saka_pagan",
  roxolani: "scythian_pagan",
  mycenaean: "mycenaean",
  minoan: "minoan",
  aeolian: "hellenic",
  ionian: "hellenic",
  dorian: "hellenic",
  arcadian: "hellenic",
  cycladic: "hellenic",
  thracian: "thracian_pagan",
  illyrian: "illyrian_pagan",
  dacian: "dacian_pagan",
  paeonian: "thracian_pagan",
  pelasgian: "hellenic",
  triballian: "thracian_pagan",
  latin: "italic_pagan",
  etruscan: "etruscan",
  umbrian: "italic_pagan",
  samnite: "italic_pagan",
  sicel: "italic_pagan",
  nuragic: "nuragic",
  ligurian: "italic_pagan",
  iberian: "iberian_pagan",
  tartessian: "tartessian",
  lusitanian: "lusitanian_pagan",
  celtiberian: "iberian_pagan",
  aquitanian: "iberian_pagan",
  gaulish: "gaulish_pagan",
  armorican: "gaulish_pagan",
  lepontic: "gaulish_pagan",
  nordic: "nordic_pagan",
  jutlandic: "nordic_pagan",
  germanic: "nordic_pagan",
  britannic: "britannic_pagan",
  caledonian: "britannic_pagan",
  hibernian: "britannic_pagan",
  harappan: "harappan",
  vedic: "vedic",
  dravidian: "dravidian_folk",
  gandharan: "vedic",
  tocharian: "steppe_pagan",
  sogdian: "iranic",
  ferghana: "saka_pagan",
  berber: "berber_pagan",
  garamantian: "garamantian",
  libu: "berber_pagan",
  sherden: "sea_peoples_cult",
  peleset: "sea_peoples_cult",
  tjekker: "sea_peoples_cult",
  denyen: "sea_peoples_cult",
  lukka: "sea_peoples_cult",
  shang: "shang_rites",
  zhou: "zhou_rites",
  sanxingdui: "sanxingdui_rites",
  dongyi: "shang_rites",
  baiyue: "baiyue_rites",
  qiang: "zhou_rites",
  jomon: "jomon_rites",
  mumun: "mumun_rites",
  austroasiatic: "austroasiatic_rites",
  vietic: "austroasiatic_rites",
  mon: "austroasiatic_rites",
  khmer: "khmer_rites",
  austronesian: "austronesian_rites",
  karasuk: "karasuk_rites",
  yeniseian: "karasuk_rites",
  tungusic: "karasuk_rites",
  puntite: "puntite_rites",
  cushitic: "cushitic_rites",
  nilo_saharan: "nilo_saharan_rites",
  bantu: "bantu_rites",
  nok: "mande_rites",
  mande: "mande_rites",
  khoisan: "khoisan_rites",
  olmec: "olmec_rites",
  mayan: "mayan_rites",
  zapotec: "zapotec_rites",
  poverty_point: "woodland_rites",
  puebloan: "puebloan_rites",
  andean: "andean_rites",
  chorrera: "andean_rites",
  arawak: "arawak_rites",
  tupi: "tupi_rites",
  araucanian: "andean_rites",
  saqqaq: "saqqaq_rites",
  lapita: "lapita_rites",
  papuan: "papuan_rites",
  aboriginal: "dreaming_ways",
};

const locationReligionOverrides = new Map([
  ["ahvaz", "elamite"],
  ["dowraq", "elamite"],
  ["hamidiyeh", "elamite"],
  ["hoveyzeh", "elamite"],
  ["mosharahat", "elamite"],
  ["muhammerah", "elamite"],
  ["masjed_soleyman", "elamite"],
  ["shush", "elamite"],
  ["shushtar", "elamite"],
  ["izeh", "elamite"],
  ["khalafabad", "elamite"],
]);

const holySites = [
  ["iunu_solar_precinct", "giza", "temple", 5, ["kemetic"]],
  ["waset_estate_of_amun", "akhmim", "temple", 5, ["kemetic"]],
  ["abu_sanctuary", "aswan", "shrine", 4, ["kemetic", "nubian"]],
  ["eridu_apsu", "basra", "temple", 5, ["sumerian", "mesopotamian"]],
  ["babylon_esagila", "hillah", "city", 5, ["babylonian", "mesopotamian"]],
  ["ashur_temple", "mosul", "temple", 5, ["assyrian"]],
  ["susa_high_temple", "shush", "temple", 5, ["elamite"]],
  ["hattusa_storm_temple", "corum", "temple", 5, ["hittite", "hattian"]],
  ["tarhuntassa_sanctuary", "tarsus", "temple", 4, ["luwian", "sea_peoples_cult"]],
  ["arinna_sun_house", "ankara", "shrine", 4, ["hittite"]],
  ["ugarit_baal_precinct", "latakia", "temple", 5, ["ugaritic", "canaanite"]],
  ["byblos_lady_temple", "beirut", "temple", 4, ["phoenician", "canaanite"]],
  ["sidon_sea_gate", "sidon", "shrine", 4, ["phoenician", "sea_peoples_cult"]],
  ["dilmun_spring_temple", "manama", "temple", 5, ["dilmunite"]],
  ["saba_moon_temple", "nizwa", "temple", 4, ["sabaean", "arabian_pagan"]],
  ["bactra_fire_enclosure", "balkh", "shrine", 4, ["iranic"]],
  ["margiana_oasis_temple", "merv", "temple", 5, ["margian"]],
  ["van_rock_sanctuary", "erzurum", "mountain", 5, ["urartian"]],
  ["colchian_grove", "batumi", "shrine", 4, ["kartvelian_pagan", "caucasian_pagan"]],
  ["steppe_sky_mound", "dehistan", "shrine", 3, ["steppe_pagan", "saka_pagan"]],
  ["tauric_rider_shrine", "cetatea_alba", "shrine", 3, ["scythian_pagan"]],
  ["knossos_peak_shrine", "candia", "temple", 5, ["minoan"]],
  ["mycenae_palace_shrine", "argos", "temple", 5, ["mycenaean"]],
  ["delos_birth_shrine", "mykonos", "shrine", 3, ["hellenic"]],
  ["thracian_horseman_sanctuary", "serres", "shrine", 3, ["thracian_pagan"]],
  ["illyrian_mountain_grove", "ohrid", "mountain", 3, ["illyrian_pagan"]],
  ["sarmizegetusa_heights", "deva", "mountain", 4, ["dacian_pagan"]],
  ["tiber_hearth", "rome", "temple", 4, ["italic_pagan", "etruscan"]],
  ["etruscan_haruspex_house", "chiusi", "temple", 4, ["etruscan"]],
  ["nuraghe_high_place", "cagliari", "shrine", 5, ["nuragic", "sea_peoples_cult"]],
  ["tartessos_river_temple", "huelva", "temple", 5, ["tartessian"]],
  ["iberian_hill_shrine", "cartagena", "shrine", 3, ["iberian_pagan"]],
  ["lusitanian_mountain_grove", "tavira", "mountain", 3, ["lusitanian_pagan"]],
  ["gaulish_oak_grove", "paris", "shrine", 3, ["gaulish_pagan"]],
  ["britannic_stone_circle", "london", "shrine", 4, ["britannic_pagan"]],
  ["nordic_solar_barrows", "uppsala", "shrine", 4, ["nordic_pagan"]],
  ["sarasvati_fire_altar", "delhi", "temple", 5, ["vedic"]],
  ["indus_bath_precinct", "sukkur", "temple", 5, ["harappan"]],
  ["southern_mother_shrine", "madurai", "temple", 4, ["dravidian_folk"]],
  ["napata_river_temple", "aswan", "temple", 4, ["nubian", "kemetic"]],
  ["siwa_oracle_oasis", "siwa", "shrine", 4, ["berber_pagan", "garamantian"]],
  ["shang_ancestral_temple", "kaifeng", "temple", 5, ["shang_rites", "zhou_rites"]],
  ["sanxingdui_bronze_altar", "chengdu", "temple", 5, ["sanxingdui_rites"]],
  ["jomon_shell_shrine", "imizu", "shrine", 3, ["jomon_rites"]],
  ["lapita_sea_shrine", "tongatapu", "shrine", 3, ["lapita_rites", "austronesian_rites"]],
  ["olmec_jaguar_altar", "cempoala", "temple", 4, ["olmec_rites"]],
  ["andean_mountain_huaca", "tiwanaku", "mountain", 4, ["andean_rites"]],
];

const gods = [
  ["ra_sun_disk", "god_folk_yellow", "kemetic", "monthly_legitimacy", 0.1],
  ["amun_hidden_wind", "god_folk_blue", "kemetic", "global_clergy_estate_power", 0.05],
  ["enlil_great_mountain", "god_folk_blue", "mesopotamian", "global_monthly_control", 0.001],
  ["ishtar_evening_star", "god_folk_pink", "babylonian", "global_population_growth", 0.0001],
  ["ashur_winged_lord", "god_folk_red", "assyrian", "army_heavy_infantry_power", 0.03],
  ["teshub_storm_lord", "god_folk_blue", "hittite", "global_defensive", 0.05],
  ["baal_storm_rider", "god_folk_blue", "canaanite", "global_monthly_food_modifier", 0.03],
  ["melqart_harbor_lord", "god_folk_dark_blue", "phoenician", "global_maritime_presence_modifier", 0.05],
  ["potnia_labyrinth", "god_folk_green", "minoan", "global_monthly_food_modifier", 0.03],
  ["poseidon_wanax", "god_folk_dark_blue", "mycenaean", "army_heavy_infantry_power", 0.03],
  ["tinia_sky_judge", "god_folk_blue", "etruscan", "global_max_literacy", 2],
  ["indra_thunderer", "god_folk_red", "vedic", "army_light_infantry_power", 0.03],
  ["tabiti_hearth", "god_folk_red", "scythian_pagan", "army_light_cavalry_power", 0.03],
  ["tanit_sea_star", "god_folk_pink", "sea_peoples_cult", "naval_morale_attrition_cost", -0.001],
];

function ensureDir(rel) {
  fs.mkdirSync(path.join(root, rel), { recursive: true });
}

function writeText(rel, text) {
  const normalized = text.replace(/\r+\n/g, "\n").replace(/\r/g, "\n").replace(/\n/g, "\r\n");
  fs.writeFileSync(path.join(root, rel), normalized, "utf8");
}

function writeVanillaRemovalStubs() {
  let count = 0;
  for (const [dir, files] of Object.entries(vanillaRemovalStubs)) {
    ensureDir(dir);
    for (const file of files) {
      writeText(`${dir}/${file}`, "# Bronze Era replacement stub: vanilla medieval and modern religious content is intentionally removed.\n");
      count++;
    }
  }
  return count;
}

function titleFromId(id) {
  if (religionDisplay[id]) return religionDisplay[id];
  if (groupDisplay[id]) return groupDisplay[id];
  return id.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function mergeModifiers(profileName, specific = {}) {
  return { ...religionProfiles[profileName].modifier, ...specific };
}

function generateReligionGroups() {
  let text = "# Bronze Era religion groups. The 1205 BCE setup uses these instead of medieval world religions.\n\n";
  for (const [group, , religions] of religionGroups) {
    const color = religionData[religions[0]].color;
    text += `${group} = {\n`;
    text += `\tcolor = ${color}\n`;
    text += `\tconvert_slaves_at_start = no\n`;
    text += `\tallow_slaves_of_same_group = yes\n`;
    text += `}\n\n`;
  }
  return text;
}

function generateReligions() {
  let text = "# Bronze Age religions and temple systems for the 1205 BCE scenario.\n\n";
  for (const religion of allReligions) {
    const data = religionData[religion];
    const profile = religionProfiles[data.profile];
    const modifiers = mergeModifiers(data.profile, data.modifier);
    text += `${religion} = {\n`;
    text += `\tcolor = ${data.color}\n`;
    text += `\tgroup = ${groupByReligion.get(religion)}\n\n`;
    text += `\tdefinition_modifier = {\n`;
    for (const [key, value] of Object.entries(modifiers)) {
      text += `\t\t${key} = ${value}\n`;
    }
    text += `\t}\n\n`;
    text += `\topinions = {\n\t}\n\n`;
    text += `\ttags = { ${profile.tags} }\n`;
    text += `}\n\n`;
  }
  return text;
}

function getLocations() {
  const text = fs.readFileSync(path.join(root, "main_menu/setup/start/06_pops.txt"), "utf8");
  return new Set([...text.matchAll(/^([A-Za-z0-9_]+)\s*=\s*\{/gm)].map((match) => match[1]).filter((id) => id !== "locations"));
}

function generateHolySites(locations) {
  let text = "# Bronze Age holy sites. Sites with unavailable map locations are omitted by the generator.\n\n";
  const missing = [];
  let count = 0;
  for (const [id, location, type, importance, religions] of holySites) {
    if (!locations.has(location)) {
      missing.push(`${id}:${location}`);
      continue;
    }
    count++;
    text += `${id} = {\n`;
    text += `\tlocation = ${location}\n`;
    text += `\ttype = ${type}\n`;
    text += `\timportance = ${importance}\n`;
    text += `\treligions = { ${religions.join(" ")} }\n`;
    text += `}\n\n`;
  }
  return { text, missing, count };
}

function generateGods() {
  let text = "# Icon-backed deity hooks for Bronze Era religions.\n\n";
  for (const [id, icon, religion, modifier, value] of gods) {
    text += `${id} = {\n`;
    text += `\ticon = ${icon}\n\n`;
    text += `\treligion = {\n`;
    text += `\t\treligion = ${religion}\n`;
    text += `\t\tname_key = ${id}\n`;
    text += `\t}\n\n`;
    text += `\tcountry_modifier = {\n`;
    text += `\t\t${modifier} = ${value}\n`;
    text += `\t}\n`;
    text += `}\n\n`;
  }
  return text;
}

function generateLocalization() {
  let text = "l_english:\n";
  for (const [group] of religionGroups) {
    text += ` ${group}: "${titleFromId(group)}"\n`;
    text += ` ${group}_desc: "Religions of the ${titleFromId(group)} sphere in the Bronze Era setup."\n`;
  }
  for (const religion of allReligions) {
    text += ` ${religion}: "${titleFromId(religion)}"\n`;
    text += ` ${religion}_ADJ: "${titleFromId(religion)}"\n`;
    text += ` ${religion}_desc: "A Bronze Age religious system rooted in local temples, seasonal rites, dynastic cult, and community tradition."\n`;
  }
  for (const [id] of holySites) {
    text += ` ${id}: "${titleFromId(id)}"\n`;
  }
  for (const [id] of gods) {
    text += ` ${id}: "${titleFromId(id)}"\n`;
  }
  return text;
}

function religionForCulture(culture) {
  return cultureReligionMap[culture] || "steppe_pagan";
}

function religionForPlacement(culture, location) {
  return locationReligionOverrides.get(location) || religionForCulture(culture);
}

function rewritePops() {
  const rel = "main_menu/setup/start/06_pops.txt";
  const file = path.join(root, rel);
  const input = fs.readFileSync(file, "utf8");
  const counts = new Map();
  let currentLocation = "";
  const output = input
    .split(/\r?\n/)
    .map((line) => {
      const location = line.match(/^([A-Za-z0-9_]+)\s*=\s*\{$/);
      if (location) currentLocation = location[1];
      return line.replace(/(\bculture\s*=\s*([A-Za-z0-9_]+)\s+religion\s*=\s*)[A-Za-z0-9_]+/g, (_whole, prefix, culture) => {
        const religion = religionForPlacement(culture, currentLocation);
        counts.set(religion, (counts.get(religion) || 0) + 1);
        return `${prefix}${religion}`;
      });
    })
    .join("\n");
  writeText(rel, output);
  return counts;
}

function clearReligionManager() {
  const rel = "main_menu/setup/start/02_core.txt";
  const file = path.join(root, rel);
  const text = fs.readFileSync(file, "utf8");
  const marker = "religion_manager";
  const index = text.indexOf(marker);
  if (index < 0) return false;
  const open = text.indexOf("{", index);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        const next = `${text.slice(0, index)}religion_manager = {\n}\n${text.slice(i + 1).replace(/^\s+/, "\n")}`;
        writeText(rel, next);
        return true;
      }
    }
  }
  return false;
}

function validateReferences() {
  const files = ["main_menu/setup/start/06_pops.txt"];
  const invalid = new Map();
  for (const rel of files) {
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    for (const match of text.matchAll(/\breligion\s*=\s*([A-Za-z0-9_]+)/g)) {
      if (!groupByReligion.has(match[1])) {
        if (!invalid.has(rel)) invalid.set(rel, new Set());
        invalid.get(rel).add(match[1]);
      }
    }
  }
  return invalid;
}

function writeReport(counts, holySiteInfo, invalid, managerCleared, vanillaStubCount) {
  let text = "Bronze Era religion generation report\n";
  text += "=====================================\n\n";
  text += `Defined religions: ${allReligions.length}\n`;
  text += `Defined religion groups: ${religionGroups.length}\n`;
  text += `Holy sites written: ${holySiteInfo.count}\n`;
  text += `Vanilla replacement stubs written: ${vanillaStubCount}\n`;
  text += `Location religion overrides: ${locationReligionOverrides.size}\n`;
  text += `Religion manager cleared: ${managerCleared ? "yes" : "no"}\n\n`;
  text += "Top pop religion assignments:\n";
  for (const [religion, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    text += `- ${religion}: ${count}\n`;
  }
  if (holySiteInfo.missing.length) {
    text += "\nSkipped holy sites with missing locations:\n";
    for (const site of holySiteInfo.missing) text += `- ${site}\n`;
  }
  if (invalid.size > 0) {
    text += "\nInvalid/unconverted references:\n";
    for (const [file, religions] of invalid) text += `- ${file}: ${[...religions].sort().join(", ")}\n`;
  } else {
    text += "\nInvalid/unconverted references: none\n";
  }
  writeText("tools/bronze_religion_generation_report.txt", text);
}

ensureDir("in_game/common/religion_groups");
ensureDir("in_game/common/religions");
ensureDir("in_game/common/holy_sites");
ensureDir("in_game/common/gods");
ensureDir("main_menu/localization/english");
ensureDir("tools");

const vanillaStubCount = writeVanillaRemovalStubs();

writeText("in_game/common/religion_groups/00_bronze_age_religion_groups.txt", generateReligionGroups());
writeText("in_game/common/religions/00_bronze_age_religions.txt", generateReligions());
writeText("in_game/common/gods/00_bronze_age_gods.txt", generateGods());
writeText("main_menu/localization/english/Bronze_religions_l_english.yml", generateLocalization());

const holySiteInfo = generateHolySites(getLocations());
writeText("in_game/common/holy_sites/00_bronze_age_holy_sites.txt", holySiteInfo.text);

const counts = rewritePops();
const managerCleared = clearReligionManager();
const invalid = validateReferences();
writeReport(counts, holySiteInfo, invalid, managerCleared, vanillaStubCount);

if (invalid.size > 0) {
  for (const [file, religions] of invalid) {
    console.error(`${file}: ${[...religions].sort().join(", ")}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Generated ${allReligions.length} religions in ${religionGroups.length} groups.`);
  console.log(`Wrote ${holySiteInfo.count} holy sites.`);
  console.log(`Wrote ${vanillaStubCount} vanilla replacement stubs.`);
  console.log(`Rewrote ${[...counts.values()].reduce((a, b) => a + b, 0)} pop religion references.`);
}
