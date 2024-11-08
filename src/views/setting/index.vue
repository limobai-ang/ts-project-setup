<template>
    <div>
        <div style="display: flex; justify-content: space-between;">
            <el-upload ref="uploadRef" action="#" :auto-upload="false" :before-upload="beforeUpload" multiple
                :show-file-list="false" :on-change="handleFileChange" :on-remove="removeFile">
                <template #trigger>
                    <el-button type="primary">选择文件</el-button>
                </template>
            </el-upload>

            <el-button type="primary" @click="exportJson">导出json</el-button>
        </div>

        <div>
            <el-tag v-for="tag in fileList" :key="tag.uid" closable :type="tag.uid === activeFile?.uid ? 'success' : 'primary'">
                {{ tag.name }}
            </el-tag>
        </div>

        <div style="height: 80vh;">
            <editTable ref="EditTableRef" @changeData="changeData" />
        </div>

    </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { UploadInstance, UploadFile, UploadFiles, UploadRawFile } from 'element-plus'
import { read, writeFileXLSX, utils, WorkBook } from "xlsx";
import editTable from '@/components/editTable/index.vue'
const uploadRef = ref<UploadInstance>()

const fileList = ref<UploadFiles>([])
const activeFile = ref<UploadFile | null>(null)


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

    if(fileList.value.length) {
        activeFile.value = fileList.value[0]
    
    }
    
    readFile()
}

const removeFile = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    handleFileChange(uploadFile, uploadFiles)
}


const readFile = async () => {
    const jsonList: WorkbookJson[] = [];
    const promises = fileList.value.map((item) => {
        return new Promise<void>((resolve, reject) => {
            if (!item.raw) {
                console.error("文件数据不存在或格式错误:", item);
                return resolve();
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                const result = e.target?.result;

                if (result && result instanceof ArrayBuffer) {
                    const data = new Uint8Array(result);
                    const workbook = read(data, { type: 'array' });
                    jsonList.push(EditTableRef.value.utils.stox(workbook));
                } else {
                    console.error("文件读取结果不是 ArrayBuffer 类型");
                }
                resolve();
            };

            reader.onerror = (err) => {
                console.error('文件读取失败:', err);
                reject(err);
            };

            reader.readAsArrayBuffer(item.raw);
        });
    });

    // 等待所有文件读取完成
    await Promise.all(promises);
    fileListJson.value = jsonList;
    renderData(jsonList);
};

// EditTableRef
const EditTableRef = ref()
const renderData = (filejson: WorkbookJson[]) => {
    console.log(filejson, 'filejson');

    // EditTableRef.value.openJson(filejson)
}

const openFile = () => {
    EditTableRef.value.openFile()
}
const exportJson = () => {
    console.log(EditTableRef.value.exportJson(), 'sjon');

}
const changeData = () => {

}
</script>

<style lang="scss" scoped></style>