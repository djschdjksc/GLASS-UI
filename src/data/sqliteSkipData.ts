// =====================================================================
// SQLITE_SKIP_DATA — Generated directly from BillApp_Backup.json (Desktop)
// Fresh Clean Data: 5 Main Groups, 34 Sub Groups, 698 Skip Items
// =====================================================================

export interface SkipMainGroupSeed {
  id: string;
  name: string;
}

export interface SkipSubGroupSeed {
  id: string;
  mainGroupId: string;
  mainGroup: string;
  groupName: string;
  sumColumn: 'QTY' | 'U CAP' | 'L CAP';
}

export interface SkipItemSeed {
  id: string;
  subGroupId: string;
  mainGroup: string;
  groupName: string;
  itemPrefix: string;
}

export const SQLITE_SKIP_MAIN_GROUPS: SkipMainGroupSeed[] = [
  {
    "id": "mg-1",
    "name": "General"
  },
  {
    "id": "mg-2",
    "name": "Digital or Golden"
  },
  {
    "id": "mg-3",
    "name": "Digital"
  },
  {
    "id": "mg-4",
    "name": "Digital or Golden Lower Film"
  },
  {
    "id": "mg-5",
    "name": "7D UV SHEET"
  }
];

export const SQLITE_SKIP_SUB_GROUPS: SkipSubGroupSeed[] = [
  {
    "id": "sg-1",
    "mainGroupId": "mg-2",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(A)-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-2",
    "mainGroupId": "mg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-3",
    "mainGroupId": "mg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-4",
    "mainGroupId": "mg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-5",
    "mainGroupId": "mg-3",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-6",
    "mainGroupId": "mg-3",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-7",
    "mainGroupId": "mg-3",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-8",
    "mainGroupId": "mg-3",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-9",
    "mainGroupId": "mg-3",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-10",
    "mainGroupId": "mg-2",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(B)-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-11",
    "mainGroupId": "mg-2",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(G)-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-12",
    "mainGroupId": "mg-2",
    "mainGroup": "Digital or Golden",
    "groupName": "C.M-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-13",
    "mainGroupId": "mg-2",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-14",
    "mainGroupId": "mg-2",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.C.G-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-15",
    "mainGroupId": "mg-2",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.G-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-16",
    "mainGroupId": "mg-2",
    "mainGroup": "Digital or Golden",
    "groupName": "S.L-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-17",
    "mainGroupId": "mg-2",
    "mainGroup": "Digital or Golden",
    "groupName": "S.P-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-18",
    "mainGroupId": "mg-2",
    "mainGroup": "Digital or Golden",
    "groupName": "T.G-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-19",
    "mainGroupId": "mg-3",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-20",
    "mainGroupId": "mg-3",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-21",
    "mainGroupId": "mg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-22",
    "mainGroupId": "mg-2",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-23",
    "mainGroupId": "mg-4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(A)-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-24",
    "mainGroupId": "mg-4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(B)-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-25",
    "mainGroupId": "mg-4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-26",
    "mainGroupId": "mg-4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(G)-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-27",
    "mainGroupId": "mg-4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "C.M-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-28",
    "mainGroupId": "mg-4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-29",
    "mainGroupId": "mg-4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.C.G-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-30",
    "mainGroupId": "mg-4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.G-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-31",
    "mainGroupId": "mg-4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.L-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-32",
    "mainGroupId": "mg-4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.P-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-33",
    "mainGroupId": "mg-4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "T.G-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-34",
    "mainGroupId": "mg-5",
    "mainGroup": "7D UV SHEET",
    "groupName": "7D UV",
    "sumColumn": "QTY"
  }
];

export const SQLITE_SKIP_ITEMS: SkipItemSeed[] = [
  {
    "id": "si-1",
    "subGroupId": "sg-1",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(A)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(A) 770"
  },
  {
    "id": "si-2",
    "subGroupId": "sg-11",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(G)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(G) 770"
  },
  {
    "id": "si-3",
    "subGroupId": "sg-10",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(B)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(B) 770"
  },
  {
    "id": "si-4",
    "subGroupId": "sg-13",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P-(Digital-or-Golden)",
    "itemPrefix": "F.P 770"
  },
  {
    "id": "si-5",
    "subGroupId": "sg-15",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.G-(Digital-or-Golden)",
    "itemPrefix": "F.P.G 770"
  },
  {
    "id": "si-6",
    "subGroupId": "sg-16",
    "mainGroup": "Digital or Golden",
    "groupName": "S.L-(Digital-or-Golden)",
    "itemPrefix": "S.L 770"
  },
  {
    "id": "si-7",
    "subGroupId": "sg-17",
    "mainGroup": "Digital or Golden",
    "groupName": "S.P-(Digital-or-Golden)",
    "itemPrefix": "S.P 770"
  },
  {
    "id": "si-8",
    "subGroupId": "sg-18",
    "mainGroup": "Digital or Golden",
    "groupName": "T.G-(Digital-or-Golden)",
    "itemPrefix": "T.G 770"
  },
  {
    "id": "si-9",
    "subGroupId": "sg-14",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.C.G-(Digital-or-Golden)",
    "itemPrefix": "F.P.C.G 770"
  },
  {
    "id": "si-10",
    "subGroupId": "sg-12",
    "mainGroup": "Digital or Golden",
    "groupName": "C.M-(Digital-or-Golden)",
    "itemPrefix": "C.M 770"
  },
  {
    "id": "si-11",
    "subGroupId": "sg-22",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(Digital-or-Golden)",
    "itemPrefix": "B.F.P 770"
  },
  {
    "id": "si-12",
    "subGroupId": "sg-23",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(A)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(A) 780"
  },
  {
    "id": "si-13",
    "subGroupId": "sg-24",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(B)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(B) 780"
  },
  {
    "id": "si-14",
    "subGroupId": "sg-25",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P 780"
  },
  {
    "id": "si-15",
    "subGroupId": "sg-26",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(G)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(G) 780"
  },
  {
    "id": "si-16",
    "subGroupId": "sg-27",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "C.M-(Digital)-Lower-Film",
    "itemPrefix": "C.M 780"
  },
  {
    "id": "si-17",
    "subGroupId": "sg-28",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P-(Digital)-Lower-Film",
    "itemPrefix": "F.P 780"
  },
  {
    "id": "si-18",
    "subGroupId": "sg-29",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.C.G-(Digital)-Lower-Film",
    "itemPrefix": "F.P.C.G 780"
  },
  {
    "id": "si-19",
    "subGroupId": "sg-30",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.G-(Digital)-Lower-Film",
    "itemPrefix": "F.P.G 780"
  },
  {
    "id": "si-20",
    "subGroupId": "sg-31",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.L-(Digital)-Lower-Film",
    "itemPrefix": "S.L 780"
  },
  {
    "id": "si-21",
    "subGroupId": "sg-32",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.P-(Digital)-Lower-Film",
    "itemPrefix": "S.P 780"
  },
  {
    "id": "si-22",
    "subGroupId": "sg-33",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "T.G-(Digital)-Lower-Film",
    "itemPrefix": "T.G 780"
  },
  {
    "id": "si-23",
    "subGroupId": "sg-1",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(A)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(A) 770"
  },
  {
    "id": "si-24",
    "subGroupId": "sg-11",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(G)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(G) 770"
  },
  {
    "id": "si-25",
    "subGroupId": "sg-10",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(B)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(B) 770"
  },
  {
    "id": "si-26",
    "subGroupId": "sg-13",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P-(Digital-or-Golden)",
    "itemPrefix": "F.P 770"
  },
  {
    "id": "si-27",
    "subGroupId": "sg-15",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.G-(Digital-or-Golden)",
    "itemPrefix": "F.P.G 770"
  },
  {
    "id": "si-28",
    "subGroupId": "sg-16",
    "mainGroup": "Digital or Golden",
    "groupName": "S.L-(Digital-or-Golden)",
    "itemPrefix": "S.L 770"
  },
  {
    "id": "si-29",
    "subGroupId": "sg-17",
    "mainGroup": "Digital or Golden",
    "groupName": "S.P-(Digital-or-Golden)",
    "itemPrefix": "S.P 770"
  },
  {
    "id": "si-30",
    "subGroupId": "sg-18",
    "mainGroup": "Digital or Golden",
    "groupName": "T.G-(Digital-or-Golden)",
    "itemPrefix": "T.G 770"
  },
  {
    "id": "si-31",
    "subGroupId": "sg-14",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.C.G-(Digital-or-Golden)",
    "itemPrefix": "F.P.C.G 770"
  },
  {
    "id": "si-32",
    "subGroupId": "sg-12",
    "mainGroup": "Digital or Golden",
    "groupName": "C.M-(Digital-or-Golden)",
    "itemPrefix": "C.M 770"
  },
  {
    "id": "si-33",
    "subGroupId": "sg-22",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(Digital-or-Golden)",
    "itemPrefix": "B.F.P 770"
  },
  {
    "id": "si-34",
    "subGroupId": "sg-23",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(A)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(A) 780"
  },
  {
    "id": "si-35",
    "subGroupId": "sg-24",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(B)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(B) 780"
  },
  {
    "id": "si-36",
    "subGroupId": "sg-25",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P 780"
  },
  {
    "id": "si-37",
    "subGroupId": "sg-26",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(G)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(G) 780"
  },
  {
    "id": "si-38",
    "subGroupId": "sg-27",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "C.M-(Digital)-Lower-Film",
    "itemPrefix": "C.M 780"
  },
  {
    "id": "si-39",
    "subGroupId": "sg-28",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P-(Digital)-Lower-Film",
    "itemPrefix": "F.P 780"
  },
  {
    "id": "si-40",
    "subGroupId": "sg-29",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.C.G-(Digital)-Lower-Film",
    "itemPrefix": "F.P.C.G 780"
  },
  {
    "id": "si-41",
    "subGroupId": "sg-30",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.G-(Digital)-Lower-Film",
    "itemPrefix": "F.P.G 780"
  },
  {
    "id": "si-42",
    "subGroupId": "sg-31",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.L-(Digital)-Lower-Film",
    "itemPrefix": "S.L 780"
  },
  {
    "id": "si-43",
    "subGroupId": "sg-32",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.P-(Digital)-Lower-Film",
    "itemPrefix": "S.P 780"
  },
  {
    "id": "si-44",
    "subGroupId": "sg-33",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "T.G-(Digital)-Lower-Film",
    "itemPrefix": "T.G 780"
  },
  {
    "id": "si-45",
    "subGroupId": "sg-1",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(A)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(A) 770"
  },
  {
    "id": "si-46",
    "subGroupId": "sg-11",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(G)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(G) 770"
  },
  {
    "id": "si-47",
    "subGroupId": "sg-10",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(B)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(B) 770"
  },
  {
    "id": "si-48",
    "subGroupId": "sg-13",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P-(Digital-or-Golden)",
    "itemPrefix": "F.P 770"
  },
  {
    "id": "si-49",
    "subGroupId": "sg-15",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.G-(Digital-or-Golden)",
    "itemPrefix": "F.P.G 770"
  },
  {
    "id": "si-50",
    "subGroupId": "sg-16",
    "mainGroup": "Digital or Golden",
    "groupName": "S.L-(Digital-or-Golden)",
    "itemPrefix": "S.L 770"
  },
  {
    "id": "si-51",
    "subGroupId": "sg-17",
    "mainGroup": "Digital or Golden",
    "groupName": "S.P-(Digital-or-Golden)",
    "itemPrefix": "S.P 770"
  },
  {
    "id": "si-52",
    "subGroupId": "sg-18",
    "mainGroup": "Digital or Golden",
    "groupName": "T.G-(Digital-or-Golden)",
    "itemPrefix": "T.G 770"
  },
  {
    "id": "si-53",
    "subGroupId": "sg-14",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.C.G-(Digital-or-Golden)",
    "itemPrefix": "F.P.C.G 770"
  },
  {
    "id": "si-54",
    "subGroupId": "sg-12",
    "mainGroup": "Digital or Golden",
    "groupName": "C.M-(Digital-or-Golden)",
    "itemPrefix": "C.M 770"
  },
  {
    "id": "si-55",
    "subGroupId": "sg-22",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(Digital-or-Golden)",
    "itemPrefix": "B.F.P 770"
  },
  {
    "id": "si-56",
    "subGroupId": "sg-23",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(A)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(A) 780"
  },
  {
    "id": "si-57",
    "subGroupId": "sg-24",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(B)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(B) 780"
  },
  {
    "id": "si-58",
    "subGroupId": "sg-25",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P 780"
  },
  {
    "id": "si-59",
    "subGroupId": "sg-26",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(G)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(G) 780"
  },
  {
    "id": "si-60",
    "subGroupId": "sg-27",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "C.M-(Digital)-Lower-Film",
    "itemPrefix": "C.M 780"
  },
  {
    "id": "si-61",
    "subGroupId": "sg-28",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P-(Digital)-Lower-Film",
    "itemPrefix": "F.P 780"
  },
  {
    "id": "si-62",
    "subGroupId": "sg-29",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.C.G-(Digital)-Lower-Film",
    "itemPrefix": "F.P.C.G 780"
  },
  {
    "id": "si-63",
    "subGroupId": "sg-30",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.G-(Digital)-Lower-Film",
    "itemPrefix": "F.P.G 780"
  },
  {
    "id": "si-64",
    "subGroupId": "sg-31",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.L-(Digital)-Lower-Film",
    "itemPrefix": "S.L 780"
  },
  {
    "id": "si-65",
    "subGroupId": "sg-32",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.P-(Digital)-Lower-Film",
    "itemPrefix": "S.P 780"
  },
  {
    "id": "si-66",
    "subGroupId": "sg-33",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "T.G-(Digital)-Lower-Film",
    "itemPrefix": "T.G 780"
  },
  {
    "id": "si-67",
    "subGroupId": "sg-34",
    "mainGroup": "7D UV SHEET",
    "groupName": "7D UV",
    "itemPrefix": "UVD 2044"
  },
  {
    "id": "si-68",
    "subGroupId": "sg-34",
    "mainGroup": "7D UV SHEET",
    "groupName": "7D UV",
    "itemPrefix": "UVD 2043"
  },
  {
    "id": "si-69",
    "subGroupId": "sg-34",
    "mainGroup": "7D UV SHEET",
    "groupName": "7D UV",
    "itemPrefix": "UVD 2042"
  },
  {
    "id": "si-70",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 200"
  },
  {
    "id": "si-71",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 209"
  },
  {
    "id": "si-72",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 216"
  },
  {
    "id": "si-73",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 217"
  },
  {
    "id": "si-74",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 756"
  },
  {
    "id": "si-75",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 768"
  },
  {
    "id": "si-76",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 769"
  },
  {
    "id": "si-77",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 770"
  },
  {
    "id": "si-78",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 773"
  },
  {
    "id": "si-79",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 773"
  },
  {
    "id": "si-80",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 773"
  },
  {
    "id": "si-81",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 774"
  },
  {
    "id": "si-82",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 774"
  },
  {
    "id": "si-83",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 774"
  },
  {
    "id": "si-84",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 775"
  },
  {
    "id": "si-85",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 775"
  },
  {
    "id": "si-86",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 775"
  },
  {
    "id": "si-87",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 776"
  },
  {
    "id": "si-88",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 776"
  },
  {
    "id": "si-89",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 776"
  },
  {
    "id": "si-90",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 777"
  },
  {
    "id": "si-91",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 777"
  },
  {
    "id": "si-92",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 777"
  },
  {
    "id": "si-93",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 778"
  },
  {
    "id": "si-94",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 778"
  },
  {
    "id": "si-95",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 778"
  },
  {
    "id": "si-96",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 779"
  },
  {
    "id": "si-97",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 779"
  },
  {
    "id": "si-98",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 779"
  },
  {
    "id": "si-99",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 780"
  },
  {
    "id": "si-100",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 781"
  },
  {
    "id": "si-101",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 781"
  },
  {
    "id": "si-102",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 781"
  },
  {
    "id": "si-103",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 782"
  },
  {
    "id": "si-104",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 782"
  },
  {
    "id": "si-105",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 782"
  },
  {
    "id": "si-106",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 783"
  },
  {
    "id": "si-107",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 783"
  },
  {
    "id": "si-108",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 783"
  },
  {
    "id": "si-109",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 785"
  },
  {
    "id": "si-110",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 785"
  },
  {
    "id": "si-111",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 785"
  },
  {
    "id": "si-112",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 786"
  },
  {
    "id": "si-113",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 787"
  },
  {
    "id": "si-114",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 800"
  },
  {
    "id": "si-115",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 801"
  },
  {
    "id": "si-116",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 802"
  },
  {
    "id": "si-117",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 802"
  },
  {
    "id": "si-118",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 803"
  },
  {
    "id": "si-119",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 803"
  },
  {
    "id": "si-120",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 804"
  },
  {
    "id": "si-121",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 804"
  },
  {
    "id": "si-122",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 805"
  },
  {
    "id": "si-123",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 805"
  },
  {
    "id": "si-124",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 808"
  },
  {
    "id": "si-125",
    "subGroupId": "sg-2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 809"
  },
  {
    "id": "si-126",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 200"
  },
  {
    "id": "si-127",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 209"
  },
  {
    "id": "si-128",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 216"
  },
  {
    "id": "si-129",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 217"
  },
  {
    "id": "si-130",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 756"
  },
  {
    "id": "si-131",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 768"
  },
  {
    "id": "si-132",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 769"
  },
  {
    "id": "si-133",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 770"
  },
  {
    "id": "si-134",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 773"
  },
  {
    "id": "si-135",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 773"
  },
  {
    "id": "si-136",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 773"
  },
  {
    "id": "si-137",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 774"
  },
  {
    "id": "si-138",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 774"
  },
  {
    "id": "si-139",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 774"
  },
  {
    "id": "si-140",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 775"
  },
  {
    "id": "si-141",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 775"
  },
  {
    "id": "si-142",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 775"
  },
  {
    "id": "si-143",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 776"
  },
  {
    "id": "si-144",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 776"
  },
  {
    "id": "si-145",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 776"
  },
  {
    "id": "si-146",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 777"
  },
  {
    "id": "si-147",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 777"
  },
  {
    "id": "si-148",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 777"
  },
  {
    "id": "si-149",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 778"
  },
  {
    "id": "si-150",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 778"
  },
  {
    "id": "si-151",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 778"
  },
  {
    "id": "si-152",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 779"
  },
  {
    "id": "si-153",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 779"
  },
  {
    "id": "si-154",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 779"
  },
  {
    "id": "si-155",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 780"
  },
  {
    "id": "si-156",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 781"
  },
  {
    "id": "si-157",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 781"
  },
  {
    "id": "si-158",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 781"
  },
  {
    "id": "si-159",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 782"
  },
  {
    "id": "si-160",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 782"
  },
  {
    "id": "si-161",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 782"
  },
  {
    "id": "si-162",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 783"
  },
  {
    "id": "si-163",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 783"
  },
  {
    "id": "si-164",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 783"
  },
  {
    "id": "si-165",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 785"
  },
  {
    "id": "si-166",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 785"
  },
  {
    "id": "si-167",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 786"
  },
  {
    "id": "si-168",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 787"
  },
  {
    "id": "si-169",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 800"
  },
  {
    "id": "si-170",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 801"
  },
  {
    "id": "si-171",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 802"
  },
  {
    "id": "si-172",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 802"
  },
  {
    "id": "si-173",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 803"
  },
  {
    "id": "si-174",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 803"
  },
  {
    "id": "si-175",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 804"
  },
  {
    "id": "si-176",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 804"
  },
  {
    "id": "si-177",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 805"
  },
  {
    "id": "si-178",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 805"
  },
  {
    "id": "si-179",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 808"
  },
  {
    "id": "si-180",
    "subGroupId": "sg-3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 809"
  },
  {
    "id": "si-181",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 200"
  },
  {
    "id": "si-182",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 209"
  },
  {
    "id": "si-183",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 216"
  },
  {
    "id": "si-184",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 217"
  },
  {
    "id": "si-185",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 756"
  },
  {
    "id": "si-186",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 768"
  },
  {
    "id": "si-187",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 769"
  },
  {
    "id": "si-188",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 770"
  },
  {
    "id": "si-189",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 773"
  },
  {
    "id": "si-190",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 773"
  },
  {
    "id": "si-191",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 773"
  },
  {
    "id": "si-192",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 774"
  },
  {
    "id": "si-193",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 774"
  },
  {
    "id": "si-194",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 774"
  },
  {
    "id": "si-195",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 775"
  },
  {
    "id": "si-196",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 775"
  },
  {
    "id": "si-197",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 775"
  },
  {
    "id": "si-198",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 776"
  },
  {
    "id": "si-199",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 776"
  },
  {
    "id": "si-200",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 776"
  },
  {
    "id": "si-201",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 777"
  },
  {
    "id": "si-202",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 777"
  },
  {
    "id": "si-203",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 777"
  },
  {
    "id": "si-204",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 778"
  },
  {
    "id": "si-205",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 778"
  },
  {
    "id": "si-206",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 778"
  },
  {
    "id": "si-207",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 779"
  },
  {
    "id": "si-208",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 779"
  },
  {
    "id": "si-209",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 779"
  },
  {
    "id": "si-210",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 780"
  },
  {
    "id": "si-211",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 781"
  },
  {
    "id": "si-212",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 781"
  },
  {
    "id": "si-213",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 781"
  },
  {
    "id": "si-214",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 782"
  },
  {
    "id": "si-215",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 782"
  },
  {
    "id": "si-216",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 782"
  },
  {
    "id": "si-217",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 783"
  },
  {
    "id": "si-218",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 783"
  },
  {
    "id": "si-219",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 783"
  },
  {
    "id": "si-220",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 785"
  },
  {
    "id": "si-221",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 785"
  },
  {
    "id": "si-222",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 785"
  },
  {
    "id": "si-223",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 786"
  },
  {
    "id": "si-224",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 787"
  },
  {
    "id": "si-225",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 787"
  },
  {
    "id": "si-226",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 787"
  },
  {
    "id": "si-227",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 800"
  },
  {
    "id": "si-228",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 801"
  },
  {
    "id": "si-229",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 802"
  },
  {
    "id": "si-230",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 802"
  },
  {
    "id": "si-231",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 803"
  },
  {
    "id": "si-232",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 803"
  },
  {
    "id": "si-233",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 804"
  },
  {
    "id": "si-234",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 804"
  },
  {
    "id": "si-235",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 805"
  },
  {
    "id": "si-236",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 808"
  },
  {
    "id": "si-237",
    "subGroupId": "sg-21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 809"
  },
  {
    "id": "si-238",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 200"
  },
  {
    "id": "si-239",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 209"
  },
  {
    "id": "si-240",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 216"
  },
  {
    "id": "si-241",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 217"
  },
  {
    "id": "si-242",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 756"
  },
  {
    "id": "si-243",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 768"
  },
  {
    "id": "si-244",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 769"
  },
  {
    "id": "si-245",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 770"
  },
  {
    "id": "si-246",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 773"
  },
  {
    "id": "si-247",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 773"
  },
  {
    "id": "si-248",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 773"
  },
  {
    "id": "si-249",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 774"
  },
  {
    "id": "si-250",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 774"
  },
  {
    "id": "si-251",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 774"
  },
  {
    "id": "si-252",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 775"
  },
  {
    "id": "si-253",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 775"
  },
  {
    "id": "si-254",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 775"
  },
  {
    "id": "si-255",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 776"
  },
  {
    "id": "si-256",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 776"
  },
  {
    "id": "si-257",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 776"
  },
  {
    "id": "si-258",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 777"
  },
  {
    "id": "si-259",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 777"
  },
  {
    "id": "si-260",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 777"
  },
  {
    "id": "si-261",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 778"
  },
  {
    "id": "si-262",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 778"
  },
  {
    "id": "si-263",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 778"
  },
  {
    "id": "si-264",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 779"
  },
  {
    "id": "si-265",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 779"
  },
  {
    "id": "si-266",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 779"
  },
  {
    "id": "si-267",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 780"
  },
  {
    "id": "si-268",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 781"
  },
  {
    "id": "si-269",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 781"
  },
  {
    "id": "si-270",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 781"
  },
  {
    "id": "si-271",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 782"
  },
  {
    "id": "si-272",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 782"
  },
  {
    "id": "si-273",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 782"
  },
  {
    "id": "si-274",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 783"
  },
  {
    "id": "si-275",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 783"
  },
  {
    "id": "si-276",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 783"
  },
  {
    "id": "si-277",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 785"
  },
  {
    "id": "si-278",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 785"
  },
  {
    "id": "si-279",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 785"
  },
  {
    "id": "si-280",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 786"
  },
  {
    "id": "si-281",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 787"
  },
  {
    "id": "si-282",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 787"
  },
  {
    "id": "si-283",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 787"
  },
  {
    "id": "si-284",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 800"
  },
  {
    "id": "si-285",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 801"
  },
  {
    "id": "si-286",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 802"
  },
  {
    "id": "si-287",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 802"
  },
  {
    "id": "si-288",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 803"
  },
  {
    "id": "si-289",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 803"
  },
  {
    "id": "si-290",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 804"
  },
  {
    "id": "si-291",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 804"
  },
  {
    "id": "si-292",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 805"
  },
  {
    "id": "si-293",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 805"
  },
  {
    "id": "si-294",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 808"
  },
  {
    "id": "si-295",
    "subGroupId": "sg-4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 809"
  },
  {
    "id": "si-296",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 200"
  },
  {
    "id": "si-297",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 209"
  },
  {
    "id": "si-298",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 216"
  },
  {
    "id": "si-299",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 217"
  },
  {
    "id": "si-300",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 756"
  },
  {
    "id": "si-301",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 768"
  },
  {
    "id": "si-302",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 769"
  },
  {
    "id": "si-303",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 770"
  },
  {
    "id": "si-304",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 773"
  },
  {
    "id": "si-305",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 773"
  },
  {
    "id": "si-306",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 773"
  },
  {
    "id": "si-307",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 774"
  },
  {
    "id": "si-308",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 774"
  },
  {
    "id": "si-309",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 774"
  },
  {
    "id": "si-310",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 775"
  },
  {
    "id": "si-311",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 775"
  },
  {
    "id": "si-312",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 775"
  },
  {
    "id": "si-313",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 776"
  },
  {
    "id": "si-314",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 776"
  },
  {
    "id": "si-315",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 776"
  },
  {
    "id": "si-316",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 777"
  },
  {
    "id": "si-317",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 777"
  },
  {
    "id": "si-318",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 777"
  },
  {
    "id": "si-319",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 778"
  },
  {
    "id": "si-320",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 778"
  },
  {
    "id": "si-321",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 778"
  },
  {
    "id": "si-322",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 779"
  },
  {
    "id": "si-323",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 779"
  },
  {
    "id": "si-324",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 779"
  },
  {
    "id": "si-325",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 780"
  },
  {
    "id": "si-326",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 781"
  },
  {
    "id": "si-327",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 781"
  },
  {
    "id": "si-328",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 781"
  },
  {
    "id": "si-329",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 782"
  },
  {
    "id": "si-330",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 782"
  },
  {
    "id": "si-331",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 782"
  },
  {
    "id": "si-332",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 783"
  },
  {
    "id": "si-333",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 783"
  },
  {
    "id": "si-334",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 783"
  },
  {
    "id": "si-335",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 785"
  },
  {
    "id": "si-336",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 785"
  },
  {
    "id": "si-337",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 785"
  },
  {
    "id": "si-338",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 786"
  },
  {
    "id": "si-339",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 787"
  },
  {
    "id": "si-340",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 787"
  },
  {
    "id": "si-341",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 787"
  },
  {
    "id": "si-342",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 800"
  },
  {
    "id": "si-343",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 801"
  },
  {
    "id": "si-344",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 802"
  },
  {
    "id": "si-345",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 802"
  },
  {
    "id": "si-346",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 803"
  },
  {
    "id": "si-347",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 803"
  },
  {
    "id": "si-348",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 804"
  },
  {
    "id": "si-349",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 804"
  },
  {
    "id": "si-350",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 805"
  },
  {
    "id": "si-351",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 805"
  },
  {
    "id": "si-352",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 808"
  },
  {
    "id": "si-353",
    "subGroupId": "sg-5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 809"
  },
  {
    "id": "si-354",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 200"
  },
  {
    "id": "si-355",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 209"
  },
  {
    "id": "si-356",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 216"
  },
  {
    "id": "si-357",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 217"
  },
  {
    "id": "si-358",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 756"
  },
  {
    "id": "si-359",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 768"
  },
  {
    "id": "si-360",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 769"
  },
  {
    "id": "si-361",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 770"
  },
  {
    "id": "si-362",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 773"
  },
  {
    "id": "si-363",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 773"
  },
  {
    "id": "si-364",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 773"
  },
  {
    "id": "si-365",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 774"
  },
  {
    "id": "si-366",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 774"
  },
  {
    "id": "si-367",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 774"
  },
  {
    "id": "si-368",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 775"
  },
  {
    "id": "si-369",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 775"
  },
  {
    "id": "si-370",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 775"
  },
  {
    "id": "si-371",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 776"
  },
  {
    "id": "si-372",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 776"
  },
  {
    "id": "si-373",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 776"
  },
  {
    "id": "si-374",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 777"
  },
  {
    "id": "si-375",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 777"
  },
  {
    "id": "si-376",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 777"
  },
  {
    "id": "si-377",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 778"
  },
  {
    "id": "si-378",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 778"
  },
  {
    "id": "si-379",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 778"
  },
  {
    "id": "si-380",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 779"
  },
  {
    "id": "si-381",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 779"
  },
  {
    "id": "si-382",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 779"
  },
  {
    "id": "si-383",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 780"
  },
  {
    "id": "si-384",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 781"
  },
  {
    "id": "si-385",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 781"
  },
  {
    "id": "si-386",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 781"
  },
  {
    "id": "si-387",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 782"
  },
  {
    "id": "si-388",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 782"
  },
  {
    "id": "si-389",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 782"
  },
  {
    "id": "si-390",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 783"
  },
  {
    "id": "si-391",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 783"
  },
  {
    "id": "si-392",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 783"
  },
  {
    "id": "si-393",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 785"
  },
  {
    "id": "si-394",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 785"
  },
  {
    "id": "si-395",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 785"
  },
  {
    "id": "si-396",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 786"
  },
  {
    "id": "si-397",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 787"
  },
  {
    "id": "si-398",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 787"
  },
  {
    "id": "si-399",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 787"
  },
  {
    "id": "si-400",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 800"
  },
  {
    "id": "si-401",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 801"
  },
  {
    "id": "si-402",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 802"
  },
  {
    "id": "si-403",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 802"
  },
  {
    "id": "si-404",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 803"
  },
  {
    "id": "si-405",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 803"
  },
  {
    "id": "si-406",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 804"
  },
  {
    "id": "si-407",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 804"
  },
  {
    "id": "si-408",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 805"
  },
  {
    "id": "si-409",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 805"
  },
  {
    "id": "si-410",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 808"
  },
  {
    "id": "si-411",
    "subGroupId": "sg-6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 809"
  },
  {
    "id": "si-412",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G 783"
  },
  {
    "id": "si-413",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G 783"
  },
  {
    "id": "si-414",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G.781"
  },
  {
    "id": "si-415",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G.781"
  },
  {
    "id": "si-416",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G.785"
  },
  {
    "id": "si-417",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G.785"
  },
  {
    "id": "si-418",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G782"
  },
  {
    "id": "si-419",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G782"
  },
  {
    "id": "si-420",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G802"
  },
  {
    "id": "si-421",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P CG803"
  },
  {
    "id": "si-422",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P CG804"
  },
  {
    "id": "si-423",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P CG805"
  },
  {
    "id": "si-424",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 200"
  },
  {
    "id": "si-425",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 209"
  },
  {
    "id": "si-426",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 216"
  },
  {
    "id": "si-427",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 217"
  },
  {
    "id": "si-428",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 756"
  },
  {
    "id": "si-429",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 768"
  },
  {
    "id": "si-430",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 769"
  },
  {
    "id": "si-431",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 770"
  },
  {
    "id": "si-432",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 773"
  },
  {
    "id": "si-433",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 773"
  },
  {
    "id": "si-434",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 773"
  },
  {
    "id": "si-435",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 774"
  },
  {
    "id": "si-436",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 774"
  },
  {
    "id": "si-437",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 774"
  },
  {
    "id": "si-438",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 775"
  },
  {
    "id": "si-439",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 775"
  },
  {
    "id": "si-440",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 775"
  },
  {
    "id": "si-441",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 776"
  },
  {
    "id": "si-442",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 776"
  },
  {
    "id": "si-443",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 776"
  },
  {
    "id": "si-444",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 777"
  },
  {
    "id": "si-445",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 777"
  },
  {
    "id": "si-446",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 777"
  },
  {
    "id": "si-447",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 778"
  },
  {
    "id": "si-448",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 778"
  },
  {
    "id": "si-449",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 778"
  },
  {
    "id": "si-450",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 779"
  },
  {
    "id": "si-451",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 779"
  },
  {
    "id": "si-452",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 779"
  },
  {
    "id": "si-453",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 780"
  },
  {
    "id": "si-454",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 781"
  },
  {
    "id": "si-455",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 782"
  },
  {
    "id": "si-456",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 783"
  },
  {
    "id": "si-457",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 784"
  },
  {
    "id": "si-458",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 785"
  },
  {
    "id": "si-459",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 786"
  },
  {
    "id": "si-460",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 800"
  },
  {
    "id": "si-461",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 801"
  },
  {
    "id": "si-462",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 802"
  },
  {
    "id": "si-463",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 803"
  },
  {
    "id": "si-464",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 804"
  },
  {
    "id": "si-465",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 805"
  },
  {
    "id": "si-466",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 808"
  },
  {
    "id": "si-467",
    "subGroupId": "sg-7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 809"
  },
  {
    "id": "si-468",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 200"
  },
  {
    "id": "si-469",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 209"
  },
  {
    "id": "si-470",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 216"
  },
  {
    "id": "si-471",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 217"
  },
  {
    "id": "si-472",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 756"
  },
  {
    "id": "si-473",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 768"
  },
  {
    "id": "si-474",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 769"
  },
  {
    "id": "si-475",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 770"
  },
  {
    "id": "si-476",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 773"
  },
  {
    "id": "si-477",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 773"
  },
  {
    "id": "si-478",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 773"
  },
  {
    "id": "si-479",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 774"
  },
  {
    "id": "si-480",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 774"
  },
  {
    "id": "si-481",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 774"
  },
  {
    "id": "si-482",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 775"
  },
  {
    "id": "si-483",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 775"
  },
  {
    "id": "si-484",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 775"
  },
  {
    "id": "si-485",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 776"
  },
  {
    "id": "si-486",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 776"
  },
  {
    "id": "si-487",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 776"
  },
  {
    "id": "si-488",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 777"
  },
  {
    "id": "si-489",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 777"
  },
  {
    "id": "si-490",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 777"
  },
  {
    "id": "si-491",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 778"
  },
  {
    "id": "si-492",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 778"
  },
  {
    "id": "si-493",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 778"
  },
  {
    "id": "si-494",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 779"
  },
  {
    "id": "si-495",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 779"
  },
  {
    "id": "si-496",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 779"
  },
  {
    "id": "si-497",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 780"
  },
  {
    "id": "si-498",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 781"
  },
  {
    "id": "si-499",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 781"
  },
  {
    "id": "si-500",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 781"
  },
  {
    "id": "si-501",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 782"
  },
  {
    "id": "si-502",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 782"
  },
  {
    "id": "si-503",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 782"
  },
  {
    "id": "si-504",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 783"
  },
  {
    "id": "si-505",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 783"
  },
  {
    "id": "si-506",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 783"
  },
  {
    "id": "si-507",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 785"
  },
  {
    "id": "si-508",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 785"
  },
  {
    "id": "si-509",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 785"
  },
  {
    "id": "si-510",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 786"
  },
  {
    "id": "si-511",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 787"
  },
  {
    "id": "si-512",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 787"
  },
  {
    "id": "si-513",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 787"
  },
  {
    "id": "si-514",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 800"
  },
  {
    "id": "si-515",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 801"
  },
  {
    "id": "si-516",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 802"
  },
  {
    "id": "si-517",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 802"
  },
  {
    "id": "si-518",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 803"
  },
  {
    "id": "si-519",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 803"
  },
  {
    "id": "si-520",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 804"
  },
  {
    "id": "si-521",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 804"
  },
  {
    "id": "si-522",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 805"
  },
  {
    "id": "si-523",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 808"
  },
  {
    "id": "si-524",
    "subGroupId": "sg-8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 809"
  },
  {
    "id": "si-525",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 200"
  },
  {
    "id": "si-526",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 209"
  },
  {
    "id": "si-527",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 216"
  },
  {
    "id": "si-528",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 217"
  },
  {
    "id": "si-529",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 756"
  },
  {
    "id": "si-530",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 768"
  },
  {
    "id": "si-531",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 769"
  },
  {
    "id": "si-532",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 770"
  },
  {
    "id": "si-533",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 773"
  },
  {
    "id": "si-534",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 773"
  },
  {
    "id": "si-535",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 773"
  },
  {
    "id": "si-536",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 774"
  },
  {
    "id": "si-537",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 774"
  },
  {
    "id": "si-538",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 774"
  },
  {
    "id": "si-539",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 775"
  },
  {
    "id": "si-540",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 775"
  },
  {
    "id": "si-541",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 775"
  },
  {
    "id": "si-542",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 776"
  },
  {
    "id": "si-543",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 776"
  },
  {
    "id": "si-544",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 776"
  },
  {
    "id": "si-545",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 777"
  },
  {
    "id": "si-546",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 777"
  },
  {
    "id": "si-547",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 777"
  },
  {
    "id": "si-548",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 778"
  },
  {
    "id": "si-549",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 778"
  },
  {
    "id": "si-550",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 778"
  },
  {
    "id": "si-551",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 779"
  },
  {
    "id": "si-552",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 779"
  },
  {
    "id": "si-553",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 779"
  },
  {
    "id": "si-554",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 780"
  },
  {
    "id": "si-555",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 781"
  },
  {
    "id": "si-556",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 781"
  },
  {
    "id": "si-557",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 781"
  },
  {
    "id": "si-558",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 782"
  },
  {
    "id": "si-559",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 782"
  },
  {
    "id": "si-560",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 782"
  },
  {
    "id": "si-561",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 783"
  },
  {
    "id": "si-562",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 783"
  },
  {
    "id": "si-563",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 783"
  },
  {
    "id": "si-564",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 785"
  },
  {
    "id": "si-565",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 785"
  },
  {
    "id": "si-566",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 785"
  },
  {
    "id": "si-567",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 786"
  },
  {
    "id": "si-568",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 787"
  },
  {
    "id": "si-569",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 787"
  },
  {
    "id": "si-570",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 787"
  },
  {
    "id": "si-571",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 800"
  },
  {
    "id": "si-572",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 801"
  },
  {
    "id": "si-573",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 802"
  },
  {
    "id": "si-574",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 802"
  },
  {
    "id": "si-575",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 803"
  },
  {
    "id": "si-576",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 803"
  },
  {
    "id": "si-577",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 804"
  },
  {
    "id": "si-578",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 804"
  },
  {
    "id": "si-579",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 805"
  },
  {
    "id": "si-580",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 805"
  },
  {
    "id": "si-581",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 808"
  },
  {
    "id": "si-582",
    "subGroupId": "sg-9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 809"
  },
  {
    "id": "si-583",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 200"
  },
  {
    "id": "si-584",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 209"
  },
  {
    "id": "si-585",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 216"
  },
  {
    "id": "si-586",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 217"
  },
  {
    "id": "si-587",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 756"
  },
  {
    "id": "si-588",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 768"
  },
  {
    "id": "si-589",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 769"
  },
  {
    "id": "si-590",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 770"
  },
  {
    "id": "si-591",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 773"
  },
  {
    "id": "si-592",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 773"
  },
  {
    "id": "si-593",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 773"
  },
  {
    "id": "si-594",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 774"
  },
  {
    "id": "si-595",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 774"
  },
  {
    "id": "si-596",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 774"
  },
  {
    "id": "si-597",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 775"
  },
  {
    "id": "si-598",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 775"
  },
  {
    "id": "si-599",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 775"
  },
  {
    "id": "si-600",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 776"
  },
  {
    "id": "si-601",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 776"
  },
  {
    "id": "si-602",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 776"
  },
  {
    "id": "si-603",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 777"
  },
  {
    "id": "si-604",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 777"
  },
  {
    "id": "si-605",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 777"
  },
  {
    "id": "si-606",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 778"
  },
  {
    "id": "si-607",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 778"
  },
  {
    "id": "si-608",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 778"
  },
  {
    "id": "si-609",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 779"
  },
  {
    "id": "si-610",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 779"
  },
  {
    "id": "si-611",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 779"
  },
  {
    "id": "si-612",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 780"
  },
  {
    "id": "si-613",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 781"
  },
  {
    "id": "si-614",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 781"
  },
  {
    "id": "si-615",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 781"
  },
  {
    "id": "si-616",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 782"
  },
  {
    "id": "si-617",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 782"
  },
  {
    "id": "si-618",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 782"
  },
  {
    "id": "si-619",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 783"
  },
  {
    "id": "si-620",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 783"
  },
  {
    "id": "si-621",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 783"
  },
  {
    "id": "si-622",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 785"
  },
  {
    "id": "si-623",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 785"
  },
  {
    "id": "si-624",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 785"
  },
  {
    "id": "si-625",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 786"
  },
  {
    "id": "si-626",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 787"
  },
  {
    "id": "si-627",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 787"
  },
  {
    "id": "si-628",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 787"
  },
  {
    "id": "si-629",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 800"
  },
  {
    "id": "si-630",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 801"
  },
  {
    "id": "si-631",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 802"
  },
  {
    "id": "si-632",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 802"
  },
  {
    "id": "si-633",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 803"
  },
  {
    "id": "si-634",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 803"
  },
  {
    "id": "si-635",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 804"
  },
  {
    "id": "si-636",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 804"
  },
  {
    "id": "si-637",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 805"
  },
  {
    "id": "si-638",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 805"
  },
  {
    "id": "si-639",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 808"
  },
  {
    "id": "si-640",
    "subGroupId": "sg-19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 809"
  },
  {
    "id": "si-641",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 200"
  },
  {
    "id": "si-642",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 209"
  },
  {
    "id": "si-643",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 216"
  },
  {
    "id": "si-644",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 217"
  },
  {
    "id": "si-645",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 756"
  },
  {
    "id": "si-646",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 768"
  },
  {
    "id": "si-647",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 769"
  },
  {
    "id": "si-648",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 770"
  },
  {
    "id": "si-649",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 773"
  },
  {
    "id": "si-650",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 773"
  },
  {
    "id": "si-651",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 773"
  },
  {
    "id": "si-652",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 774"
  },
  {
    "id": "si-653",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 774"
  },
  {
    "id": "si-654",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 774"
  },
  {
    "id": "si-655",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 775"
  },
  {
    "id": "si-656",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 775"
  },
  {
    "id": "si-657",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 775"
  },
  {
    "id": "si-658",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 776"
  },
  {
    "id": "si-659",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 776"
  },
  {
    "id": "si-660",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 776"
  },
  {
    "id": "si-661",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 777"
  },
  {
    "id": "si-662",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 777"
  },
  {
    "id": "si-663",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 777"
  },
  {
    "id": "si-664",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 778"
  },
  {
    "id": "si-665",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 778"
  },
  {
    "id": "si-666",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 778"
  },
  {
    "id": "si-667",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 779"
  },
  {
    "id": "si-668",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 779"
  },
  {
    "id": "si-669",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 779"
  },
  {
    "id": "si-670",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 780"
  },
  {
    "id": "si-671",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 781"
  },
  {
    "id": "si-672",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 781"
  },
  {
    "id": "si-673",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 781"
  },
  {
    "id": "si-674",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 782"
  },
  {
    "id": "si-675",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 782"
  },
  {
    "id": "si-676",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 782"
  },
  {
    "id": "si-677",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 783"
  },
  {
    "id": "si-678",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 783"
  },
  {
    "id": "si-679",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 783"
  },
  {
    "id": "si-680",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 785"
  },
  {
    "id": "si-681",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 785"
  },
  {
    "id": "si-682",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 785"
  },
  {
    "id": "si-683",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 786"
  },
  {
    "id": "si-684",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 787"
  },
  {
    "id": "si-685",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 787"
  },
  {
    "id": "si-686",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 787"
  },
  {
    "id": "si-687",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 800"
  },
  {
    "id": "si-688",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 801"
  },
  {
    "id": "si-689",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 802"
  },
  {
    "id": "si-690",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 802"
  },
  {
    "id": "si-691",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 803"
  },
  {
    "id": "si-692",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 803"
  },
  {
    "id": "si-693",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 804"
  },
  {
    "id": "si-694",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 804"
  },
  {
    "id": "si-695",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 805"
  },
  {
    "id": "si-696",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 805"
  },
  {
    "id": "si-697",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 808"
  },
  {
    "id": "si-698",
    "subGroupId": "sg-20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 809"
  }
];
