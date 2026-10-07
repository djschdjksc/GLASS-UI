// =====================================================================
// SQLITE_SKIP_DATA — Clean & Deduplicated directly from BillTrack (bill_data.db)
// 5 Main Groups, 35 Sub Groups, 363 Skip Items
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
    "id": "mg_1",
    "name": "General"
  },
  {
    "id": "mg_2",
    "name": "Digital or Golden"
  },
  {
    "id": "mg_3",
    "name": "Digital"
  },
  {
    "id": "mg_4",
    "name": "Digital or Golden Lower Film"
  },
  {
    "id": "mg_5",
    "name": "7D UV SHEET"
  }
];

export const SQLITE_SKIP_SUB_GROUPS: SkipSubGroupSeed[] = [
  {
    "id": "sg-1791281454388",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "UVD",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_1",
    "mainGroupId": "mg_2",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(A)-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_2",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_3",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_4",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_5",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_6",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_7",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_8",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_9",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_10",
    "mainGroupId": "mg_2",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(B)-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_11",
    "mainGroupId": "mg_2",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(G)-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_12",
    "mainGroupId": "mg_2",
    "mainGroup": "Digital or Golden",
    "groupName": "C.M-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_13",
    "mainGroupId": "mg_2",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_14",
    "mainGroupId": "mg_2",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.C.G-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_15",
    "mainGroupId": "mg_2",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.G-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_16",
    "mainGroupId": "mg_2",
    "mainGroup": "Digital or Golden",
    "groupName": "S.L-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_17",
    "mainGroupId": "mg_2",
    "mainGroup": "Digital or Golden",
    "groupName": "S.P-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_18",
    "mainGroupId": "mg_2",
    "mainGroup": "Digital or Golden",
    "groupName": "T.G-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_19",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_20",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_21",
    "mainGroupId": "mg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_22",
    "mainGroupId": "mg_2",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(Digital-or-Golden)",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_23",
    "mainGroupId": "mg_4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(A)-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_24",
    "mainGroupId": "mg_4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(B)-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_25",
    "mainGroupId": "mg_4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_26",
    "mainGroupId": "mg_4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(G)-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_27",
    "mainGroupId": "mg_4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "C.M-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_28",
    "mainGroupId": "mg_4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_29",
    "mainGroupId": "mg_4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.C.G-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_30",
    "mainGroupId": "mg_4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.G-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_31",
    "mainGroupId": "mg_4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.L-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_32",
    "mainGroupId": "mg_4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.P-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_33",
    "mainGroupId": "mg_4",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "T.G-(Digital)-Lower-Film",
    "sumColumn": "QTY"
  },
  {
    "id": "sg_34",
    "mainGroupId": "mg_5",
    "mainGroup": "7D UV SHEET",
    "groupName": "7D UV",
    "sumColumn": "QTY"
  }
];

export const SQLITE_SKIP_ITEMS: SkipItemSeed[] = [
  {
    "id": "si_1",
    "subGroupId": "sg_1",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(A)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(A) 770"
  },
  {
    "id": "si_2",
    "subGroupId": "sg_11",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(G)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(G) 770"
  },
  {
    "id": "si_3",
    "subGroupId": "sg_10",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(B)-(Digital-or-Golden)",
    "itemPrefix": "B.F.P-(B) 770"
  },
  {
    "id": "si_4",
    "subGroupId": "sg_13",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P-(Digital-or-Golden)",
    "itemPrefix": "F.P 770"
  },
  {
    "id": "si_5",
    "subGroupId": "sg_15",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.G-(Digital-or-Golden)",
    "itemPrefix": "F.P.G 770"
  },
  {
    "id": "si_6",
    "subGroupId": "sg_16",
    "mainGroup": "Digital or Golden",
    "groupName": "S.L-(Digital-or-Golden)",
    "itemPrefix": "S.L 770"
  },
  {
    "id": "si_7",
    "subGroupId": "sg_17",
    "mainGroup": "Digital or Golden",
    "groupName": "S.P-(Digital-or-Golden)",
    "itemPrefix": "S.P 770"
  },
  {
    "id": "si_8",
    "subGroupId": "sg_18",
    "mainGroup": "Digital or Golden",
    "groupName": "T.G-(Digital-or-Golden)",
    "itemPrefix": "T.G 770"
  },
  {
    "id": "si_9",
    "subGroupId": "sg_14",
    "mainGroup": "Digital or Golden",
    "groupName": "F.P.C.G-(Digital-or-Golden)",
    "itemPrefix": "F.P.C.G 770"
  },
  {
    "id": "si_10",
    "subGroupId": "sg_12",
    "mainGroup": "Digital or Golden",
    "groupName": "C.M-(Digital-or-Golden)",
    "itemPrefix": "C.M 770"
  },
  {
    "id": "si_11",
    "subGroupId": "sg_22",
    "mainGroup": "Digital or Golden",
    "groupName": "B.F.P-(Digital-or-Golden)",
    "itemPrefix": "B.F.P 770"
  },
  {
    "id": "si_12",
    "subGroupId": "sg_23",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(A)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(A) 780"
  },
  {
    "id": "si_13",
    "subGroupId": "sg_24",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(B)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(B) 780"
  },
  {
    "id": "si_14",
    "subGroupId": "sg_25",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P 780"
  },
  {
    "id": "si_15",
    "subGroupId": "sg_26",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "B.F.P-(G)-(Digital)-Lower-Film",
    "itemPrefix": "B.F.P-(G) 780"
  },
  {
    "id": "si_16",
    "subGroupId": "sg_27",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "C.M-(Digital)-Lower-Film",
    "itemPrefix": "C.M 780"
  },
  {
    "id": "si_17",
    "subGroupId": "sg_28",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P-(Digital)-Lower-Film",
    "itemPrefix": "F.P 780"
  },
  {
    "id": "si_18",
    "subGroupId": "sg_29",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.C.G-(Digital)-Lower-Film",
    "itemPrefix": "F.P.C.G 780"
  },
  {
    "id": "si_19",
    "subGroupId": "sg_30",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "F.P.G-(Digital)-Lower-Film",
    "itemPrefix": "F.P.G 780"
  },
  {
    "id": "si_20",
    "subGroupId": "sg_31",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.L-(Digital)-Lower-Film",
    "itemPrefix": "S.L 780"
  },
  {
    "id": "si_21",
    "subGroupId": "sg_32",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "S.P-(Digital)-Lower-Film",
    "itemPrefix": "S.P 780"
  },
  {
    "id": "si_22",
    "subGroupId": "sg_33",
    "mainGroup": "Digital or Golden Lower Film",
    "groupName": "T.G-(Digital)-Lower-Film",
    "itemPrefix": "T.G 780"
  },
  {
    "id": "si_23",
    "subGroupId": "sg_34",
    "mainGroup": "7D UV SHEET",
    "groupName": "7D UV",
    "itemPrefix": "UVD 2044"
  },
  {
    "id": "si_24",
    "subGroupId": "sg_34",
    "mainGroup": "7D UV SHEET",
    "groupName": "7D UV",
    "itemPrefix": "UVD 2043"
  },
  {
    "id": "si_25",
    "subGroupId": "sg_34",
    "mainGroup": "7D UV SHEET",
    "groupName": "7D UV",
    "itemPrefix": "UVD 2042"
  },
  {
    "id": "si_26",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 200"
  },
  {
    "id": "si_27",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 209"
  },
  {
    "id": "si_28",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 216"
  },
  {
    "id": "si_29",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 217"
  },
  {
    "id": "si_30",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 756"
  },
  {
    "id": "si_31",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 768"
  },
  {
    "id": "si_32",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 769"
  },
  {
    "id": "si_33",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 770"
  },
  {
    "id": "si_34",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 773"
  },
  {
    "id": "si_35",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 774"
  },
  {
    "id": "si_36",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 775"
  },
  {
    "id": "si_37",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 776"
  },
  {
    "id": "si_38",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 777"
  },
  {
    "id": "si_39",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 778"
  },
  {
    "id": "si_40",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 779"
  },
  {
    "id": "si_41",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 780"
  },
  {
    "id": "si_42",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 781"
  },
  {
    "id": "si_43",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 782"
  },
  {
    "id": "si_44",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 783"
  },
  {
    "id": "si_45",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 785"
  },
  {
    "id": "si_46",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 786"
  },
  {
    "id": "si_47",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 787"
  },
  {
    "id": "si_48",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 800"
  },
  {
    "id": "si_49",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 801"
  },
  {
    "id": "si_50",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 802"
  },
  {
    "id": "si_51",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 803"
  },
  {
    "id": "si_52",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 804"
  },
  {
    "id": "si_53",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 805"
  },
  {
    "id": "si_54",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 808"
  },
  {
    "id": "si_55",
    "subGroupId": "sg_2",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(A)-(Digital)",
    "itemPrefix": "B.F.P-(A) 809"
  },
  {
    "id": "si_56",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 200"
  },
  {
    "id": "si_57",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 209"
  },
  {
    "id": "si_58",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 216"
  },
  {
    "id": "si_59",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 217"
  },
  {
    "id": "si_60",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 756"
  },
  {
    "id": "si_61",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 768"
  },
  {
    "id": "si_62",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 769"
  },
  {
    "id": "si_63",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 770"
  },
  {
    "id": "si_64",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 773"
  },
  {
    "id": "si_65",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 774"
  },
  {
    "id": "si_66",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 775"
  },
  {
    "id": "si_67",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 776"
  },
  {
    "id": "si_68",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 777"
  },
  {
    "id": "si_69",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 778"
  },
  {
    "id": "si_70",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 779"
  },
  {
    "id": "si_71",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 780"
  },
  {
    "id": "si_72",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 781"
  },
  {
    "id": "si_73",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 782"
  },
  {
    "id": "si_74",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 783"
  },
  {
    "id": "si_75",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 785"
  },
  {
    "id": "si_76",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 786"
  },
  {
    "id": "si_77",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 787"
  },
  {
    "id": "si_78",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 800"
  },
  {
    "id": "si_79",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 801"
  },
  {
    "id": "si_80",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 802"
  },
  {
    "id": "si_81",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 803"
  },
  {
    "id": "si_82",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 804"
  },
  {
    "id": "si_83",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 805"
  },
  {
    "id": "si_84",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 808"
  },
  {
    "id": "si_85",
    "subGroupId": "sg_3",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(B)-(Digital)",
    "itemPrefix": "B.F.P-(B) 809"
  },
  {
    "id": "si_86",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 200"
  },
  {
    "id": "si_87",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 209"
  },
  {
    "id": "si_88",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 216"
  },
  {
    "id": "si_89",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 217"
  },
  {
    "id": "si_90",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 756"
  },
  {
    "id": "si_91",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 768"
  },
  {
    "id": "si_92",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 769"
  },
  {
    "id": "si_93",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 770"
  },
  {
    "id": "si_94",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 773"
  },
  {
    "id": "si_95",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 774"
  },
  {
    "id": "si_96",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 775"
  },
  {
    "id": "si_97",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 776"
  },
  {
    "id": "si_98",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 777"
  },
  {
    "id": "si_99",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 778"
  },
  {
    "id": "si_100",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 779"
  },
  {
    "id": "si_101",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 780"
  },
  {
    "id": "si_102",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 781"
  },
  {
    "id": "si_103",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 782"
  },
  {
    "id": "si_104",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 783"
  },
  {
    "id": "si_105",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 785"
  },
  {
    "id": "si_106",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 786"
  },
  {
    "id": "si_107",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 787"
  },
  {
    "id": "si_108",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 800"
  },
  {
    "id": "si_109",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 801"
  },
  {
    "id": "si_110",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 802"
  },
  {
    "id": "si_111",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 803"
  },
  {
    "id": "si_112",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 804"
  },
  {
    "id": "si_113",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 805"
  },
  {
    "id": "si_114",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 808"
  },
  {
    "id": "si_115",
    "subGroupId": "sg_21",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(Digital)",
    "itemPrefix": "B.F.P 809"
  },
  {
    "id": "si_116",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 200"
  },
  {
    "id": "si_117",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 209"
  },
  {
    "id": "si_118",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 216"
  },
  {
    "id": "si_119",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 217"
  },
  {
    "id": "si_120",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 756"
  },
  {
    "id": "si_121",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 768"
  },
  {
    "id": "si_122",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 769"
  },
  {
    "id": "si_123",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 770"
  },
  {
    "id": "si_124",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 773"
  },
  {
    "id": "si_125",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 774"
  },
  {
    "id": "si_126",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 775"
  },
  {
    "id": "si_127",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 776"
  },
  {
    "id": "si_128",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 777"
  },
  {
    "id": "si_129",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 778"
  },
  {
    "id": "si_130",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 779"
  },
  {
    "id": "si_131",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 780"
  },
  {
    "id": "si_132",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 781"
  },
  {
    "id": "si_133",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 782"
  },
  {
    "id": "si_134",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 783"
  },
  {
    "id": "si_135",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 785"
  },
  {
    "id": "si_136",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 786"
  },
  {
    "id": "si_137",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 787"
  },
  {
    "id": "si_138",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 800"
  },
  {
    "id": "si_139",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 801"
  },
  {
    "id": "si_140",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 802"
  },
  {
    "id": "si_141",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 803"
  },
  {
    "id": "si_142",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 804"
  },
  {
    "id": "si_143",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 805"
  },
  {
    "id": "si_144",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 808"
  },
  {
    "id": "si_145",
    "subGroupId": "sg_4",
    "mainGroup": "Digital",
    "groupName": "B.F.P-(G)-(Digital)",
    "itemPrefix": "B.F.P-(G) 809"
  },
  {
    "id": "si_146",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 200"
  },
  {
    "id": "si_147",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 209"
  },
  {
    "id": "si_148",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 216"
  },
  {
    "id": "si_149",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 217"
  },
  {
    "id": "si_150",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 756"
  },
  {
    "id": "si_151",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 768"
  },
  {
    "id": "si_152",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 769"
  },
  {
    "id": "si_153",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 770"
  },
  {
    "id": "si_154",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 773"
  },
  {
    "id": "si_155",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 774"
  },
  {
    "id": "si_156",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 775"
  },
  {
    "id": "si_157",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 776"
  },
  {
    "id": "si_158",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 777"
  },
  {
    "id": "si_159",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 778"
  },
  {
    "id": "si_160",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 779"
  },
  {
    "id": "si_161",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 780"
  },
  {
    "id": "si_162",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 781"
  },
  {
    "id": "si_163",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 782"
  },
  {
    "id": "si_164",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 783"
  },
  {
    "id": "si_165",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 785"
  },
  {
    "id": "si_166",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 786"
  },
  {
    "id": "si_167",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 787"
  },
  {
    "id": "si_168",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 800"
  },
  {
    "id": "si_169",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 801"
  },
  {
    "id": "si_170",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 802"
  },
  {
    "id": "si_171",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 803"
  },
  {
    "id": "si_172",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 804"
  },
  {
    "id": "si_173",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 805"
  },
  {
    "id": "si_174",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 808"
  },
  {
    "id": "si_175",
    "subGroupId": "sg_5",
    "mainGroup": "Digital",
    "groupName": "C.M-(Digital)",
    "itemPrefix": "C.M 809"
  },
  {
    "id": "si_176",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 200"
  },
  {
    "id": "si_177",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 209"
  },
  {
    "id": "si_178",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 216"
  },
  {
    "id": "si_179",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 217"
  },
  {
    "id": "si_180",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 756"
  },
  {
    "id": "si_181",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 768"
  },
  {
    "id": "si_182",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 769"
  },
  {
    "id": "si_183",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 770"
  },
  {
    "id": "si_184",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 773"
  },
  {
    "id": "si_185",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 774"
  },
  {
    "id": "si_186",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 775"
  },
  {
    "id": "si_187",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 776"
  },
  {
    "id": "si_188",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 777"
  },
  {
    "id": "si_189",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 778"
  },
  {
    "id": "si_190",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 779"
  },
  {
    "id": "si_191",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 780"
  },
  {
    "id": "si_192",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 781"
  },
  {
    "id": "si_193",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 782"
  },
  {
    "id": "si_194",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 783"
  },
  {
    "id": "si_195",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 785"
  },
  {
    "id": "si_196",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 786"
  },
  {
    "id": "si_197",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 787"
  },
  {
    "id": "si_198",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 800"
  },
  {
    "id": "si_199",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 801"
  },
  {
    "id": "si_200",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 802"
  },
  {
    "id": "si_201",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 803"
  },
  {
    "id": "si_202",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 804"
  },
  {
    "id": "si_203",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 805"
  },
  {
    "id": "si_204",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 808"
  },
  {
    "id": "si_205",
    "subGroupId": "sg_6",
    "mainGroup": "Digital",
    "groupName": "F.P-(Digital)",
    "itemPrefix": "F.P 809"
  },
  {
    "id": "si_206",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G 783"
  },
  {
    "id": "si_207",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G.781"
  },
  {
    "id": "si_208",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G.785"
  },
  {
    "id": "si_209",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G782"
  },
  {
    "id": "si_210",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P C.G802"
  },
  {
    "id": "si_211",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P CG803"
  },
  {
    "id": "si_212",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P CG804"
  },
  {
    "id": "si_213",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P CG805"
  },
  {
    "id": "si_214",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 200"
  },
  {
    "id": "si_215",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 209"
  },
  {
    "id": "si_216",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 216"
  },
  {
    "id": "si_217",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 217"
  },
  {
    "id": "si_218",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 756"
  },
  {
    "id": "si_219",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 768"
  },
  {
    "id": "si_220",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 769"
  },
  {
    "id": "si_221",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 770"
  },
  {
    "id": "si_222",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 773"
  },
  {
    "id": "si_223",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 774"
  },
  {
    "id": "si_224",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 775"
  },
  {
    "id": "si_225",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 776"
  },
  {
    "id": "si_226",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 777"
  },
  {
    "id": "si_227",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 778"
  },
  {
    "id": "si_228",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 779"
  },
  {
    "id": "si_229",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 780"
  },
  {
    "id": "si_230",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 781"
  },
  {
    "id": "si_231",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 782"
  },
  {
    "id": "si_232",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 783"
  },
  {
    "id": "si_233",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 784"
  },
  {
    "id": "si_234",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 785"
  },
  {
    "id": "si_235",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 786"
  },
  {
    "id": "si_236",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 800"
  },
  {
    "id": "si_237",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 801"
  },
  {
    "id": "si_238",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 802"
  },
  {
    "id": "si_239",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 803"
  },
  {
    "id": "si_240",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 804"
  },
  {
    "id": "si_241",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 805"
  },
  {
    "id": "si_242",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 808"
  },
  {
    "id": "si_243",
    "subGroupId": "sg_7",
    "mainGroup": "Digital",
    "groupName": "F.P.C.G-(Digital)",
    "itemPrefix": "F.P.C.G 809"
  },
  {
    "id": "si_244",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 200"
  },
  {
    "id": "si_245",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 209"
  },
  {
    "id": "si_246",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 216"
  },
  {
    "id": "si_247",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 217"
  },
  {
    "id": "si_248",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 756"
  },
  {
    "id": "si_249",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 768"
  },
  {
    "id": "si_250",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 769"
  },
  {
    "id": "si_251",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 770"
  },
  {
    "id": "si_252",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 773"
  },
  {
    "id": "si_253",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 774"
  },
  {
    "id": "si_254",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 775"
  },
  {
    "id": "si_255",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 776"
  },
  {
    "id": "si_256",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 777"
  },
  {
    "id": "si_257",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 778"
  },
  {
    "id": "si_258",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 779"
  },
  {
    "id": "si_259",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 780"
  },
  {
    "id": "si_260",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 781"
  },
  {
    "id": "si_261",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 782"
  },
  {
    "id": "si_262",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 783"
  },
  {
    "id": "si_263",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 785"
  },
  {
    "id": "si_264",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 786"
  },
  {
    "id": "si_265",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 787"
  },
  {
    "id": "si_266",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 800"
  },
  {
    "id": "si_267",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 801"
  },
  {
    "id": "si_268",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 802"
  },
  {
    "id": "si_269",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 803"
  },
  {
    "id": "si_270",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 804"
  },
  {
    "id": "si_271",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 805"
  },
  {
    "id": "si_272",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 808"
  },
  {
    "id": "si_273",
    "subGroupId": "sg_8",
    "mainGroup": "Digital",
    "groupName": "F.P.G-(Digital)",
    "itemPrefix": "F.P.G 809"
  },
  {
    "id": "si_274",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 200"
  },
  {
    "id": "si_275",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 209"
  },
  {
    "id": "si_276",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 216"
  },
  {
    "id": "si_277",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 217"
  },
  {
    "id": "si_278",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 756"
  },
  {
    "id": "si_279",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 768"
  },
  {
    "id": "si_280",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 769"
  },
  {
    "id": "si_281",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 770"
  },
  {
    "id": "si_282",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 773"
  },
  {
    "id": "si_283",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 774"
  },
  {
    "id": "si_284",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 775"
  },
  {
    "id": "si_285",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 776"
  },
  {
    "id": "si_286",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 777"
  },
  {
    "id": "si_287",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 778"
  },
  {
    "id": "si_288",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 779"
  },
  {
    "id": "si_289",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 780"
  },
  {
    "id": "si_290",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 781"
  },
  {
    "id": "si_291",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 782"
  },
  {
    "id": "si_292",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 783"
  },
  {
    "id": "si_293",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 785"
  },
  {
    "id": "si_294",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 786"
  },
  {
    "id": "si_295",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 787"
  },
  {
    "id": "si_296",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 800"
  },
  {
    "id": "si_297",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 801"
  },
  {
    "id": "si_298",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 802"
  },
  {
    "id": "si_299",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 803"
  },
  {
    "id": "si_300",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 804"
  },
  {
    "id": "si_301",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 805"
  },
  {
    "id": "si_302",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 808"
  },
  {
    "id": "si_303",
    "subGroupId": "sg_9",
    "mainGroup": "Digital",
    "groupName": "S.L-(Digital)",
    "itemPrefix": "S.L 809"
  },
  {
    "id": "si_304",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 200"
  },
  {
    "id": "si_305",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 209"
  },
  {
    "id": "si_306",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 216"
  },
  {
    "id": "si_307",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 217"
  },
  {
    "id": "si_308",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 756"
  },
  {
    "id": "si_309",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 768"
  },
  {
    "id": "si_310",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 769"
  },
  {
    "id": "si_311",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 770"
  },
  {
    "id": "si_312",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 773"
  },
  {
    "id": "si_313",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 774"
  },
  {
    "id": "si_314",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 775"
  },
  {
    "id": "si_315",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 776"
  },
  {
    "id": "si_316",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 777"
  },
  {
    "id": "si_317",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 778"
  },
  {
    "id": "si_318",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 779"
  },
  {
    "id": "si_319",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 780"
  },
  {
    "id": "si_320",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 781"
  },
  {
    "id": "si_321",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 782"
  },
  {
    "id": "si_322",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 783"
  },
  {
    "id": "si_323",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 785"
  },
  {
    "id": "si_324",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 786"
  },
  {
    "id": "si_325",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 787"
  },
  {
    "id": "si_326",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 800"
  },
  {
    "id": "si_327",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 801"
  },
  {
    "id": "si_328",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 802"
  },
  {
    "id": "si_329",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 803"
  },
  {
    "id": "si_330",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 804"
  },
  {
    "id": "si_331",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 805"
  },
  {
    "id": "si_332",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 808"
  },
  {
    "id": "si_333",
    "subGroupId": "sg_19",
    "mainGroup": "Digital",
    "groupName": "S.P-(Digital)",
    "itemPrefix": "S.P 809"
  },
  {
    "id": "si_334",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 200"
  },
  {
    "id": "si_335",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 209"
  },
  {
    "id": "si_336",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 216"
  },
  {
    "id": "si_337",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 217"
  },
  {
    "id": "si_338",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 756"
  },
  {
    "id": "si_339",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 768"
  },
  {
    "id": "si_340",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 769"
  },
  {
    "id": "si_341",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 770"
  },
  {
    "id": "si_342",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 773"
  },
  {
    "id": "si_343",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 774"
  },
  {
    "id": "si_344",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 775"
  },
  {
    "id": "si_345",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 776"
  },
  {
    "id": "si_346",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 777"
  },
  {
    "id": "si_347",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 778"
  },
  {
    "id": "si_348",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 779"
  },
  {
    "id": "si_349",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 780"
  },
  {
    "id": "si_350",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 781"
  },
  {
    "id": "si_351",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 782"
  },
  {
    "id": "si_352",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 783"
  },
  {
    "id": "si_353",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 785"
  },
  {
    "id": "si_354",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 786"
  },
  {
    "id": "si_355",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 787"
  },
  {
    "id": "si_356",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 800"
  },
  {
    "id": "si_357",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 801"
  },
  {
    "id": "si_358",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 802"
  },
  {
    "id": "si_359",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 803"
  },
  {
    "id": "si_360",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 804"
  },
  {
    "id": "si_361",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 805"
  },
  {
    "id": "si_362",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 808"
  },
  {
    "id": "si_363",
    "subGroupId": "sg_20",
    "mainGroup": "Digital",
    "groupName": "T.G-(Digital)",
    "itemPrefix": "T.G 809"
  }
];
