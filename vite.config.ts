import {defineConfig, loadEnv} from "vite"
import react from "@vitejs/plugin-react-swc"
import {nodePolyfills} from "vite-plugin-node-polyfills"
import {fileURLToPath, URL} from "node:url"

// https://vite.dev/config/
export default defineConfig(({mode}) => {
    // Keep the app's existing process.env.REACT_APP_* usage working under Vite
    // (and keep the existing Vercel REACT_APP_* secrets) by inlining them via
    // define. loadEnv pulls REACT_APP_* from .env files and the build env.
    const env = loadEnv(mode, process.cwd(), "REACT_APP_")
    const reactAppDefines = Object.fromEntries(
        ["MARKET_API", "COINGECKO_API_KEY", "UTXO_SWAP_KEY", "ALCHEMY_API_KEY"].map(name => [
            `process.env.REACT_APP_${name}`,
            JSON.stringify(env[`REACT_APP_${name}`] ?? "")
        ])
    )

    return {
        plugins: [
            react(),
            // Tailwind v3 runs via postcss.config.js (Vite's native PostCSS step).
            // The CKB/BTC/RGB++ SDKs (ccc, @rgbpp-sdk, mobit-sdk, @spore-sdk,
            // transitive lumos) assume Node globals/builtins; polyfill for the browser.
            nodePolyfills({
                globals: {Buffer: true, process: true, global: true},
                protocolImports: true
            })
        ],
        define: reactAppDefines,
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url))
            }
        },
        build: {
            // Several deps (and lodash) mix ESM import with CJS require; without this
            // Rollup leaves require() intact and it throws at runtime in the browser.
            commonjsOptions: {
                transformMixedEsModules: true
            }
        },
        server: {
            port: 3000
        }
    }
})
