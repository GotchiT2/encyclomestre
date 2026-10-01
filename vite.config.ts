import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'node:fs';

export default defineConfig({
	server: {
		// Turnstile autorise le domaine local dédié, associé à 127.0.0.1 sur le poste.
		host: 'dev.wikiforge.fr',
		port: 443,
		strictPort: true,
		allowedHosts: ['dev.wikiforge.fr'],
		proxy: {
			'/api': {
				target: 'http://localhost:8080',
				changeOrigin: true
			}
		},
		https: {
			key: fs.readFileSync('dev.wikiforge.fr+1-key.pem'),
			cert: fs.readFileSync('dev.wikiforge.fr+1.pem')
		}
	},
	preview: {
		proxy: {
			'/api': {
				target: 'http://localhost:8080',
				changeOrigin: true
			}
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Nginx serves the production frontend. This fallback lets client-side
			// routes work when visitors reload a non-root URL.
			adapter: adapter({ fallback: 'index.html' })
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
