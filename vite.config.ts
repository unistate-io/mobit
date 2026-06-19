import {defineConfig} from "vite"
import react from "@vitejs/plugin-react-swc"
import {nodePolyfills} from "vite-plugin-node-polyfills"
import tailwindcss from "@tailwindcss/vite"
import {fileURLToPath, URL} from "node:url"

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        // The CKB/BTC/RGB++ SDKs (lumos, @ckb-ccc, @rgbpp-sdk, mobit-sdk, @spore-sdk) assume
        // Node globals and builtins; polyfill them for the browser bundle.
        nodePolyfills({
            globals: {Buffer: true, process: true, global: true},
            protocolImports: true
        })
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
        }
    },
    build: {
        // Several CKB/BTC deps (and lodash) mix ESM `import` with CJS `require`;
        // without this Rollup leaves the `require` calls intact and they throw
        // "require is not defined" at runtime in the browser.
        commonjsOptions: {
            transformMixedEsModules: true
        }
    },
    server: {
        port: 3000
    }
})
