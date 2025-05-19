<template>
    <div class="contactsSetting">
        <el-row :gutter="20" style="height: 100%; margin: 0;">
            <el-col :span="6" style="width: 100%; height: 100%;">
                <el-card style="width: 100%; height: 100%;" class="card-style-one">
                    <template #header>
                        <div class="card-header">
                            <span>联系人分组</span>
                        </div>
                    </template>

                    <el-scrollbar height="100%">
                        <el-radio-group v-model="selectedGroups" @change="handleGroupChange" class="radio-group">
                            <div v-for="group in groupList" :key="group.id" class="radio-item">
                                <el-radio :value="group.id" class="radio-style-tow">
                                    <div
                                        style="display: flex; width: 100%; justify-content: space-between; align-items: center;">
                                        <h4>{{ group.title }}</h4>
                                        <span>{{ group.userIds?.length }} / {{ userList.length }}</span>
                                        <div>
                                            <el-button type="primary" :icon="Edit" plain @click="editGroupName(group)"
                                                :disabled="+group.projectId === 1" size="small" />
                                            <el-popconfirm class="box-item" title="是否删除该组？" confirm-button-text="确定"
                                                cancel-button-text="取消" @confirm="deleteGroup(group)" placement="right">
                                                <template #reference>
                                                    <el-button type="danger" :icon="Delete" plain
                                                        :disabled="+group.projectId === 1" size="small" />
                                                </template>
                                            </el-popconfirm>

                                        </div>
                                    </div>
                                </el-radio>
                            </div>

                        </el-radio-group>
                        <div style="width: 100%; margin-top: 2rem;">
                            <el-button v-if="!addUserGroupFlag" :icon="Plus" plain style="width: 100%;"
                                @click="addUserGroupFlag = true">添加组</el-button>


                            <div v-else class="addUserGroupFlag">
                                <div class="addUserGroupFlag-row" style="margin-bottom: 10px;">
                                    <el-text type="primary" size="large">
                                        <el-icon>
                                            <CirclePlus />
                                        </el-icon>
                                        添加用户组:
                                    </el-text>
                                    <el-icon @click="addUserGroupFlag = false" class="textSty">
                                        <Close />
                                    </el-icon>
                                </div>
                                <div class="addUserGroupFlag-row">
                                    <el-form ref="ruleFormRef" style="max-width: 600px" :model="ruleForm" :rules="rules"
                                        label-width="auto">
                                        <el-form-item label="" prop="addUserGroupName">
                                            <el-input v-model.trim="ruleForm.addUserGroupName" placeholder="输入组名称" />
                                        </el-form-item>
                                    </el-form>
                                    <el-button style="margin-left: 10px" type="success"
                                        @click="addUserGroupFn">确定</el-button>
                                </div>
                            </div>
                        </div>
                    </el-scrollbar>
                </el-card>
            </el-col>
            <el-col :span="12" style="width: 100%; height: 100%;">
                <el-card style="width: 100%; height: 100%;" class="card-style-one">
                    <template #header>
                        <div class="card-header">
                            <span>联系人列表</span>

                            <el-input v-model="searchInput" style="width: 240px" placeholder="请输入姓名或用户编号"
                                :suffix-icon="Search" />
                        </div>
                    </template>
                    <el-table :data="userList" style="width: 100%; height: 100%;" ref="userTableRef" size="small"
                        class="table-style-one" row-key="userId" @selection-change="handleSelectionChange" border>
                        <el-table-column type="selection" :selectable="() => +selectedGroups !== 1" width="55"
                            :reserve-selection="true" />
                        <el-table-column prop="name" label="姓名" />
                        <el-table-column prop="lastLoginTime" label="最后登陆时间" />
                        <el-table-column label="编辑用户名">
                            <template #default="scope">
                                <el-button type="primary" size="small" @click="editUserName(scope.row)">编辑</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-col>
            <el-col :span="6" style="width: 100%; height: 100%;">
                <el-card style="width: 100%; height: 100%;" class="card-style-one">
                    <template #header>
                        <div class="card-header">
                            <span>已选择联系人</span>
                            <el-button type="primary" disabled size="small">保存</el-button>
                        </div>
                    </template>

                    <el-card style="margin-bottom: 20px;" v-for="groupItem in selectedGroupData" :key="groupItem.title"
                        class="card">
                        <template #header>
                            <div class="card-header">
                                <span>{{ groupItem.title }}</span>
                            </div>
                        </template>
                        <div>
                            <el-tag style="margin: 10px;" type="primary" v-for="item in groupItem.userList">{{
                                item.name }}</el-tag>
                        </div>
                    </el-card>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, nextTick, reactive } from 'vue';
import { Search, Delete, Plus, CirclePlus, Close, Edit } from '@element-plus/icons-vue'
import { useRoute } from "vue-router";
// import { getContactTreeData, getContactList, updateUserGroup, addUserGroup, deleteUserGroup } from '@/apis/equipMap'
// import { updateWxContactById } from "@/apis/userInfo"

const emits = defineEmits()
const route = useRoute();
const stateFullScreen = ref(true)
const close = () => {
    emits('close')
}

const searchInput = ref('') // 搜索框输入
const userList = ref<User[]>([
    { userId: 1, name: '张三', age: 20, createTime: '2022-01-01 12:00:00', lastLoginTime: '2022-04-10 14:00:00' },
    { userId: 2, name: '李四', age: 22, createTime: '2022-01-05 14:00:00', lastLoginTime: '2022-04-09 10:00:00' },
    { userId: 3, name: '王五', age: 25, createTime: '2022-01-10 10:00:00', lastLoginTime: '2022-04-08 16:00:00' },
    { userId: 4, name: '赵六', age: 28, createTime: '2022-01-15 16:00:00', lastLoginTime: '2022-04-07 12:00:00' },
    { userId: 5, name: '孙七', age: 21, createTime: '2022-01-20 12:00:00', lastLoginTime: '2022-04-06 14:00:00' },
    { userId: 6, name: '周八', age: 24, createTime: '2022-01-25 14:00:00', lastLoginTime: '2022-04-05 10:00:00' },
    { userId: 7, name: '吴九', age: 27, createTime: '2022-02-01 10:00:00', lastLoginTime: '2022-04-04 16:00:00' },
    { userId: 8, name: '郑十', age: 23, createTime: '2022-02-05 16:00:00', lastLoginTime: '2022-04-03 12:00:00' },
    { userId: 9, name: '何十一', age: 26, createTime: '2022-02-10 12:00:00', lastLoginTime: '2022-04-02 14:00:00' },
    { userId: 10, name: '冯十二', age: 29, createTime: '2022-02-15 14:00:00', lastLoginTime: '2022-04-01 10:00:00' },
    { userId: 11, name: '陈十三', age: 20, createTime: '2022-02-20 10:00:00', lastLoginTime: '2022-03-31 16:00:00' },
    { userId: 12, name: '刘十四', age: 22, createTime: '2022-02-25 16:00:00', lastLoginTime: '2022-03-30 12:00:00' },
    { userId: 13, name: '黄十五', age: 25, createTime: '2022-03-01 12:00:00', lastLoginTime: '2022-03-29 14:00:00' },
    { userId: 14, name: '徐十六', age: 28, createTime: '2022-03-05 14:00:00', lastLoginTime: '2022-03-28 10:00:00' },
    { userId: 15, name: '谢十七', age: 21, createTime: '2022-03-10 10:00:00', lastLoginTime: '2022-03-27 16:00:00' },
    { userId: 16, name: '叶十八', age: 24, createTime: '2022-03-15 16:00:00', lastLoginTime: '2022-03-26 12:00:00' },
    { userId: 17, name: '钟十九', age: 27, createTime: '2022-03-20 12:00:00', lastLoginTime: '2022-03-25 14:00:00' },
    { userId: 18, name: '程二十', age: 23, createTime: '2022-03-25 14:00:00', lastLoginTime: '2022-03-24 10:00:00' },
    { userId: 19, name: '余廿一', age: 26, createTime: '2022-04-01 10:00:00', lastLoginTime: '2022-03-23 16:00:00' },
]) // 联系人列表
const selectedGroups = ref<string[] | string | number | null>('')
const addUserGroupFlag = ref<Boolean>(false)
const ruleForm = ref({
    addUserGroupName: ''
})
const groupList = ref<Group[]>([
    { id: 1, title: 'Group 1', userIds: [1, 2, 3] },
    { id: 2, title: 'Group 2', userIds: [4, 5] },
    { id: 3, title: 'Group 3', userIds: [6, 7, 8] },
])
const getWxContactListFn = async () => {
    const contactTreeData = await getContactTreeData({
        projectId: route.query.pjid
    })

    const contactList = await getContactList({
        projectId: route.query.pjid as string
    })

    userList.value = contactList
    groupList.value = contactTreeData

    selectedGroups.value = contactTreeData[0].id // 默认选中第一个分组
    handleGroupChange()
}
// 获取联系人
// getWxContactListFn()

const selectedGroupData = computed(() => {
    const userMap = new Map(userList.value.map(user => [user.userId, user]))

    return groupList.value
        .filter(group => {
            // selected 是多选框就是数组，单选框就是字符串
            const selected = Array.isArray(selectedGroups.value) ? selectedGroups.value : [selectedGroups.value]
            return selected.includes(group.id)
        })
        .map(group => ({
            title: group.title,
            userList: group.userIds
                .map(userId => userMap.get(userId))
                .filter(Boolean) // 移除找不到的 user（防止异常）
        }))
})

const selectedUserIds = ref(new Set()) // 当前应选中的 userId 集合
const isProgrammaticChange = ref(false)
// 根据选中的分组生成应勾选的 userId 集合
const updateSelectedUserIds = () => {

    // selected 是多选框就是数组，单选框就是字符串
    let selected = Array.isArray(selectedGroups.value) ? selectedGroups.value : [selectedGroups.value]

    let commonUserIds = new Set()

    // 收集交集
    const selectedGroupLists = groupList.value
        .filter(group => selected.includes(group.id))
        .map(group => new Set(group.userIds))

    if (selectedGroupLists.length > 0) {
        // 初始化为第一个分组的用户列表
        commonUserIds = new Set(selectedGroupLists[0])

        // 对剩下的分组取交集
        for (let i = 1; i < selectedGroupLists.length; i++) {
            commonUserIds = new Set([...commonUserIds].filter(id => selectedGroupLists[i].has(id)))
        }
    }
    selectedUserIds.value = commonUserIds

    lastSelectedUserIds.value = commonUserIds // 更新记录

}

const userTableRef = ref()
// 当选中分组变化时，更新 userIds，并同步到 el-table
const handleGroupChange = () => {
    // 1. 计算所有分组中包含的用户 id
    updateSelectedUserIds()

    isProgrammaticChange.value = true // 👈 设置为程序触发

    // 2. 清空 el-table 的所有选中项，并选中这些 userId 对应的用户
    nextTick(() => {
        userTableRef.value.clearSelection()

        userList.value.forEach(user => {
            if (selectedUserIds.value.has(user.userId)) {
                userTableRef.value.toggleRowSelection(user, true)
            }
        })

        // 👇 下一 tick 再恢复监听（避免同步误触发）
        nextTick(() => {
            isProgrammaticChange.value = false
        })
    })
}

const lastSelectedUserIds = ref(new Set())
// 可选：监听用户手动取消选中表格行的操作（保持同步）
const handleSelectionChange = (currentRows: User[]) => {
    if (isProgrammaticChange.value) return // ❌ 阻止非用户触发的变化

    const currentIds = new Set(currentRows.map(row => row.userId))

    const added = [...currentIds].filter(id => !lastSelectedUserIds.value.has(id))
    const removed = [...lastSelectedUserIds.value].filter(id => !currentIds.has(id))

    // 同步操作分组 userList
    groupList.value.forEach(group => {
        let selected = Array.isArray(selectedGroups.value) ? selectedGroups.value : [selectedGroups.value]
        if (selected.includes(group.id)) {
            // 新增用户：加到 group.userList 中（去重）
            added.forEach(id => {
                if (!group.userIds.includes(id)) {
                    group.userIds.push(id)
                }
            })
            // 移除用户：从 group.userList 中删掉
            removed.forEach(id => {
                const idx = group.userIds.indexOf(id)
                if (idx !== -1) {
                    group.userIds.splice(idx, 1)
                }
            })

            // 调用接口后端保存
            saveGroupUserList(group.id, group.userIds)
        }
    })

    // 通过接口更新

    // 更新记录
    lastSelectedUserIds.value = currentIds
}

const saveGroupUserList = async (groupId, userIds) => {
    await updateUserGroup({
        projectId: route.query.pjid,
        id: groupId,
        userIds
    })
}

const ruleFormRef = ref()
const rules = reactive({
    addUserGroupName: [
        { required: true, message: '请输入组名称', trigger: 'blur' },
        { min: 2, max: 10, message: '长度在 2 到 10 个字符之间', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (groupList.value.some(group => group.groupName === value)) {
                    callback(new Error('组名称已存在'))
                } else {
                    callback()
                }
            }, trigger: 'blur'
        }
    ]
})
const addUserGroupFn = () => {
    ruleFormRef.value.validate((valid) => {
        if (!valid) {
            return false
        } else {
            // addUserGroup({
            //     projectId: route.query.pjid,
            //     groupName: ruleForm.value.addUserGroupName,
            //     userIds: []
            // }).then((res) => {
            //     groupList.value.push(res)
            //     addUserGroupFlag.value = false
            //     ruleFormRef.value.resetFields()
            // }).catch((err) => {
            //     console.error(err)
            // })
        }
    })
}

// 删除分组
const deleteGroup = async (group) => {
    // await deleteUserGroup({id: group.id})

    groupList.value = groupList.value.filter(item => item.id !== group.id)
    // 删除选中分组的逻辑处理
    if (selectedGroups.value === group.id) {
        selectedGroups.value = null
        userTableRef.value.clearSelection()
    }
}

// 编辑分组名称
const editGroupName = (group) => {
    // 这里可以弹出一个对话框，允许用户输入新的组名
    ElMessageBox.prompt('请输入组名称', `修改${group.groupName}组名称`, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValidator: (value) => {
            if (!value.trim()) {
                return '组名称不能为空'
            }
            if (groupList.value.some(item => item.groupName === value)) {
                return '组名称已存在'
            } else {
                return true
            }
        }
    })
        .then(({ value }) => {
            // const res = await updateUserGroup({
            //     projectId: route.query.pjid,
            //     id: group.id,
            //     groupName: value,
            // })

            // if (!res) return ElMessage.error('修改失败')
            groupList.value = groupList.value.map(item => {
                if (item.id === group.id) {
                    item.groupName = value
                }
                return item
            })

        })
}

const editUserName = (data) => {
    ElMessageBox.prompt(`正在修改${data.name}的用户名，请输入新的名称`, '修改用户名', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern:
            /^[a-zA-Z\u4E00-\u9FA50-9]{2,12}$/,
        inputErrorMessage: '请输入字母、汉字.数字4到12个字符之间',
    })
        .then(({ value }) => {
            // updateWxContactById({
            //     userId: data.userId,
            //     realName: value
            // }).then(res => {
            //     // 修改成功
            //     userList.value = userList.value.map(item => {
            //         if (item.userId === data.userId) {
            //             item.name = value
            //         }
            //         return item
            //     })
            //     ElMessage({
            //         type: 'success',
            //         message: `用户名修改成功:${value}`,
            //     })

            // })

        })
}
</script>

<style scoped lang="less">
.contactsSetting {
    width: 100%;
    height: 100%;
    padding-bottom: 10px;

    .radio-group {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;

        .radio-item {
            width: 100%;
        }
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .addUserGroupFlag {

        padding: 1rem;
        border: 2px dashed var(--el-border-color);
        border-radius: 4px;

        .addUserGroupFlag-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    }
}
</style>
