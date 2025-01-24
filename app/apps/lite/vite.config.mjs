import vue from '@vitejs/plugin-vue2'
import 'stream-browserify'
import 'timers-browserify'
import { fileURLToPath, URL } from 'url'
import 'util'
import { defineConfig, loadEnv } from 'vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

function resolveURL(dir, subpath = '') {
  subpath = subpath.replace(/^('|\s+|'|-e)$/gm, '') // Remove single quote, space, -e
  const resolved = fileURLToPath(new URL(dir.concat(subpath), import.meta.url))
  return resolved
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const theme = env.VITE_APP_THEME_PATH || 'default'
  const port = env.PORT || 9529
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            whitespace: 'preserve'
          }
        }
      }),
      createSvgIconsPlugin({
        iconDirs: [resolveURL('src/icons')],
        symbolId: 'icon-[dir]-[name]'
      })
    ],
    server: {
      port: port,
      open: true,
      proxy: {
        '/prod-api': {
          target: env.VITE_APP_WS_API,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/prod-api/, '')
        },
        '/socket.io/': {
          target: env.VITE_APP_WS_API,
          ws: true,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/prod-api/, '')
        }
      },
      warmup: {
        clientFiles: ['./index.html', './src/{views, components}/*']
      }
    },
    resolve: {
      alias: [
        { find: '@', replacement: resolveURL('src') },
        { find: '@theme', replacement: resolveURL('src/styles/theme/', theme) },
        { find: 'path', replacement: 'path-browserify' },
        { find: '@shared', replacement: resolveURL('../shared/src') },
        // Vite + Element UI: https://github.com/vitejs/vite-plugin-vue2/issues/16
        { find: 'vue', replacement: 'vue/dist/vue.esm.js' },
        { find: 'stream', replacement: 'stream-browserify' },
        { find: 'timers', replacement: 'timers-browserify' },
        { find: 'util', replacement: 'util/' },
        { find: 'styles', replacement: resolveURL('src/styles') },
        { find: '@tailwind', replacement: resolveURL('./tailwind.config.js') }
      ],
      extensions: ['.mjs', '.js', '.ts', '.json', '.vue']
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'static',
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 500,
      sourcemap: 'hidden',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          defaults: false,
          unused: true,
          dead_code: true,
          passes: 2
        },
        output: {
          beautify: false,
          comments: false
        }
      },
      rollupOptions: {
        onwarn: () => {

        },
        output: {
          assetFileNames: ({ name }) => {
            if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
              return 'static/images/[name][extname]'
            } else if (/\.css$/.test(name ?? '')) {
              return 'static/css/[name]-[hash][extname]'
            } else if (/\.(woff|woff2|eot|ttf)$/.test(name ?? '')) {
              return 'static/fonts/[name]-[hash][extname]'
            }
            // default value
            // ref: https://rollupjs.org/guide/en/#outputassetfilenames
            return 'static/[name]-[hash][extname]'
          },
          // https://stackoverflow.com/questions/69260715/skipping-larger-chunks-while-running-npm-run-build
          manualChunks(id) {
            if (id.includes('node_modules/.pnpm')) {
              // Only for pnpm
              return id.toString().split('.pnpm/')[1].split('/')[0].toString()
            } else if (id.includes('node_modules')) {
              return id
                .toString()
                .split('node_modules/')[1]
                .split('/')[0]
                .toString()
            }
          }
        }
      }
    }
  }
})
