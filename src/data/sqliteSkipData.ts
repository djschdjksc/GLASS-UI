// =====================================================================
// SQLITE_SKIP_MAIN_GROUPS — from BillApp_Backup.json (Desktop)
// =====================================================================
export interface SkipMainGroupSeed { id: string; name: string; }
export const SQLITE_SKIP_MAIN_GROUPS: SkipMainGroupSeed[] = [
  {
    "id": "mg-sqlite-1",
    "name": "General"
  },
  {
    "id": "mg-sqlite-2",
    "name": "Digital or Golden"
  },
  {
    "id": "mg-sqlite-3",
    "name": "Digital"
  },
  {
    "id": "mg-sqlite-4",
    "name": "Digital or Golden Lower Film"
  },
  {
    "id": "mg-sqlite-5",
    "name": "7D UV SHEET"
  }
];

// =====================================================================
// SQLITE_SKIP_SUB_GROUPS — from BillApp_Backup.json (Desktop)
// =====================================================================
export interface SkipSubGroupSeed { id: string; mainGroupId: string; groupName: string; sumColumn: 'QTY' | 'U CAP' | 'L CAP'; }
export const SQLITE_SKIP_SUB_GROUPS: SkipSubGroupSeed[] = [
  {
    "id": "sg-sqlite-1",
    "mainGroupId": "mg-sqlite-2",
    "groupName": "B.F.P-(A)-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-2",
    "mainGroupId": "mg-sqlite-3",
    "groupName": "B.F.P-(A)-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-3",
    "mainGroupId": "mg-sqlite-3",
    "groupName": "B.F.P-(B)-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-4",
    "mainGroupId": "mg-sqlite-3",
    "groupName": "B.F.P-(G)-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-5",
    "mainGroupId": "mg-sqlite-3",
    "groupName": "C.M-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-6",
    "mainGroupId": "mg-sqlite-3",
    "groupName": "F.P-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-7",
    "mainGroupId": "mg-sqlite-3",
    "groupName": "F.P.C.G-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-8",
    "mainGroupId": "mg-sqlite-3",
    "groupName": "F.P.G-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-9",
    "mainGroupId": "mg-sqlite-3",
    "groupName": "S.L-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-10",
    "mainGroupId": "mg-sqlite-2",
    "groupName": "B.F.P-(B)-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-11",
    "mainGroupId": "mg-sqlite-2",
    "groupName": "B.F.P-(G)-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-12",
    "mainGroupId": "mg-sqlite-2",
    "groupName": "C.M-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-13",
    "mainGroupId": "mg-sqlite-2",
    "groupName": "F.P-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-14",
    "mainGroupId": "mg-sqlite-2",
    "groupName": "F.P.C.G-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-15",
    "mainGroupId": "mg-sqlite-2",
    "groupName": "F.P.G-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-16",
    "mainGroupId": "mg-sqlite-2",
    "groupName": "S.L-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-17",
    "mainGroupId": "mg-sqlite-2",
    "groupName": "S.P-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-18",
    "mainGroupId": "mg-sqlite-2",
    "groupName": "T.G-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-19",
    "mainGroupId": "mg-sqlite-3",
    "groupName": "S.P-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-20",
    "mainGroupId": "mg-sqlite-3",
    "groupName": "T.G-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-21",
    "mainGroupId": "mg-sqlite-3",
    "groupName": "B.F.P-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-22",
    "mainGroupId": "mg-sqlite-2",
    "groupName": "B.F.P-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-23",
    "mainGroupId": "mg-sqlite-4",
    "groupName": "B.F.P-(A)-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-24",
    "mainGroupId": "mg-sqlite-4",
    "groupName": "B.F.P-(B)-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-25",
    "mainGroupId": "mg-sqlite-4",
    "groupName": "B.F.P-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-26",
    "mainGroupId": "mg-sqlite-4",
    "groupName": "B.F.P-(G)-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-27",
    "mainGroupId": "mg-sqlite-4",
    "groupName": "C.M-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-28",
    "mainGroupId": "mg-sqlite-4",
    "groupName": "F.P-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-29",
    "mainGroupId": "mg-sqlite-4",
    "groupName": "F.P.C.G-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-30",
    "mainGroupId": "mg-sqlite-4",
    "groupName": "F.P.G-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-31",
    "mainGroupId": "mg-sqlite-4",
    "groupName": "S.L-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-32",
    "mainGroupId": "mg-sqlite-4",
    "groupName": "S.P-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-33",
    "mainGroupId": "mg-sqlite-4",
    "groupName": "T.G-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg-sqlite-34",
    "mainGroupId": "mg-sqlite-5",
    "groupName": "7D UV",
    "sumColumn": "QTY"
  }
];

// =====================================================================
// SQLITE_SKIP_ITEMS — from BillApp_Backup.json (Desktop) (Total: 698 items)
// =====================================================================
export interface SkipItemSeed { id: string; subGroupId: string; itemPrefix: string; }
export const SQLITE_SKIP_ITEMS: SkipItemSeed[] = [
  {
    "id": "si-sqlite-1",
    "subGroupId": "sg-sqlite-1",
    "itemPrefix": "B.F.P-(A) 770"
  },
  {
    "id": "si-sqlite-2",
    "subGroupId": "sg-sqlite-11",
    "itemPrefix": "B.F.P-(G) 770"
  },
  {
    "id": "si-sqlite-3",
    "subGroupId": "sg-sqlite-10",
    "itemPrefix": "B.F.P-(B) 770"
  },
  {
    "id": "si-sqlite-4",
    "subGroupId": "sg-sqlite-13",
    "itemPrefix": "F.P 770"
  },
  {
    "id": "si-sqlite-5",
    "subGroupId": "sg-sqlite-15",
    "itemPrefix": "F.P.G 770"
  },
  {
    "id": "si-sqlite-6",
    "subGroupId": "sg-sqlite-16",
    "itemPrefix": "S.L 770"
  },
  {
    "id": "si-sqlite-7",
    "subGroupId": "sg-sqlite-17",
    "itemPrefix": "S.P 770"
  },
  {
    "id": "si-sqlite-8",
    "subGroupId": "sg-sqlite-18",
    "itemPrefix": "T.G 770"
  },
  {
    "id": "si-sqlite-9",
    "subGroupId": "sg-sqlite-14",
    "itemPrefix": "F.P.C.G 770"
  },
  {
    "id": "si-sqlite-10",
    "subGroupId": "sg-sqlite-12",
    "itemPrefix": "C.M 770"
  },
  {
    "id": "si-sqlite-11",
    "subGroupId": "sg-sqlite-22",
    "itemPrefix": "B.F.P 770"
  },
  {
    "id": "si-sqlite-12",
    "subGroupId": "sg-sqlite-23",
    "itemPrefix": "B.F.P-(A) 780"
  },
  {
    "id": "si-sqlite-13",
    "subGroupId": "sg-sqlite-24",
    "itemPrefix": "B.F.P-(B) 780"
  },
  {
    "id": "si-sqlite-14",
    "subGroupId": "sg-sqlite-25",
    "itemPrefix": "B.F.P 780"
  },
  {
    "id": "si-sqlite-15",
    "subGroupId": "sg-sqlite-26",
    "itemPrefix": "B.F.P-(G) 780"
  },
  {
    "id": "si-sqlite-16",
    "subGroupId": "sg-sqlite-27",
    "itemPrefix": "C.M 780"
  },
  {
    "id": "si-sqlite-17",
    "subGroupId": "sg-sqlite-28",
    "itemPrefix": "F.P 780"
  },
  {
    "id": "si-sqlite-18",
    "subGroupId": "sg-sqlite-29",
    "itemPrefix": "F.P.C.G 780"
  },
  {
    "id": "si-sqlite-19",
    "subGroupId": "sg-sqlite-30",
    "itemPrefix": "F.P.G 780"
  },
  {
    "id": "si-sqlite-20",
    "subGroupId": "sg-sqlite-31",
    "itemPrefix": "S.L 780"
  },
  {
    "id": "si-sqlite-21",
    "subGroupId": "sg-sqlite-32",
    "itemPrefix": "S.P 780"
  },
  {
    "id": "si-sqlite-22",
    "subGroupId": "sg-sqlite-33",
    "itemPrefix": "T.G 780"
  },
  {
    "id": "si-sqlite-23",
    "subGroupId": "sg-sqlite-1",
    "itemPrefix": "B.F.P-(A) 770"
  },
  {
    "id": "si-sqlite-24",
    "subGroupId": "sg-sqlite-11",
    "itemPrefix": "B.F.P-(G) 770"
  },
  {
    "id": "si-sqlite-25",
    "subGroupId": "sg-sqlite-10",
    "itemPrefix": "B.F.P-(B) 770"
  },
  {
    "id": "si-sqlite-26",
    "subGroupId": "sg-sqlite-13",
    "itemPrefix": "F.P 770"
  },
  {
    "id": "si-sqlite-27",
    "subGroupId": "sg-sqlite-15",
    "itemPrefix": "F.P.G 770"
  },
  {
    "id": "si-sqlite-28",
    "subGroupId": "sg-sqlite-16",
    "itemPrefix": "S.L 770"
  },
  {
    "id": "si-sqlite-29",
    "subGroupId": "sg-sqlite-17",
    "itemPrefix": "S.P 770"
  },
  {
    "id": "si-sqlite-30",
    "subGroupId": "sg-sqlite-18",
    "itemPrefix": "T.G 770"
  },
  {
    "id": "si-sqlite-31",
    "subGroupId": "sg-sqlite-14",
    "itemPrefix": "F.P.C.G 770"
  },
  {
    "id": "si-sqlite-32",
    "subGroupId": "sg-sqlite-12",
    "itemPrefix": "C.M 770"
  },
  {
    "id": "si-sqlite-33",
    "subGroupId": "sg-sqlite-22",
    "itemPrefix": "B.F.P 770"
  },
  {
    "id": "si-sqlite-34",
    "subGroupId": "sg-sqlite-23",
    "itemPrefix": "B.F.P-(A) 780"
  },
  {
    "id": "si-sqlite-35",
    "subGroupId": "sg-sqlite-24",
    "itemPrefix": "B.F.P-(B) 780"
  },
  {
    "id": "si-sqlite-36",
    "subGroupId": "sg-sqlite-25",
    "itemPrefix": "B.F.P 780"
  },
  {
    "id": "si-sqlite-37",
    "subGroupId": "sg-sqlite-26",
    "itemPrefix": "B.F.P-(G) 780"
  },
  {
    "id": "si-sqlite-38",
    "subGroupId": "sg-sqlite-27",
    "itemPrefix": "C.M 780"
  },
  {
    "id": "si-sqlite-39",
    "subGroupId": "sg-sqlite-28",
    "itemPrefix": "F.P 780"
  },
  {
    "id": "si-sqlite-40",
    "subGroupId": "sg-sqlite-29",
    "itemPrefix": "F.P.C.G 780"
  },
  {
    "id": "si-sqlite-41",
    "subGroupId": "sg-sqlite-30",
    "itemPrefix": "F.P.G 780"
  },
  {
    "id": "si-sqlite-42",
    "subGroupId": "sg-sqlite-31",
    "itemPrefix": "S.L 780"
  },
  {
    "id": "si-sqlite-43",
    "subGroupId": "sg-sqlite-32",
    "itemPrefix": "S.P 780"
  },
  {
    "id": "si-sqlite-44",
    "subGroupId": "sg-sqlite-33",
    "itemPrefix": "T.G 780"
  },
  {
    "id": "si-sqlite-45",
    "subGroupId": "sg-sqlite-1",
    "itemPrefix": "B.F.P-(A) 770"
  },
  {
    "id": "si-sqlite-46",
    "subGroupId": "sg-sqlite-11",
    "itemPrefix": "B.F.P-(G) 770"
  },
  {
    "id": "si-sqlite-47",
    "subGroupId": "sg-sqlite-10",
    "itemPrefix": "B.F.P-(B) 770"
  },
  {
    "id": "si-sqlite-48",
    "subGroupId": "sg-sqlite-13",
    "itemPrefix": "F.P 770"
  },
  {
    "id": "si-sqlite-49",
    "subGroupId": "sg-sqlite-15",
    "itemPrefix": "F.P.G 770"
  },
  {
    "id": "si-sqlite-50",
    "subGroupId": "sg-sqlite-16",
    "itemPrefix": "S.L 770"
  },
  {
    "id": "si-sqlite-51",
    "subGroupId": "sg-sqlite-17",
    "itemPrefix": "S.P 770"
  },
  {
    "id": "si-sqlite-52",
    "subGroupId": "sg-sqlite-18",
    "itemPrefix": "T.G 770"
  },
  {
    "id": "si-sqlite-53",
    "subGroupId": "sg-sqlite-14",
    "itemPrefix": "F.P.C.G 770"
  },
  {
    "id": "si-sqlite-54",
    "subGroupId": "sg-sqlite-12",
    "itemPrefix": "C.M 770"
  },
  {
    "id": "si-sqlite-55",
    "subGroupId": "sg-sqlite-22",
    "itemPrefix": "B.F.P 770"
  },
  {
    "id": "si-sqlite-56",
    "subGroupId": "sg-sqlite-23",
    "itemPrefix": "B.F.P-(A) 780"
  },
  {
    "id": "si-sqlite-57",
    "subGroupId": "sg-sqlite-24",
    "itemPrefix": "B.F.P-(B) 780"
  },
  {
    "id": "si-sqlite-58",
    "subGroupId": "sg-sqlite-25",
    "itemPrefix": "B.F.P 780"
  },
  {
    "id": "si-sqlite-59",
    "subGroupId": "sg-sqlite-26",
    "itemPrefix": "B.F.P-(G) 780"
  },
  {
    "id": "si-sqlite-60",
    "subGroupId": "sg-sqlite-27",
    "itemPrefix": "C.M 780"
  },
  {
    "id": "si-sqlite-61",
    "subGroupId": "sg-sqlite-28",
    "itemPrefix": "F.P 780"
  },
  {
    "id": "si-sqlite-62",
    "subGroupId": "sg-sqlite-29",
    "itemPrefix": "F.P.C.G 780"
  },
  {
    "id": "si-sqlite-63",
    "subGroupId": "sg-sqlite-30",
    "itemPrefix": "F.P.G 780"
  },
  {
    "id": "si-sqlite-64",
    "subGroupId": "sg-sqlite-31",
    "itemPrefix": "S.L 780"
  },
  {
    "id": "si-sqlite-65",
    "subGroupId": "sg-sqlite-32",
    "itemPrefix": "S.P 780"
  },
  {
    "id": "si-sqlite-66",
    "subGroupId": "sg-sqlite-33",
    "itemPrefix": "T.G 780"
  },
  {
    "id": "si-sqlite-67",
    "subGroupId": "sg-sqlite-34",
    "itemPrefix": "UVD 2044"
  },
  {
    "id": "si-sqlite-68",
    "subGroupId": "sg-sqlite-34",
    "itemPrefix": "UVD 2043"
  },
  {
    "id": "si-sqlite-69",
    "subGroupId": "sg-sqlite-34",
    "itemPrefix": "UVD 2042"
  },
  {
    "id": "si-sqlite-70",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 200"
  },
  {
    "id": "si-sqlite-71",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 209"
  },
  {
    "id": "si-sqlite-72",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 216"
  },
  {
    "id": "si-sqlite-73",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 217"
  },
  {
    "id": "si-sqlite-74",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 756"
  },
  {
    "id": "si-sqlite-75",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 768"
  },
  {
    "id": "si-sqlite-76",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 769"
  },
  {
    "id": "si-sqlite-77",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 770"
  },
  {
    "id": "si-sqlite-78",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 773"
  },
  {
    "id": "si-sqlite-79",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 773"
  },
  {
    "id": "si-sqlite-80",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 773"
  },
  {
    "id": "si-sqlite-81",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 774"
  },
  {
    "id": "si-sqlite-82",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 774"
  },
  {
    "id": "si-sqlite-83",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 774"
  },
  {
    "id": "si-sqlite-84",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 775"
  },
  {
    "id": "si-sqlite-85",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 775"
  },
  {
    "id": "si-sqlite-86",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 775"
  },
  {
    "id": "si-sqlite-87",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 776"
  },
  {
    "id": "si-sqlite-88",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 776"
  },
  {
    "id": "si-sqlite-89",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 776"
  },
  {
    "id": "si-sqlite-90",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 777"
  },
  {
    "id": "si-sqlite-91",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 777"
  },
  {
    "id": "si-sqlite-92",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 777"
  },
  {
    "id": "si-sqlite-93",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 778"
  },
  {
    "id": "si-sqlite-94",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 778"
  },
  {
    "id": "si-sqlite-95",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 778"
  },
  {
    "id": "si-sqlite-96",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 779"
  },
  {
    "id": "si-sqlite-97",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 779"
  },
  {
    "id": "si-sqlite-98",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 779"
  },
  {
    "id": "si-sqlite-99",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 780"
  },
  {
    "id": "si-sqlite-100",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 781"
  },
  {
    "id": "si-sqlite-101",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 781"
  },
  {
    "id": "si-sqlite-102",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 781"
  },
  {
    "id": "si-sqlite-103",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 782"
  },
  {
    "id": "si-sqlite-104",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 782"
  },
  {
    "id": "si-sqlite-105",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 782"
  },
  {
    "id": "si-sqlite-106",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 783"
  },
  {
    "id": "si-sqlite-107",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 783"
  },
  {
    "id": "si-sqlite-108",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 783"
  },
  {
    "id": "si-sqlite-109",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 785"
  },
  {
    "id": "si-sqlite-110",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 785"
  },
  {
    "id": "si-sqlite-111",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 785"
  },
  {
    "id": "si-sqlite-112",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 786"
  },
  {
    "id": "si-sqlite-113",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 787"
  },
  {
    "id": "si-sqlite-114",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 800"
  },
  {
    "id": "si-sqlite-115",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 801"
  },
  {
    "id": "si-sqlite-116",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 802"
  },
  {
    "id": "si-sqlite-117",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 802"
  },
  {
    "id": "si-sqlite-118",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 803"
  },
  {
    "id": "si-sqlite-119",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 803"
  },
  {
    "id": "si-sqlite-120",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 804"
  },
  {
    "id": "si-sqlite-121",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 804"
  },
  {
    "id": "si-sqlite-122",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 805"
  },
  {
    "id": "si-sqlite-123",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 805"
  },
  {
    "id": "si-sqlite-124",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 808"
  },
  {
    "id": "si-sqlite-125",
    "subGroupId": "sg-sqlite-2",
    "itemPrefix": "B.F.P-(A) 809"
  },
  {
    "id": "si-sqlite-126",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 200"
  },
  {
    "id": "si-sqlite-127",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 209"
  },
  {
    "id": "si-sqlite-128",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 216"
  },
  {
    "id": "si-sqlite-129",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 217"
  },
  {
    "id": "si-sqlite-130",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 756"
  },
  {
    "id": "si-sqlite-131",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 768"
  },
  {
    "id": "si-sqlite-132",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 769"
  },
  {
    "id": "si-sqlite-133",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 770"
  },
  {
    "id": "si-sqlite-134",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 773"
  },
  {
    "id": "si-sqlite-135",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 773"
  },
  {
    "id": "si-sqlite-136",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 773"
  },
  {
    "id": "si-sqlite-137",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 774"
  },
  {
    "id": "si-sqlite-138",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 774"
  },
  {
    "id": "si-sqlite-139",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 774"
  },
  {
    "id": "si-sqlite-140",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 775"
  },
  {
    "id": "si-sqlite-141",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 775"
  },
  {
    "id": "si-sqlite-142",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 775"
  },
  {
    "id": "si-sqlite-143",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 776"
  },
  {
    "id": "si-sqlite-144",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 776"
  },
  {
    "id": "si-sqlite-145",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 776"
  },
  {
    "id": "si-sqlite-146",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 777"
  },
  {
    "id": "si-sqlite-147",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 777"
  },
  {
    "id": "si-sqlite-148",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 777"
  },
  {
    "id": "si-sqlite-149",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 778"
  },
  {
    "id": "si-sqlite-150",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 778"
  },
  {
    "id": "si-sqlite-151",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 778"
  },
  {
    "id": "si-sqlite-152",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 779"
  },
  {
    "id": "si-sqlite-153",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 779"
  },
  {
    "id": "si-sqlite-154",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 779"
  },
  {
    "id": "si-sqlite-155",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 780"
  },
  {
    "id": "si-sqlite-156",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 781"
  },
  {
    "id": "si-sqlite-157",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 781"
  },
  {
    "id": "si-sqlite-158",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 781"
  },
  {
    "id": "si-sqlite-159",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 782"
  },
  {
    "id": "si-sqlite-160",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 782"
  },
  {
    "id": "si-sqlite-161",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 782"
  },
  {
    "id": "si-sqlite-162",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 783"
  },
  {
    "id": "si-sqlite-163",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 783"
  },
  {
    "id": "si-sqlite-164",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 783"
  },
  {
    "id": "si-sqlite-165",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 785"
  },
  {
    "id": "si-sqlite-166",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 785"
  },
  {
    "id": "si-sqlite-167",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 786"
  },
  {
    "id": "si-sqlite-168",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 787"
  },
  {
    "id": "si-sqlite-169",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 800"
  },
  {
    "id": "si-sqlite-170",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 801"
  },
  {
    "id": "si-sqlite-171",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 802"
  },
  {
    "id": "si-sqlite-172",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 802"
  },
  {
    "id": "si-sqlite-173",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 803"
  },
  {
    "id": "si-sqlite-174",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 803"
  },
  {
    "id": "si-sqlite-175",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 804"
  },
  {
    "id": "si-sqlite-176",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 804"
  },
  {
    "id": "si-sqlite-177",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 805"
  },
  {
    "id": "si-sqlite-178",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 805"
  },
  {
    "id": "si-sqlite-179",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 808"
  },
  {
    "id": "si-sqlite-180",
    "subGroupId": "sg-sqlite-3",
    "itemPrefix": "B.F.P-(B) 809"
  },
  {
    "id": "si-sqlite-181",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 200"
  },
  {
    "id": "si-sqlite-182",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 209"
  },
  {
    "id": "si-sqlite-183",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 216"
  },
  {
    "id": "si-sqlite-184",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 217"
  },
  {
    "id": "si-sqlite-185",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 756"
  },
  {
    "id": "si-sqlite-186",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 768"
  },
  {
    "id": "si-sqlite-187",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 769"
  },
  {
    "id": "si-sqlite-188",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 770"
  },
  {
    "id": "si-sqlite-189",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 773"
  },
  {
    "id": "si-sqlite-190",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 773"
  },
  {
    "id": "si-sqlite-191",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 773"
  },
  {
    "id": "si-sqlite-192",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 774"
  },
  {
    "id": "si-sqlite-193",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 774"
  },
  {
    "id": "si-sqlite-194",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 774"
  },
  {
    "id": "si-sqlite-195",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 775"
  },
  {
    "id": "si-sqlite-196",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 775"
  },
  {
    "id": "si-sqlite-197",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 775"
  },
  {
    "id": "si-sqlite-198",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 776"
  },
  {
    "id": "si-sqlite-199",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 776"
  },
  {
    "id": "si-sqlite-200",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 776"
  },
  {
    "id": "si-sqlite-201",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 777"
  },
  {
    "id": "si-sqlite-202",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 777"
  },
  {
    "id": "si-sqlite-203",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 777"
  },
  {
    "id": "si-sqlite-204",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 778"
  },
  {
    "id": "si-sqlite-205",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 778"
  },
  {
    "id": "si-sqlite-206",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 778"
  },
  {
    "id": "si-sqlite-207",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 779"
  },
  {
    "id": "si-sqlite-208",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 779"
  },
  {
    "id": "si-sqlite-209",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 779"
  },
  {
    "id": "si-sqlite-210",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 780"
  },
  {
    "id": "si-sqlite-211",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 781"
  },
  {
    "id": "si-sqlite-212",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 781"
  },
  {
    "id": "si-sqlite-213",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 781"
  },
  {
    "id": "si-sqlite-214",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 782"
  },
  {
    "id": "si-sqlite-215",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 782"
  },
  {
    "id": "si-sqlite-216",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 782"
  },
  {
    "id": "si-sqlite-217",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 783"
  },
  {
    "id": "si-sqlite-218",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 783"
  },
  {
    "id": "si-sqlite-219",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 783"
  },
  {
    "id": "si-sqlite-220",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 785"
  },
  {
    "id": "si-sqlite-221",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 785"
  },
  {
    "id": "si-sqlite-222",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 785"
  },
  {
    "id": "si-sqlite-223",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 786"
  },
  {
    "id": "si-sqlite-224",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 787"
  },
  {
    "id": "si-sqlite-225",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 787"
  },
  {
    "id": "si-sqlite-226",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 787"
  },
  {
    "id": "si-sqlite-227",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 800"
  },
  {
    "id": "si-sqlite-228",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 801"
  },
  {
    "id": "si-sqlite-229",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 802"
  },
  {
    "id": "si-sqlite-230",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 802"
  },
  {
    "id": "si-sqlite-231",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 803"
  },
  {
    "id": "si-sqlite-232",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 803"
  },
  {
    "id": "si-sqlite-233",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 804"
  },
  {
    "id": "si-sqlite-234",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 804"
  },
  {
    "id": "si-sqlite-235",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 805"
  },
  {
    "id": "si-sqlite-236",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 808"
  },
  {
    "id": "si-sqlite-237",
    "subGroupId": "sg-sqlite-21",
    "itemPrefix": "B.F.P 809"
  },
  {
    "id": "si-sqlite-238",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 200"
  },
  {
    "id": "si-sqlite-239",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 209"
  },
  {
    "id": "si-sqlite-240",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 216"
  },
  {
    "id": "si-sqlite-241",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 217"
  },
  {
    "id": "si-sqlite-242",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 756"
  },
  {
    "id": "si-sqlite-243",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 768"
  },
  {
    "id": "si-sqlite-244",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 769"
  },
  {
    "id": "si-sqlite-245",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 770"
  },
  {
    "id": "si-sqlite-246",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 773"
  },
  {
    "id": "si-sqlite-247",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 773"
  },
  {
    "id": "si-sqlite-248",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 773"
  },
  {
    "id": "si-sqlite-249",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 774"
  },
  {
    "id": "si-sqlite-250",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 774"
  },
  {
    "id": "si-sqlite-251",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 774"
  },
  {
    "id": "si-sqlite-252",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 775"
  },
  {
    "id": "si-sqlite-253",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 775"
  },
  {
    "id": "si-sqlite-254",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 775"
  },
  {
    "id": "si-sqlite-255",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 776"
  },
  {
    "id": "si-sqlite-256",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 776"
  },
  {
    "id": "si-sqlite-257",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 776"
  },
  {
    "id": "si-sqlite-258",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 777"
  },
  {
    "id": "si-sqlite-259",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 777"
  },
  {
    "id": "si-sqlite-260",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 777"
  },
  {
    "id": "si-sqlite-261",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 778"
  },
  {
    "id": "si-sqlite-262",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 778"
  },
  {
    "id": "si-sqlite-263",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 778"
  },
  {
    "id": "si-sqlite-264",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 779"
  },
  {
    "id": "si-sqlite-265",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 779"
  },
  {
    "id": "si-sqlite-266",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 779"
  },
  {
    "id": "si-sqlite-267",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 780"
  },
  {
    "id": "si-sqlite-268",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 781"
  },
  {
    "id": "si-sqlite-269",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 781"
  },
  {
    "id": "si-sqlite-270",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 781"
  },
  {
    "id": "si-sqlite-271",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 782"
  },
  {
    "id": "si-sqlite-272",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 782"
  },
  {
    "id": "si-sqlite-273",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 782"
  },
  {
    "id": "si-sqlite-274",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 783"
  },
  {
    "id": "si-sqlite-275",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 783"
  },
  {
    "id": "si-sqlite-276",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 783"
  },
  {
    "id": "si-sqlite-277",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 785"
  },
  {
    "id": "si-sqlite-278",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 785"
  },
  {
    "id": "si-sqlite-279",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 785"
  },
  {
    "id": "si-sqlite-280",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 786"
  },
  {
    "id": "si-sqlite-281",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 787"
  },
  {
    "id": "si-sqlite-282",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 787"
  },
  {
    "id": "si-sqlite-283",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 787"
  },
  {
    "id": "si-sqlite-284",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 800"
  },
  {
    "id": "si-sqlite-285",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 801"
  },
  {
    "id": "si-sqlite-286",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 802"
  },
  {
    "id": "si-sqlite-287",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 802"
  },
  {
    "id": "si-sqlite-288",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 803"
  },
  {
    "id": "si-sqlite-289",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 803"
  },
  {
    "id": "si-sqlite-290",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 804"
  },
  {
    "id": "si-sqlite-291",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 804"
  },
  {
    "id": "si-sqlite-292",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 805"
  },
  {
    "id": "si-sqlite-293",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 805"
  },
  {
    "id": "si-sqlite-294",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 808"
  },
  {
    "id": "si-sqlite-295",
    "subGroupId": "sg-sqlite-4",
    "itemPrefix": "B.F.P-(G) 809"
  },
  {
    "id": "si-sqlite-296",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 200"
  },
  {
    "id": "si-sqlite-297",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 209"
  },
  {
    "id": "si-sqlite-298",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 216"
  },
  {
    "id": "si-sqlite-299",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 217"
  },
  {
    "id": "si-sqlite-300",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 756"
  },
  {
    "id": "si-sqlite-301",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 768"
  },
  {
    "id": "si-sqlite-302",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 769"
  },
  {
    "id": "si-sqlite-303",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 770"
  },
  {
    "id": "si-sqlite-304",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 773"
  },
  {
    "id": "si-sqlite-305",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 773"
  },
  {
    "id": "si-sqlite-306",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 773"
  },
  {
    "id": "si-sqlite-307",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 774"
  },
  {
    "id": "si-sqlite-308",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 774"
  },
  {
    "id": "si-sqlite-309",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 774"
  },
  {
    "id": "si-sqlite-310",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 775"
  },
  {
    "id": "si-sqlite-311",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 775"
  },
  {
    "id": "si-sqlite-312",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 775"
  },
  {
    "id": "si-sqlite-313",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 776"
  },
  {
    "id": "si-sqlite-314",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 776"
  },
  {
    "id": "si-sqlite-315",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 776"
  },
  {
    "id": "si-sqlite-316",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 777"
  },
  {
    "id": "si-sqlite-317",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 777"
  },
  {
    "id": "si-sqlite-318",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 777"
  },
  {
    "id": "si-sqlite-319",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 778"
  },
  {
    "id": "si-sqlite-320",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 778"
  },
  {
    "id": "si-sqlite-321",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 778"
  },
  {
    "id": "si-sqlite-322",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 779"
  },
  {
    "id": "si-sqlite-323",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 779"
  },
  {
    "id": "si-sqlite-324",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 779"
  },
  {
    "id": "si-sqlite-325",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 780"
  },
  {
    "id": "si-sqlite-326",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 781"
  },
  {
    "id": "si-sqlite-327",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 781"
  },
  {
    "id": "si-sqlite-328",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 781"
  },
  {
    "id": "si-sqlite-329",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 782"
  },
  {
    "id": "si-sqlite-330",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 782"
  },
  {
    "id": "si-sqlite-331",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 782"
  },
  {
    "id": "si-sqlite-332",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 783"
  },
  {
    "id": "si-sqlite-333",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 783"
  },
  {
    "id": "si-sqlite-334",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 783"
  },
  {
    "id": "si-sqlite-335",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 785"
  },
  {
    "id": "si-sqlite-336",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 785"
  },
  {
    "id": "si-sqlite-337",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 785"
  },
  {
    "id": "si-sqlite-338",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 786"
  },
  {
    "id": "si-sqlite-339",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 787"
  },
  {
    "id": "si-sqlite-340",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 787"
  },
  {
    "id": "si-sqlite-341",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 787"
  },
  {
    "id": "si-sqlite-342",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 800"
  },
  {
    "id": "si-sqlite-343",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 801"
  },
  {
    "id": "si-sqlite-344",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 802"
  },
  {
    "id": "si-sqlite-345",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 802"
  },
  {
    "id": "si-sqlite-346",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 803"
  },
  {
    "id": "si-sqlite-347",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 803"
  },
  {
    "id": "si-sqlite-348",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 804"
  },
  {
    "id": "si-sqlite-349",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 804"
  },
  {
    "id": "si-sqlite-350",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 805"
  },
  {
    "id": "si-sqlite-351",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 805"
  },
  {
    "id": "si-sqlite-352",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 808"
  },
  {
    "id": "si-sqlite-353",
    "subGroupId": "sg-sqlite-5",
    "itemPrefix": "C.M 809"
  },
  {
    "id": "si-sqlite-354",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 200"
  },
  {
    "id": "si-sqlite-355",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 209"
  },
  {
    "id": "si-sqlite-356",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 216"
  },
  {
    "id": "si-sqlite-357",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 217"
  },
  {
    "id": "si-sqlite-358",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 756"
  },
  {
    "id": "si-sqlite-359",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 768"
  },
  {
    "id": "si-sqlite-360",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 769"
  },
  {
    "id": "si-sqlite-361",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 770"
  },
  {
    "id": "si-sqlite-362",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 773"
  },
  {
    "id": "si-sqlite-363",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 773"
  },
  {
    "id": "si-sqlite-364",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 773"
  },
  {
    "id": "si-sqlite-365",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 774"
  },
  {
    "id": "si-sqlite-366",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 774"
  },
  {
    "id": "si-sqlite-367",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 774"
  },
  {
    "id": "si-sqlite-368",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 775"
  },
  {
    "id": "si-sqlite-369",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 775"
  },
  {
    "id": "si-sqlite-370",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 775"
  },
  {
    "id": "si-sqlite-371",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 776"
  },
  {
    "id": "si-sqlite-372",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 776"
  },
  {
    "id": "si-sqlite-373",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 776"
  },
  {
    "id": "si-sqlite-374",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 777"
  },
  {
    "id": "si-sqlite-375",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 777"
  },
  {
    "id": "si-sqlite-376",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 777"
  },
  {
    "id": "si-sqlite-377",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 778"
  },
  {
    "id": "si-sqlite-378",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 778"
  },
  {
    "id": "si-sqlite-379",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 778"
  },
  {
    "id": "si-sqlite-380",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 779"
  },
  {
    "id": "si-sqlite-381",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 779"
  },
  {
    "id": "si-sqlite-382",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 779"
  },
  {
    "id": "si-sqlite-383",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 780"
  },
  {
    "id": "si-sqlite-384",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 781"
  },
  {
    "id": "si-sqlite-385",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 781"
  },
  {
    "id": "si-sqlite-386",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 781"
  },
  {
    "id": "si-sqlite-387",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 782"
  },
  {
    "id": "si-sqlite-388",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 782"
  },
  {
    "id": "si-sqlite-389",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 782"
  },
  {
    "id": "si-sqlite-390",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 783"
  },
  {
    "id": "si-sqlite-391",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 783"
  },
  {
    "id": "si-sqlite-392",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 783"
  },
  {
    "id": "si-sqlite-393",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 785"
  },
  {
    "id": "si-sqlite-394",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 785"
  },
  {
    "id": "si-sqlite-395",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 785"
  },
  {
    "id": "si-sqlite-396",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 786"
  },
  {
    "id": "si-sqlite-397",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 787"
  },
  {
    "id": "si-sqlite-398",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 787"
  },
  {
    "id": "si-sqlite-399",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 787"
  },
  {
    "id": "si-sqlite-400",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 800"
  },
  {
    "id": "si-sqlite-401",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 801"
  },
  {
    "id": "si-sqlite-402",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 802"
  },
  {
    "id": "si-sqlite-403",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 802"
  },
  {
    "id": "si-sqlite-404",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 803"
  },
  {
    "id": "si-sqlite-405",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 803"
  },
  {
    "id": "si-sqlite-406",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 804"
  },
  {
    "id": "si-sqlite-407",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 804"
  },
  {
    "id": "si-sqlite-408",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 805"
  },
  {
    "id": "si-sqlite-409",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 805"
  },
  {
    "id": "si-sqlite-410",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 808"
  },
  {
    "id": "si-sqlite-411",
    "subGroupId": "sg-sqlite-6",
    "itemPrefix": "F.P 809"
  },
  {
    "id": "si-sqlite-412",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P C.G 783"
  },
  {
    "id": "si-sqlite-413",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P C.G 783"
  },
  {
    "id": "si-sqlite-414",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P C.G.781"
  },
  {
    "id": "si-sqlite-415",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P C.G.781"
  },
  {
    "id": "si-sqlite-416",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P C.G.785"
  },
  {
    "id": "si-sqlite-417",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P C.G.785"
  },
  {
    "id": "si-sqlite-418",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P C.G782"
  },
  {
    "id": "si-sqlite-419",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P C.G782"
  },
  {
    "id": "si-sqlite-420",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P C.G802"
  },
  {
    "id": "si-sqlite-421",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P CG803"
  },
  {
    "id": "si-sqlite-422",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P CG804"
  },
  {
    "id": "si-sqlite-423",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P CG805"
  },
  {
    "id": "si-sqlite-424",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 200"
  },
  {
    "id": "si-sqlite-425",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 209"
  },
  {
    "id": "si-sqlite-426",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 216"
  },
  {
    "id": "si-sqlite-427",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 217"
  },
  {
    "id": "si-sqlite-428",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 756"
  },
  {
    "id": "si-sqlite-429",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 768"
  },
  {
    "id": "si-sqlite-430",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 769"
  },
  {
    "id": "si-sqlite-431",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 770"
  },
  {
    "id": "si-sqlite-432",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 773"
  },
  {
    "id": "si-sqlite-433",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 773"
  },
  {
    "id": "si-sqlite-434",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 773"
  },
  {
    "id": "si-sqlite-435",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 774"
  },
  {
    "id": "si-sqlite-436",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 774"
  },
  {
    "id": "si-sqlite-437",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 774"
  },
  {
    "id": "si-sqlite-438",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 775"
  },
  {
    "id": "si-sqlite-439",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 775"
  },
  {
    "id": "si-sqlite-440",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 775"
  },
  {
    "id": "si-sqlite-441",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 776"
  },
  {
    "id": "si-sqlite-442",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 776"
  },
  {
    "id": "si-sqlite-443",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 776"
  },
  {
    "id": "si-sqlite-444",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 777"
  },
  {
    "id": "si-sqlite-445",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 777"
  },
  {
    "id": "si-sqlite-446",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 777"
  },
  {
    "id": "si-sqlite-447",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 778"
  },
  {
    "id": "si-sqlite-448",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 778"
  },
  {
    "id": "si-sqlite-449",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 778"
  },
  {
    "id": "si-sqlite-450",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 779"
  },
  {
    "id": "si-sqlite-451",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 779"
  },
  {
    "id": "si-sqlite-452",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 779"
  },
  {
    "id": "si-sqlite-453",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 780"
  },
  {
    "id": "si-sqlite-454",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 781"
  },
  {
    "id": "si-sqlite-455",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 782"
  },
  {
    "id": "si-sqlite-456",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 783"
  },
  {
    "id": "si-sqlite-457",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 784"
  },
  {
    "id": "si-sqlite-458",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 785"
  },
  {
    "id": "si-sqlite-459",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 786"
  },
  {
    "id": "si-sqlite-460",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 800"
  },
  {
    "id": "si-sqlite-461",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 801"
  },
  {
    "id": "si-sqlite-462",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 802"
  },
  {
    "id": "si-sqlite-463",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 803"
  },
  {
    "id": "si-sqlite-464",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 804"
  },
  {
    "id": "si-sqlite-465",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 805"
  },
  {
    "id": "si-sqlite-466",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 808"
  },
  {
    "id": "si-sqlite-467",
    "subGroupId": "sg-sqlite-7",
    "itemPrefix": "F.P.C.G 809"
  },
  {
    "id": "si-sqlite-468",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 200"
  },
  {
    "id": "si-sqlite-469",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 209"
  },
  {
    "id": "si-sqlite-470",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 216"
  },
  {
    "id": "si-sqlite-471",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 217"
  },
  {
    "id": "si-sqlite-472",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 756"
  },
  {
    "id": "si-sqlite-473",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 768"
  },
  {
    "id": "si-sqlite-474",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 769"
  },
  {
    "id": "si-sqlite-475",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 770"
  },
  {
    "id": "si-sqlite-476",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 773"
  },
  {
    "id": "si-sqlite-477",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 773"
  },
  {
    "id": "si-sqlite-478",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 773"
  },
  {
    "id": "si-sqlite-479",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 774"
  },
  {
    "id": "si-sqlite-480",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 774"
  },
  {
    "id": "si-sqlite-481",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 774"
  },
  {
    "id": "si-sqlite-482",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 775"
  },
  {
    "id": "si-sqlite-483",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 775"
  },
  {
    "id": "si-sqlite-484",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 775"
  },
  {
    "id": "si-sqlite-485",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 776"
  },
  {
    "id": "si-sqlite-486",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 776"
  },
  {
    "id": "si-sqlite-487",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 776"
  },
  {
    "id": "si-sqlite-488",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 777"
  },
  {
    "id": "si-sqlite-489",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 777"
  },
  {
    "id": "si-sqlite-490",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 777"
  },
  {
    "id": "si-sqlite-491",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 778"
  },
  {
    "id": "si-sqlite-492",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 778"
  },
  {
    "id": "si-sqlite-493",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 778"
  },
  {
    "id": "si-sqlite-494",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 779"
  },
  {
    "id": "si-sqlite-495",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 779"
  },
  {
    "id": "si-sqlite-496",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 779"
  },
  {
    "id": "si-sqlite-497",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 780"
  },
  {
    "id": "si-sqlite-498",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 781"
  },
  {
    "id": "si-sqlite-499",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 781"
  },
  {
    "id": "si-sqlite-500",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 781"
  },
  {
    "id": "si-sqlite-501",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 782"
  },
  {
    "id": "si-sqlite-502",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 782"
  },
  {
    "id": "si-sqlite-503",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 782"
  },
  {
    "id": "si-sqlite-504",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 783"
  },
  {
    "id": "si-sqlite-505",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 783"
  },
  {
    "id": "si-sqlite-506",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 783"
  },
  {
    "id": "si-sqlite-507",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 785"
  },
  {
    "id": "si-sqlite-508",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 785"
  },
  {
    "id": "si-sqlite-509",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 785"
  },
  {
    "id": "si-sqlite-510",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 786"
  },
  {
    "id": "si-sqlite-511",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 787"
  },
  {
    "id": "si-sqlite-512",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 787"
  },
  {
    "id": "si-sqlite-513",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 787"
  },
  {
    "id": "si-sqlite-514",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 800"
  },
  {
    "id": "si-sqlite-515",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 801"
  },
  {
    "id": "si-sqlite-516",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 802"
  },
  {
    "id": "si-sqlite-517",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 802"
  },
  {
    "id": "si-sqlite-518",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 803"
  },
  {
    "id": "si-sqlite-519",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 803"
  },
  {
    "id": "si-sqlite-520",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 804"
  },
  {
    "id": "si-sqlite-521",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 804"
  },
  {
    "id": "si-sqlite-522",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 805"
  },
  {
    "id": "si-sqlite-523",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 808"
  },
  {
    "id": "si-sqlite-524",
    "subGroupId": "sg-sqlite-8",
    "itemPrefix": "F.P.G 809"
  },
  {
    "id": "si-sqlite-525",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 200"
  },
  {
    "id": "si-sqlite-526",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 209"
  },
  {
    "id": "si-sqlite-527",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 216"
  },
  {
    "id": "si-sqlite-528",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 217"
  },
  {
    "id": "si-sqlite-529",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 756"
  },
  {
    "id": "si-sqlite-530",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 768"
  },
  {
    "id": "si-sqlite-531",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 769"
  },
  {
    "id": "si-sqlite-532",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 770"
  },
  {
    "id": "si-sqlite-533",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 773"
  },
  {
    "id": "si-sqlite-534",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 773"
  },
  {
    "id": "si-sqlite-535",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 773"
  },
  {
    "id": "si-sqlite-536",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 774"
  },
  {
    "id": "si-sqlite-537",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 774"
  },
  {
    "id": "si-sqlite-538",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 774"
  },
  {
    "id": "si-sqlite-539",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 775"
  },
  {
    "id": "si-sqlite-540",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 775"
  },
  {
    "id": "si-sqlite-541",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 775"
  },
  {
    "id": "si-sqlite-542",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 776"
  },
  {
    "id": "si-sqlite-543",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 776"
  },
  {
    "id": "si-sqlite-544",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 776"
  },
  {
    "id": "si-sqlite-545",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 777"
  },
  {
    "id": "si-sqlite-546",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 777"
  },
  {
    "id": "si-sqlite-547",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 777"
  },
  {
    "id": "si-sqlite-548",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 778"
  },
  {
    "id": "si-sqlite-549",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 778"
  },
  {
    "id": "si-sqlite-550",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 778"
  },
  {
    "id": "si-sqlite-551",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 779"
  },
  {
    "id": "si-sqlite-552",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 779"
  },
  {
    "id": "si-sqlite-553",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 779"
  },
  {
    "id": "si-sqlite-554",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 780"
  },
  {
    "id": "si-sqlite-555",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 781"
  },
  {
    "id": "si-sqlite-556",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 781"
  },
  {
    "id": "si-sqlite-557",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 781"
  },
  {
    "id": "si-sqlite-558",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 782"
  },
  {
    "id": "si-sqlite-559",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 782"
  },
  {
    "id": "si-sqlite-560",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 782"
  },
  {
    "id": "si-sqlite-561",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 783"
  },
  {
    "id": "si-sqlite-562",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 783"
  },
  {
    "id": "si-sqlite-563",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 783"
  },
  {
    "id": "si-sqlite-564",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 785"
  },
  {
    "id": "si-sqlite-565",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 785"
  },
  {
    "id": "si-sqlite-566",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 785"
  },
  {
    "id": "si-sqlite-567",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 786"
  },
  {
    "id": "si-sqlite-568",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 787"
  },
  {
    "id": "si-sqlite-569",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 787"
  },
  {
    "id": "si-sqlite-570",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 787"
  },
  {
    "id": "si-sqlite-571",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 800"
  },
  {
    "id": "si-sqlite-572",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 801"
  },
  {
    "id": "si-sqlite-573",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 802"
  },
  {
    "id": "si-sqlite-574",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 802"
  },
  {
    "id": "si-sqlite-575",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 803"
  },
  {
    "id": "si-sqlite-576",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 803"
  },
  {
    "id": "si-sqlite-577",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 804"
  },
  {
    "id": "si-sqlite-578",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 804"
  },
  {
    "id": "si-sqlite-579",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 805"
  },
  {
    "id": "si-sqlite-580",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 805"
  },
  {
    "id": "si-sqlite-581",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 808"
  },
  {
    "id": "si-sqlite-582",
    "subGroupId": "sg-sqlite-9",
    "itemPrefix": "S.L 809"
  },
  {
    "id": "si-sqlite-583",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 200"
  },
  {
    "id": "si-sqlite-584",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 209"
  },
  {
    "id": "si-sqlite-585",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 216"
  },
  {
    "id": "si-sqlite-586",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 217"
  },
  {
    "id": "si-sqlite-587",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 756"
  },
  {
    "id": "si-sqlite-588",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 768"
  },
  {
    "id": "si-sqlite-589",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 769"
  },
  {
    "id": "si-sqlite-590",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 770"
  },
  {
    "id": "si-sqlite-591",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 773"
  },
  {
    "id": "si-sqlite-592",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 773"
  },
  {
    "id": "si-sqlite-593",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 773"
  },
  {
    "id": "si-sqlite-594",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 774"
  },
  {
    "id": "si-sqlite-595",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 774"
  },
  {
    "id": "si-sqlite-596",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 774"
  },
  {
    "id": "si-sqlite-597",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 775"
  },
  {
    "id": "si-sqlite-598",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 775"
  },
  {
    "id": "si-sqlite-599",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 775"
  },
  {
    "id": "si-sqlite-600",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 776"
  },
  {
    "id": "si-sqlite-601",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 776"
  },
  {
    "id": "si-sqlite-602",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 776"
  },
  {
    "id": "si-sqlite-603",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 777"
  },
  {
    "id": "si-sqlite-604",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 777"
  },
  {
    "id": "si-sqlite-605",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 777"
  },
  {
    "id": "si-sqlite-606",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 778"
  },
  {
    "id": "si-sqlite-607",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 778"
  },
  {
    "id": "si-sqlite-608",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 778"
  },
  {
    "id": "si-sqlite-609",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 779"
  },
  {
    "id": "si-sqlite-610",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 779"
  },
  {
    "id": "si-sqlite-611",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 779"
  },
  {
    "id": "si-sqlite-612",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 780"
  },
  {
    "id": "si-sqlite-613",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 781"
  },
  {
    "id": "si-sqlite-614",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 781"
  },
  {
    "id": "si-sqlite-615",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 781"
  },
  {
    "id": "si-sqlite-616",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 782"
  },
  {
    "id": "si-sqlite-617",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 782"
  },
  {
    "id": "si-sqlite-618",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 782"
  },
  {
    "id": "si-sqlite-619",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 783"
  },
  {
    "id": "si-sqlite-620",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 783"
  },
  {
    "id": "si-sqlite-621",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 783"
  },
  {
    "id": "si-sqlite-622",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 785"
  },
  {
    "id": "si-sqlite-623",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 785"
  },
  {
    "id": "si-sqlite-624",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 785"
  },
  {
    "id": "si-sqlite-625",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 786"
  },
  {
    "id": "si-sqlite-626",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 787"
  },
  {
    "id": "si-sqlite-627",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 787"
  },
  {
    "id": "si-sqlite-628",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 787"
  },
  {
    "id": "si-sqlite-629",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 800"
  },
  {
    "id": "si-sqlite-630",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 801"
  },
  {
    "id": "si-sqlite-631",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 802"
  },
  {
    "id": "si-sqlite-632",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 802"
  },
  {
    "id": "si-sqlite-633",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 803"
  },
  {
    "id": "si-sqlite-634",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 803"
  },
  {
    "id": "si-sqlite-635",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 804"
  },
  {
    "id": "si-sqlite-636",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 804"
  },
  {
    "id": "si-sqlite-637",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 805"
  },
  {
    "id": "si-sqlite-638",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 805"
  },
  {
    "id": "si-sqlite-639",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 808"
  },
  {
    "id": "si-sqlite-640",
    "subGroupId": "sg-sqlite-19",
    "itemPrefix": "S.P 809"
  },
  {
    "id": "si-sqlite-641",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 200"
  },
  {
    "id": "si-sqlite-642",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 209"
  },
  {
    "id": "si-sqlite-643",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 216"
  },
  {
    "id": "si-sqlite-644",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 217"
  },
  {
    "id": "si-sqlite-645",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 756"
  },
  {
    "id": "si-sqlite-646",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 768"
  },
  {
    "id": "si-sqlite-647",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 769"
  },
  {
    "id": "si-sqlite-648",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 770"
  },
  {
    "id": "si-sqlite-649",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 773"
  },
  {
    "id": "si-sqlite-650",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 773"
  },
  {
    "id": "si-sqlite-651",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 773"
  },
  {
    "id": "si-sqlite-652",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 774"
  },
  {
    "id": "si-sqlite-653",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 774"
  },
  {
    "id": "si-sqlite-654",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 774"
  },
  {
    "id": "si-sqlite-655",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 775"
  },
  {
    "id": "si-sqlite-656",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 775"
  },
  {
    "id": "si-sqlite-657",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 775"
  },
  {
    "id": "si-sqlite-658",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 776"
  },
  {
    "id": "si-sqlite-659",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 776"
  },
  {
    "id": "si-sqlite-660",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 776"
  },
  {
    "id": "si-sqlite-661",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 777"
  },
  {
    "id": "si-sqlite-662",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 777"
  },
  {
    "id": "si-sqlite-663",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 777"
  },
  {
    "id": "si-sqlite-664",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 778"
  },
  {
    "id": "si-sqlite-665",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 778"
  },
  {
    "id": "si-sqlite-666",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 778"
  },
  {
    "id": "si-sqlite-667",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 779"
  },
  {
    "id": "si-sqlite-668",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 779"
  },
  {
    "id": "si-sqlite-669",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 779"
  },
  {
    "id": "si-sqlite-670",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 780"
  },
  {
    "id": "si-sqlite-671",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 781"
  },
  {
    "id": "si-sqlite-672",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 781"
  },
  {
    "id": "si-sqlite-673",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 781"
  },
  {
    "id": "si-sqlite-674",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 782"
  },
  {
    "id": "si-sqlite-675",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 782"
  },
  {
    "id": "si-sqlite-676",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 782"
  },
  {
    "id": "si-sqlite-677",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 783"
  },
  {
    "id": "si-sqlite-678",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 783"
  },
  {
    "id": "si-sqlite-679",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 783"
  },
  {
    "id": "si-sqlite-680",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 785"
  },
  {
    "id": "si-sqlite-681",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 785"
  },
  {
    "id": "si-sqlite-682",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 785"
  },
  {
    "id": "si-sqlite-683",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 786"
  },
  {
    "id": "si-sqlite-684",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 787"
  },
  {
    "id": "si-sqlite-685",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 787"
  },
  {
    "id": "si-sqlite-686",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 787"
  },
  {
    "id": "si-sqlite-687",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 800"
  },
  {
    "id": "si-sqlite-688",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 801"
  },
  {
    "id": "si-sqlite-689",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 802"
  },
  {
    "id": "si-sqlite-690",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 802"
  },
  {
    "id": "si-sqlite-691",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 803"
  },
  {
    "id": "si-sqlite-692",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 803"
  },
  {
    "id": "si-sqlite-693",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 804"
  },
  {
    "id": "si-sqlite-694",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 804"
  },
  {
    "id": "si-sqlite-695",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 805"
  },
  {
    "id": "si-sqlite-696",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 805"
  },
  {
    "id": "si-sqlite-697",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 808"
  },
  {
    "id": "si-sqlite-698",
    "subGroupId": "sg-sqlite-20",
    "itemPrefix": "T.G 809"
  }
];
