<template>
    <div class="spreadsheet-box">
        <div class="box" id="x-spreadsheet-el" ref="spreadsheetRef" style="width: 100%; height: 100%;">
        </div>
    </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from "vue";
import Spreadsheet from "x-data-spreadsheet";
// @ts-ignore
import zhCN from 'x-data-spreadsheet/src/locale/zh-cn';

import * as XLSX from 'xlsx'
import { workbookToFile} from '@/utils/index'
const emit = defineEmits()

let spreadsheet = null
const spreadsheetRef = ref()
const totalRows = ref(100)
Spreadsheet.locale('zh-cn', zhCN);

onMounted(() => {
    nextTick(() => {
        init()
    })
})


const uninstall = () => {
    var container = document.getElementById('x-spreadsheet-el');
    container.innerHTML = '';
    spreadsheet = null
}
const init = () => {

    uninstall()
    spreadsheet = new Spreadsheet("#x-spreadsheet-el", {
        showToolbar: true,
        showBottomBar: true,
        showContextmenu: true,
        view: {
            height: () => spreadsheetRef.value.clientHeight,
            width: () => spreadsheetRef.value.clientWidth,
        },
        col: {
            len: 26,
            width: 140,
            indexWidth: 40
        },
        row: {
            len: totalRows.value,
            height: 30,
        },
        style: {
            // 背景颜色
            bgcolor: '#ffffff',
            // 水平对齐方式
            align: 'left',
            // 垂直对齐方式
            valign: 'middle',
            // 是否需要换行
            textwrap: false,
            // 虚线边框
            strike: false,
            // 下画线
            underline: false,
            // 文字颜色
            color: '#0a0a0a',
            // 字体设置
            font: {
                // 字体
                name: 'Helvetica',
                // 字号大小
                size: 10,
                // 是否加粗
                bold: false,
                // 斜体
                italic: false,
            },
        }
    })

    spreadsheet.change(changeData)
}

const changeData = (data) => {
    emit('changeData', data)
}
const openFile = () => {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = ".xlsx"
    // input.multiple = true
    input.onchange = e => {
        var files = e.target.files;
        importExcel(files[0])
    }
    input.click();
}


const exportFile = (fileName) => {
    let new_wb = xtos(spreadsheet.getData())
    return workbookToFile(new_wb, fileName)


}

// 处理数据
function fixData(data) {
    let o = '',
        l = 0,
        w = 10240
    for (; l < data.byteLength / w; ++l)
        o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)))
    o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)))
    return o
}

// 导入数据
function importExcel(file) {
    let reader = new FileReader()
    reader.onload = e => {
        let data = e.target.result
        let fixedData = fixData(data)
        let workbook = XLSX.read(btoa(fixedData), { type: 'base64' })
        let sheetData = stox(workbook)

        // 初始化xs
        nextTick(() => {
            spreadsheet.loadData(sheetData)
        })
    }
    reader.readAsArrayBuffer(file)
}
// sheet转换为x-sheet格式
function stox(wb) {
    let out = []
    wb.SheetNames.forEach(name => {
        let o = { name: name, rows: {}, merges: [] }
        let ws = wb.Sheets[name]
        let aoa = XLSX.utils.sheet_to_json(ws, { raw: false, header: 1 })

        aoa.forEach((r, i) => {
            let cells = {}
            r.forEach((c, j) => {
                cells[j] = { text: c }
            })
            o.rows[i] = { cells: cells }
        })
        // 获取表格行数，下方空20行
        totalRows.value = Object.keys(o.rows).length + 20
        if (totalRows.value < 100) {
            totalRows.value = 100
        }

        // 设置合并单元格
        if (ws['!merges']) {
            ws['!merges'].forEach(merge => {
                /** merge = {
                 *  s: {c: 0, r: 15}
                 *  e: {c: 15, r: 15}
                 * }
                 */
                // 修改 cell 中 merge [合并行数,合并列数]
                let cell = o.rows[merge.s.r].cells[merge.s.c]

                //无内容单元格处理
                if (!cell) {
                    cell = { text: '' }
                }
                cell.merge = [merge.e.r - merge.s.r, merge.e.c - merge.s.c]
                o.rows[merge.s.r].cells[merge.s.c] = cell

                // 修改 merges
                o.merges.push(XLSX.utils.encode_range(merge))
            })
        }

        out.push(o)
    })
    return out
}


// 导出excel
function exportExcel() {
    let new_wb = xtos(spreadsheet.getData())
    XLSX.writeFile(new_wb, '测试导出.xlsx')
}

// x-sheet转换为sheet格式
function xtos(sdata) {
    let out = XLSX.utils.book_new()
    sdata.forEach(xws => {
        let aoa = [[]]
        let rowObj = xws.rows
        for (let ri = 0; ri < rowObj.len; ++ri) {
            let row = rowObj[ri]
            if (!row) continue
            aoa[ri] = []
            Object.keys(row.cells).forEach(k => {
                let idx = +k
                if (isNaN(idx)) return
                aoa[ri][idx] = row.cells[k].text
            })
        }
        let ws = XLSX.utils.aoa_to_sheet(aoa)

        /** 读取在线中的合并单元格，并写入导出的数据中
     * merges: Array(19)
     0: "A16:P16"
     1: "A17:P17"
     2: "O2:P2"
     3: "F2:G2"
     */
        ws['!merges'] = []
        xws.merges.forEach(merge => {
            ws['!merges'].push(XLSX.utils.decode_range(merge))
        })

        XLSX.utils.book_append_sheet(out, ws, xws.name)
    })
    return out
}

const exportJson = () => {
    const new_wb = xtos(spreadsheet.getData())
    new_wb.SheetNames.forEach(sheetName => {
        new_wb.Sheets[sheetName] = XLSX.utils.sheet_to_json(new_wb.Sheets[sheetName]);
    })

    return new_wb
}

const setSpreadsheetData = (sheetData) => {
    spreadsheet.loadData(sheetData)
}
const getSpreadsheetData = () => {
    return spreadsheet.getData()
}

const openJson = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(jsonData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    let sheetData = stox(workbook)

    init()
    spreadsheet.loadData(sheetData)
}

// 撤销
const undo = () => {
    spreadsheet.data.undo()
    reRender()
}

// 重做
const redo = () => {
    spreadsheet.data.redo()
    reRender()
}

// 更新
const reRender = () => {
    spreadsheet.reRender()
}

// 设置行列禁止编辑
const setRowAndCellDisabled = (rowIndex, cellIndex) => {
    const curSheet = spreadsheet.datas[0]

    curSheet.rows.each((ri, row) => {
        curSheet.rows.eachCells(ri, (ci, cell) => {

            if (rowIndex && ri + 1 == rowIndex) {
                cell.editable = false
            }
            if (cellIndex && ci + 1 == cellIndex) {
                cell.editable = false

            }
            curSheet.rows.setCell(ri, ci, cell)
        })
    })
    reRender()

}

// 获取表头的函数
function getHeaders() {
    const data = spreadsheet.getData()
    const headers = []
    data.forEach((item, index) => {
        const column = []
        const obj = {}
        const headerRow = item.rows[0]; // 假设第 0 行是表头
        // 遍历表头行的单元格
        for (let cellKey in headerRow.cells) {
            column.push(headerRow.cells[cellKey].text);
        }

        obj.name = item.name
        obj.column = column

        headers.push(obj)
    })
    return headers
}

defineExpose({
    utils: {
        xtos,
        stox
    },
    importExcel,
    exportExcel,
    openFile,
    exportJson,
    openJson,
    undo,
    redo,
    setRowAndCellDisabled,
    exportFile,
    getHeaders,
    setSpreadsheetData,
    getSpreadsheetData
})

</script>

<style lang="scss">
.spreadsheet-box {
    width: 100%;
    height: 100%;
}

.x-spreadsheet-editor {
    z-index: 9999 !important;
}

// .x-spreadsheet-toolbar {
//     width: 100% !important;
// }
.x-spreadsheet-toolbar-btns {
    .x-spreadsheet-toolbar-btn:nth-child(+n+3) {
        display: none;
    }

    .x-spreadsheet-toolbar-divider {
        display: none;
    }
}

.x-spreadsheet-contextmenu {
    .x-spreadsheet-item:nth-child(+n+5) {
        display: none;
    }
}
</style>