import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue'; // Vue 插件
import path from 'path'; // Node.js 路径模块
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './', // 用于相对路径部署，防止资源 404
    // 插件配置
    plugins: [
      vue(), // Vue 插件
      AutoImport({
        resolvers: [ElementPlusResolver()],
        dts: 'src/auto-imports.d.ts', // ✅ 自动生成 ElMessage 类型声明
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts', // ✅ 自动生成组件类型声明（推荐加上）
      }),
    ],

    // 开发服务器配置
    server: {
      // port: 3000, // 端口号
      host: true, // 👈 允许通过局域网访问（0.0.0.0）
      open: true, // 自动打开浏览器
      proxy: { // 代理配置
      },
      cors: true, // 启用 CORS
      hmr: { // 热模块替换配置
        overlay: true,
      },
    },

    // 构建配置
    build: {
      outDir: 'dist', // 输出目录
      assetsDir: 'static', // 静态资源目录
      sourcemap: true, // 生成 sourcemap
      minify: 'esbuild', // 代码压缩工具
      // terserOptions: { // Terser 配置
      //   compress: {
      //     drop_console: true, // 移除 console.log
      //     drop_debugger: true, // 移除 debugger
      //   },
      // },
      rollupOptions: { // Rollup 配置
        output: {
          manualChunks: { // 手动分块
            vendor: ['vue', 'vue-router', 'axios'], // 第三方库单独打包
          },
        },
      },
    },

    // 路径别名
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // 路径别名
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'], // 自动解析扩展名
    },

    // CSS 配置
    css: {
      preprocessorOptions: { // 预处理器配置
        less: {
          modifyVars: { // 修改 Less 变量
            // 'primary-color': '#1890ff',
          },
          javascriptEnabled: true,
        },
      },
      modules: { // CSS Modules 配置
        localsConvention: 'camelCase',
      },
    },

    // 环境变量配置
    envPrefix: 'VITE_', // 环境变量前缀

    // 优化配置
    optimizeDeps: {
      include: ['vue', 'vue-router', 'axios'], // 预构建依赖
      exclude: [], // 排除依赖
    },
  };
});
