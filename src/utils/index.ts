import * as XLSX from 'xlsx'
import { read, writeFileXLSX, utils, WorkBook, writeFile, writeXLSX } from "xlsx";
import type { UploadRawFile } from 'element-plus'
export interface WorkbookJson {
    SheetNames: string[];
    Sheets: { [key: string]: any[] }; // 定义 Sheets 为带有字符串键和任意数组值的对象
}
export function workbookToFile(workbook: WorkBook, fileName: string, uid?: number): UploadRawFile {
    // 第一步：将 Workbook 写入 ArrayBuffer
    const arrayBuffer = XLSX.writeXLSX(workbook, {
        bookType: 'xlsx',
        type: 'array'
    });

    // 第二步：将 ArrayBuffer 转换为 Blob
    const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // 第三步：将 Blob 转换为 File 对象
    const file = new File([blob], fileName, { type: blob.type });

    // 返回扩展对象，添加 uid
    return Object.assign(file, { uid: uid ?? Date.now() }); // 默认使用时间戳作为 uid
}

export const json_to_File = (jsonData: WorkbookJson) => {
    const { SheetNames, Sheets }  = jsonData
    const workbook = utils.book_new();
    SheetNames.forEach(item => {
        const worksheet = utils.json_to_sheet(Sheets[item]);
        utils.book_append_sheet(workbook, worksheet, item);
    })

    return workbook
}

// 函数用于将 Float32Array 转换为 Int16Array
export function float32ToInt16(float32Array: Float32Array): ArrayBuffer {
  const l = float32Array.length
  const buffer = new ArrayBuffer(l * 2)
  const view = new DataView(buffer)

  for (let i = 0; i < l; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true) // Little-endian
  }

  return buffer
}