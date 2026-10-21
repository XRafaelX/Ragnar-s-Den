/* ---------------- Armor data (SRD, plus Spiked Armor for the Battlerager) ---------------- */
export var ARMOR_GROUPS = {
  "Light Armor": ["Padded","Leather","Studded Leather"],
  "Medium Armor": ["Hide","Chain Shirt","Scale Mail","Spiked Armor","Breastplate","Half Plate"],
  "Heavy Armor": ["Ring Mail","Chain Mail","Splint","Plate"],
  "Shields": ["Shield"]
};

/* category: light|medium|heavy|shield; drives the DEX-to-AC formula in
   computeArmorClass(). baseAC for a shield is the flat AC bonus it grants.
   strReq: the Strength heavy armor needs; below it, speed drops by 10 ft
   (computeSpeed). */
export var ARMOR_DATA = {
  "Padded":         {category:"light",  baseAC:11, weight:8,  stealthDisadvantage:true},
  "Leather":        {category:"light",  baseAC:11, weight:10, stealthDisadvantage:false},
  "Studded Leather":{category:"light",  baseAC:12, weight:13, stealthDisadvantage:false},
  "Hide":           {category:"medium", baseAC:12, weight:12, stealthDisadvantage:false},
  "Chain Shirt":    {category:"medium", baseAC:13, weight:20, stealthDisadvantage:false},
  "Scale Mail":     {category:"medium", baseAC:14, weight:45, stealthDisadvantage:true},
  "Spiked Armor":   {category:"medium", baseAC:14, weight:45, stealthDisadvantage:true},
  "Breastplate":    {category:"medium", baseAC:14, weight:20, stealthDisadvantage:false},
  "Half Plate":     {category:"medium", baseAC:15, weight:40, stealthDisadvantage:true},
  "Ring Mail":      {category:"heavy",  baseAC:14, weight:40, stealthDisadvantage:true},
  "Chain Mail":     {category:"heavy",  baseAC:16, weight:55, stealthDisadvantage:true, strReq:13},
  "Splint":         {category:"heavy",  baseAC:17, weight:60, stealthDisadvantage:true, strReq:15},
  "Plate":          {category:"heavy",  baseAC:18, weight:65, stealthDisadvantage:true, strReq:15},
  "Shield":         {category:"shield", baseAC:2,  weight:6,  stealthDisadvantage:false}
};

/* The AC an armor gives, as a player reads it: "AC 12 + Dex", "AC 14 +
   Dex (max 2)", "AC 18", "+2 AC". `dexCap` is the medium armor cap
   (3 with Medium Armor Master). */
export function armorAcText(d, dexCap){
  var ac = Number(d.baseAC)||0;
  if(d.category==="shield") return "+" + ac + " AC";
  if(d.category==="heavy") return "AC " + ac;
  return "AC " + ac + " + Dex" + (d.category==="medium" ? " (max " + (dexCap || 2) + ")" : "");
}

/* An armor row's catalog entry: its own name's, or the base armor magic
   armor is ("Plate, +1": `baseArmor`). */
export function armorDataOf(item){
  return (item && (ARMOR_DATA[item.name] || ARMOR_DATA[item.baseArmor])) || null;
}
