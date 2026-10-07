export interface SqliteControlRow {
  shortcut: string;
  conversion: string;
  size?: number | string;
  u_cap: string | number;
  l_cap: string | number;
  multiplication: number;
  color: string;
  box_size: number;
  weight_per_pcs: number;
  real_item_name: string;
  group_name: string;
}

export const SQLITE_CONTROL_CONVERSIONS: SqliteControlRow[] = [
  {
    "shortcut": "G1",
    "conversion": "B.F.P-(G)",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "B1",
    "conversion": "B.F.P-(B)",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783701271710",
    "conversion": "B.F.P-(G)-(Digital-or-Golden)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783701291910",
    "conversion": "B.F.P-(A)-(Digital)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "A1",
    "conversion": "B.F.P-(A)",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700664286",
    "conversion": "B.F.P-(A)-(Digital-or-Golden)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700669046",
    "conversion": "B.F.P-(B)-(Digital)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700673198",
    "conversion": "B.F.P-(B)-(Digital-or-Golden)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "G",
    "conversion": "GATTI",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "E",
    "conversion": "ELFY",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "C",
    "conversion": "CLIP",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "B",
    "conversion": "BLACK",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "S",
    "conversion": "SCREW",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "R",
    "conversion": "RAJA",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "T",
    "conversion": "BATTEN",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "O",
    "conversion": "SILICON",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "0",
    "conversion": "U.V",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": ".",
    "conversion": "UVD",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "J",
    "conversion": "Jointer",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "F",
    "conversion": "Fluted Jointer",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "BS",
    "conversion": "BLACK-SCREW",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "P",
    "conversion": "PERAMETER",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "BG1",
    "conversion": "B.F.P-B-(G)",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "A2",
    "conversion": "(A)-CM",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "2",
    "conversion": "C.M",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700689142",
    "conversion": "C.M-(Digital)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700693878",
    "conversion": "C.M-(Digital-or-Golden)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "1",
    "conversion": "B.F.P",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "I",
    "conversion": "GOLDEN-PATTI",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "A",
    "conversion": "GOLDEN-TAPE",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "8",
    "conversion": "L.U",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "9",
    "conversion": "L.A",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "`",
    "conversion": "CP",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783701280062",
    "conversion": "B.F.P-(G)-(Digital)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "3",
    "conversion": "S.L",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "4",
    "conversion": "T.G",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "A4",
    "conversion": "T.G-(A)",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "6",
    "conversion": "H.O",
    "u_cap": "Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700739862",
    "conversion": "T.G-(Digital-or-Golden)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700736526",
    "conversion": "T.G-(Digital)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700721638",
    "conversion": "S.L-(Digital)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700725566",
    "conversion": "S.L-(Digital-or-Golden)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "C5",
    "conversion": "F.P.C",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "CG5",
    "conversion": "F.P.C.G",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "G5",
    "conversion": "F.P.G",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "5",
    "conversion": "F.P",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "CGA5",
    "conversion": "F.P.C.G-(A)",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700697870",
    "conversion": "F.P-(Digital)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700702101",
    "conversion": "F.P-(Digital-or-Golden)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700706654",
    "conversion": "F.P.C.G-(Digital)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700710686",
    "conversion": "F.P.C.G-(Digital-or-Golden)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700714598",
    "conversion": "F.P.G-(Digital)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700718246",
    "conversion": "F.P.G-(Digital-or-Golden)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "7",
    "conversion": "S.P",
    "u_cap": "Fluted Jointer",
    "l_cap": "Jointer",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700728973",
    "conversion": "S.P-(Digital)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  },
  {
    "shortcut": "__auto_1783700732781",
    "conversion": "S.P-(Digital-or-Golden)",
    "u_cap": "0.0",
    "l_cap": "0.0",
    "multiplication": 1.0,
    "color": "#000000",
    "box_size": 1.0,
    "weight_per_pcs": 0.0,
    "real_item_name": "",
    "group_name": "General"
  }
];

export interface SqliteControlGroup {
  group_name: string;
  group_index: number;
  weight: number;
  box_size: number;
  multiplication: number;
  real_item_name: string;
  skip_equation: number;  // 0 = false, 1 = true
  chain_parent: string;
}

export const SQLITE_CONTROL_GROUPS: SqliteControlGroup[] = [
  {
    "group_name": "General",
    "group_index": 0,
    "weight": 0.0,
    "box_size": 1.0,
    "multiplication": 1.0,
    "real_item_name": "General",
    "skip_equation": 0,
    "chain_parent": ""
  },
  {
    "group_name": "BFP",
    "group_index": 1,
    "weight": 3.1,
    "box_size": 10.0,
    "multiplication": 0.915,
    "real_item_name": "PVC PANEL - 39259090 - 135",
    "skip_equation": 0,
    "chain_parent": "SP-FP"
  },
  {
    "group_name": "SP-FP",
    "group_index": 2,
    "weight": 3.2,
    "box_size": 10.0,
    "multiplication": 0.7625,
    "real_item_name": "PVC PANEL - 39259090 - 130",
    "skip_equation": 0,
    "chain_parent": "CM"
  },
  {
    "group_name": "CM",
    "group_index": 4,
    "weight": 2.35,
    "box_size": 10.0,
    "multiplication": 0.7625,
    "real_item_name": "PVC PANEL - 39259090 - 120",
    "skip_equation": 0,
    "chain_parent": "SL-TG-HO"
  },
  {
    "group_name": "SL-TG-HO",
    "group_index": 6,
    "weight": 1.7,
    "box_size": 10.0,
    "multiplication": 0.7625,
    "real_item_name": "PVC PANEL 39259090 - 110 MEDIUM LIGHT SHEETS",
    "skip_equation": 0,
    "chain_parent": ""
  },
  {
    "group_name": "LOUWER",
    "group_index": 8,
    "weight": 2.9,
    "box_size": 10.0,
    "multiplication": 2.9,
    "real_item_name": "PVC PANEL (L)",
    "skip_equation": 0,
    "chain_parent": ""
  },
  {
    "group_name": "UV",
    "group_index": 10,
    "weight": 12.5,
    "box_size": 1.0,
    "multiplication": 1.0,
    "real_item_name": "PVC PANEL (SHEET)",
    "skip_equation": 0,
    "chain_parent": ""
  },
  {
    "group_name": "PERAMETER",
    "group_index": 11,
    "weight": 0.65,
    "box_size": 1.0,
    "multiplication": 0.7,
    "real_item_name": "CEILING SECTION",
    "skip_equation": 0,
    "chain_parent": ""
  },
  {
    "group_name": "HARWARE",
    "group_index": 12,
    "weight": 0.0,
    "box_size": 1.0,
    "multiplication": 1.0,
    "real_item_name": "HARWARE",
    "skip_equation": 1,
    "chain_parent": ""
  },
  {
    "group_name": "JOINTER",
    "group_index": 13,
    "weight": 0.9,
    "box_size": 40.0,
    "multiplication": 3.05,
    "real_item_name": "PVC JOINTER 39259090",
    "skip_equation": 0,
    "chain_parent": ""
  }
];
