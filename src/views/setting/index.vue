<template>
    <div>
        <div style="display: flex; justify-content: space-between;">
            <el-upload ref="uploadRef" action="#" :auto-upload="false" :before-upload="beforeUpload" multiple
                :show-file-list="false" :on-change="handleFileChange" :on-remove="removeFile">
                <template #trigger>
                    <el-button type="primary">选择文件</el-button>
                </template>
            </el-upload>

            <el-button type="primary" @click="editData">编辑</el-button>
            <el-button type="primary" @click="saveData">保存</el-button>
            <el-button type="success" @click="uploadFile">上传</el-button>

            <!-- <el-button type="primary" @click="exportJson">导出json</el-button> -->
        </div>

        <div>
            <el-tag v-for="tag in fileList" :key="tag.uid" closable
                :type="tag.uid === activeFile?.uid ? 'success' : 'primary'">
                {{ tag.name }}
            </el-tag>
        </div>

        <div style="height: 80vh;">
            <editTable ref="EditTableRef" @changeData="changeData" />
        </div>


        <el-dialog v-model="dialogFormVisible" title="编辑数据" width="500">
            <el-form :model="form">
                <el-form-item label="工作表">
                    <el-select v-model="form.sheet" placeholder="Please select a zone">
                        <el-option v-for="item in fileSheetListByColmun" :label="item.name" :value="item.name" />
                    </el-select>
                </el-form-item>
                <el-form-item label="列头">
                    <el-select v-model="form.tableColumn" placeholder="Please select a zone">
                        <el-option v-for="item in selectColmunList" :label="item" :value="item" />
                    </el-select>
                </el-form-item>
                <el-form-item label="变更值">
                    <el-input v-model="form.value" autocomplete="off" />
                </el-form-item>

            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogFormVisible = false">取消</el-button>
                    <el-button type="primary" @click="editTableFormSubmit">确定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { uploadFileWorld } from '@/apis/home/index'
import { nextTick, ref, reactive, computed } from 'vue'
import type { UploadInstance, UploadFile, UploadFiles, UploadRawFile } from 'element-plus'
import { read, writeFileXLSX, utils, WorkBook, writeFile, writeXLSX } from "xlsx";
import editTable from '@/components/editTable/index.vue'
import { workbookToFile, WorkbookJson, json_to_File } from '@/utils/index'

interface SheetColmun {
    name: string,
    column: Array<string>
}


interface FromData {
    sheet: string | Array<string>,
    tableColumn: string | Array<string>,
    value: string
}


const uploadRef = ref<UploadInstance>()

const fileList = ref<UploadFiles>([])
const activeFile = ref<UploadFile | null>(null)

const dialogFormVisible = ref(false)
const form = reactive<FromData>({
    sheet: [],
    tableColumn: [],
    value: ''
})


const beforeUpload = (rawFile: UploadRawFile) => {
    return false
}
const handleFileChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    fileList.value = uploadFiles

    if (fileList.value.length && !activeFile.value) {
        activeFile.value = fileList.value[0]

        console.log(activeFile.value, 'activeFile.value');
        
        importExcel(activeFile.value)
    }
}

const removeFile = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    handleFileChange(uploadFile, uploadFiles)
}



// EditTableRef
const EditTableRef = ref()
const importExcel = (activeFile: UploadFile) => {
    EditTableRef.value.importExcel(activeFile.raw)
}

const fileSheetListByColmun = ref<SheetColmun[]>([])

const selectColmunList = computed(() => {

    const sheetName: Array<string> = Array.isArray(form.sheet) ? form.sheet : [form.sheet]

    const selectSheet = fileSheetListByColmun.value.filter(item =>
        sheetName.includes(item.name)
    );

    // 展平 column 数组并去重
    const allColumns = selectSheet.map(item => item.column).flat();
    const uniqueColumns = Array.from(new Set(allColumns)); // 去重

    return uniqueColumns;

})
const editData = () => {
    fileSheetListByColmun.value = EditTableRef.value.getHeaders()

    dialogFormVisible.value = true
}

// 计算方法
const calculationHandler = () => {
    const { sheet, tableColumn, value } = form
    const sheetNameList: Array<string> = Array.isArray(sheet) ? sheet : [sheet]
    const columnList: Array<string> = Array.isArray(tableColumn) ? tableColumn : [tableColumn]

    const jsonData: WorkbookJson = EditTableRef.value.exportJson()

    sheetNameList.forEach(item => {
        jsonData.Sheets[item].forEach((data) => {
            columnList.forEach(column => {
                data[column] = value
            })
        })
    })

    return jsonData
}
const editTableFormSubmit = () => {

    const newData = calculationHandler()

    const new_wb = json_to_File(newData)
    const file: UploadRawFile = workbookToFile(new_wb, activeFile.value ? activeFile.value.name : 'file')

    if (activeFile.value) {
        activeFile.value.raw = file
        importExcel(activeFile.value)
    }

    dialogFormVisible.value = false
}
const changeData = (data: any) => {


}
function downloadFile(file: File) {
    // 创建一个 URL 对象
    const url = URL.createObjectURL(file);

    // 创建一个 <a> 元素用于下载
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;

    // 触发点击事件进行下载
    document.body.appendChild(a);
    a.click();

    // 清理 URL 对象和 <a> 元素
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
const saveData = () => {
    const file = EditTableRef.value.exportFile('测试')
    console.log(file, 'file');

    // downloadFile(file)
}

const uploadFile = () => {
    const file = EditTableRef.value.exportFile('测试上传文件.xlsx')
    console.log(file, 'file');
    
    if (!file) {
        console.error('文件不存在');
        return;
    }
    // 创建 FormData 并追加文件
    const formData = new FormData();

    formData.append('file', file); // 将文件添加到 FormData 对象中

    // 上传的网络接口
    uploadFileWorld(formData)
        .then(response => {
            console.log('上传成功:', response);
            // 可以在这里处理上传成功后的逻辑
        })
        .catch(error => {
            console.error('上传失败:', error);
            // 可以在这里处理上传失败的逻辑
        });
}


</script>

<style lang="scss" scoped></style>