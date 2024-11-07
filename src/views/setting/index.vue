<template>
    <div>
        <div>
            <el-upload ref="uploadRef" action="#" :auto-upload="false" :before-upload="beforeUpload"
                :on-change="handleFileChange" :on-remove="removeFile">
                <template #trigger>
                    <el-button type="primary">select file</el-button>
                </template>
            </el-upload>
        </div>


        <div style="height: 80vh;">
            <editTable ref="EditTableRef" @changeData="changeData" />
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { UploadInstance, UploadFile, UploadFiles, UploadRawFile } from 'element-plus'
import { read, writeFileXLSX, utils, WorkBook } from "xlsx";
import editTable from '@/components/editTable/index.vue'
const uploadRef = ref<UploadInstance>()

const fileList = ref<UploadFiles>([])

interface WorkbookJson {
    SheetNames: string[];
    Sheets: { [key: string]: any[] }; // 定义 Sheets 为带有字符串键和任意数组值的对象
}
const fileListJson = ref<WorkbookJson[]>([])
const beforeUpload = (rawFile: UploadRawFile) => {
    return false
}
const handleFileChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    fileList.value = uploadFiles

    readFile()
}

const removeFile = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    handleFileChange(uploadFile, uploadFiles)
}

const readFile = () => {
    const jsonList: WorkbookJson[] = []
    fileList.value.forEach((item) => {
        if (!item.raw) {
            console.error("文件数据不存在或格式错误:", item);
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const result = e.target?.result;

            // 仅当 result 是 ArrayBuffer 时进行 Uint8Array 转换
            if (result && result instanceof ArrayBuffer) {
                const data = new Uint8Array(result); // 转换 ArrayBuffer 为 Uint8Array
                const workbook = read(data, { type: 'array' }); // 使用 'array' 类型读取

                jsonList.push(parseWorkbookToJson(workbook))

            } else {
                console.error("文件读取结果不是 ArrayBuffer 类型");
            }
        };

        reader.onerror = function (err) {
            console.error('文件读取失败:', err); // 捕获读取错误
        };

        reader.readAsArrayBuffer(item.raw); // 确保 item.raw 存在并且为 Blob
    });

    fileListJson.value = jsonList

    renderData(jsonList)
    
};

const parseWorkbookToJson = (workbook: WorkBook) => {
    const obj: WorkbookJson = {
        SheetNames: workbook.SheetNames,
        Sheets: {},
    };

    workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const sheetData = utils.sheet_to_json(sheet);
        obj.Sheets[sheetName] = sheetData; // 现在可以安全地为 Sheets 添加属性
    });

    return obj;
};


// EditTableRef
const EditTableRef = ref()
const renderData = (filejson: WorkbookJson[]) => {
    console.log(filejson, 'filejson');

    filejson.forEach(element => {
        element.SheetNames.forEach(sheetName => {
            console.log(EditTableRef.value, 'EditTableRef.value');
            EditTableRef.value.openJson(element.Sheets[sheetName], sheetName)
            
        })
    });
    
}
const changeData = () => {
    
}
</script>

<style lang="scss" scoped></style>