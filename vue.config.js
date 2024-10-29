const { defineConfig } = require('@vue/cli-service')
// 以下依赖在node版本较低时启动项目会报错  推荐使用（18.16.0）
const AutoImport = require('unplugin-auto-import/webpack')
const Components = require('unplugin-vue-components/webpack')
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers')
module.exports = defineConfig({
  transpileDependencies: true,

  // webpack配置选项
  configureWebpack: {
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ]
  },
  devServer: {
    client: {
      overlay: false, // 当出现编译错误或警告时，在浏览器中显示全屏覆盖。
    }
  },
  
})
