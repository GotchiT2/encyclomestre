import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const directory = new URL('../docs/contracts/', import.meta.url);
mkdirSync(directory, { recursive: true });
const target = new URL('api.openapi.json', directory);
if (process.argv[2])
	writeFileSync(
		target,
		JSON.stringify(
			JSON.parse(readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, '')),
			null,
			2
		) + '\n'
	);
const document = JSON.parse(readFileSync(target, 'utf8'));
function type(schema) {
	if (schema.$ref) return `ApiSchemas[${JSON.stringify(schema.$ref.split('/').at(-1))}]`;
	if (schema.enum) return schema.enum.map(JSON.stringify).join(' | ');
	if (schema.type === 'array') return `Array<${type(schema.items)}>`;
	if (schema.type === 'object') {
		if (schema.additionalProperties)
			return `Record<string, ${typeof schema.additionalProperties === 'object' ? type(schema.additionalProperties) : 'unknown'}>`;
		return (
			'{ ' +
			Object.entries(schema.properties ?? {})
				.map(
					([key, value]) =>
						`${JSON.stringify(key)}${schema.required?.includes(key) ? '' : '?'}: ${type(value)}`
				)
				.join('; ') +
			' }'
		);
	}
	return (
		{ integer: 'number', number: 'number', string: 'string', boolean: 'boolean' }[schema.type] ??
		'unknown'
	);
}
writeFileSync(
	new URL('../src/lib/api/schema.ts', import.meta.url),
	'// Generated from docs/contracts/api.openapi.json. Run node scripts/generate-api-contract.mjs.\nexport interface ApiSchemas {\n' +
		Object.entries(document.components.schemas)
			.map(([name, schema]) => `  ${JSON.stringify(name)}: ${type(schema)};`)
			.join('\n') +
		'\n}\n'
);
console.log(`Generated ${Object.keys(document.components.schemas).length} API schemas.`);
