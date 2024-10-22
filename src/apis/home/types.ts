// export interface Indicator {
//     id: number;
//     indicatorId: number;
//     indicatorSymbol: string;
//     metricUnitId: number;
//     formula: string;
//     remark: string;
//     createTime: string;  // 可以进一步定义为 Date 类型并在使用时进行转换
//     refEquipId: number;
//     methodType: number;
//     inParamDefine: InParam[];  // 如果在实际使用中保持 JSON 字符串格式，使用 `string`，否则使用 `InParamDefine` 对象
// }

// export interface InParam {
//     field: string;
//     label: string;
//     defaultValue: number;
// }