import esbuild from 'esbuild';

(async () => {
	// Build the iframe app from TypeScript into a plain browser script.
	await esbuild.build({
		entryPoints: ['iframe/src/app.ts'],
		outfile: 'iframe/app.js',
		bundle: false,
		minify: false,
		sourcemap: false,
		platform: 'browser',
		target: ['es2019'],
	});
})();

