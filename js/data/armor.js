/* ---------------- Armor data (SRD) ---------------- */
export var ARMOR_GROUPS = {
  "Light Armor": ["Padded","Leather","Studded Leather"],
  "Medium Armor": ["Hide","Chain Shirt","Scale Mail","Breastplate","Half Plate"],
  "Heavy Armor": ["Ring Mail","Chain Mail","Splint","Plate"],
  "Shields": ["Shield"]
};

/* category: light|medium|heavy|shield; drives the DEX-to-AC formula in
   computeArmorClass(). baseAC for a shield is the flat AC bonus it grants. */
export var ARMOR_DATA = {
  "Padded":         {category:"light",  baseAC:11, weight:8,  stealthDisadvantage:true},
  "Leather":        {category:"light",  baseAC:11, weight:10, stealthDisadvantage:false},
  "Studded Leather":{category:"light",  baseAC:12, weight:13, stealthDisadvantage:false},
  "Hide":           {category:"medium", baseAC:12, weight:12, stealthDisadvantage:false},
  "Chain Shirt":    {category:"medium", baseAC:13, weight:20, stealthDisadvantage:false},
  "Scale Mail":     {category:"medium", baseAC:14, weight:45, stealthDisadvantage:true},
  "Breastplate":    {category:"medium", baseAC:14, weight:20, stealthDisadvantage:false},
  "Half Plate":     {category:"medium", baseAC:15, weight:40, stealthDisadvantage:true},
  "Ring Mail":      {category:"heavy",  baseAC:14, weight:40, stealthDisadvantage:true},
  "Chain Mail":     {category:"heavy",  baseAC:16, weight:55, stealthDisadvantage:true},
  "Splint":         {category:"heavy",  baseAC:17, weight:60, stealthDisadvantage:true},
  "Plate":          {category:"heavy",  baseAC:18, weight:65, stealthDisadvantage:true},
  "Shield":         {category:"shield", baseAC:2,  weight:6,  stealthDisadvantage:false}
};
