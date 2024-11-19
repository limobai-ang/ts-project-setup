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


        <el-dialog v-model="dialogFormVisible" title="Shipping address" width="500">
            <el-form :model="form">
                <el-form-item label="作用Sheet">
                    <el-select v-model="form.sheet" placeholder="Please select a zone">
                        <el-option v-for="item in fileSheetListByColmun" :label="item.name" :value="item.name" />
                    </el-select>
                </el-form-item>
                <el-form-item label="作用Sheet">
                    <el-select v-model="form.tableColumn" placeholder="Please select a zone">
                        <el-option v-for="item in selectColmunList" :label="item" :value="item" />
                    </el-select>
                </el-form-item>
                <el-form-item label="变更的值">
                    <el-input v-model="form.value" autocomplete="off" />
                </el-form-item>

            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogFormVisible = false">Cancel</el-button>
                    <el-button type="primary" @click="dialogFormVisible = false">
                        Confirm
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { nextTick, ref, reactive, computed } from 'vue'
import type { UploadInstance, UploadFile, UploadFiles, UploadRawFile } from 'element-plus'
import { read, writeFileXLSX, utils, WorkBook, writeFile, writeXLSX } from "xlsx";
import editTable from '@/components/editTable/index.vue'
const uploadRef = ref<UploadInstance>()

const fileList = ref<UploadFiles>([])
const activeFile = ref<UploadFile | null>(null)

const dialogFormVisible = ref(false)
const form = reactive({
    sheet: [],
    tableColumn: [],
    value: ''
})


interface WorkbookJson {
    SheetNames: string[];
    Sheets: { [key: string]: any[] }; // 定义 Sheets 为带有字符串键和任意数组值的对象
}

const beforeUpload = (rawFile: UploadRawFile) => {
    return false
}
const handleFileChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    fileList.value = uploadFiles

    if (fileList.value.length && !activeFile.value) {
        activeFile.value = fileList.value[0]
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

interface SheetColmun {
    name: string,
    column: Array<string>
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


</script>

<style lang="scss" scoped></style>