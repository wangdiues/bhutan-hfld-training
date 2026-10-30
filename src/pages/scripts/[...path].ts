/**
 * Serves every script in scripts/gee/ at /scripts/<day>/<file> (.js for the Code Editor, .py for
 * the geemap versions) so lessons and the script library can offer downloads without copying the
 * scripts into public/ (tasks M3-02, M4-34).
 */
import type { APIRoute, GetStaticPaths } from 'astro';

const files = import.meta.glob('/scripts/gee/**/*.{js,py}', { query: '?raw', import: 'default', eager: true }) as Record<
	string,
	string
>;

export const getStaticPaths = (() =>
	Object.entries(files).map(([file, code]) => ({
		params: { path: file.replace('/scripts/gee/', '') },
		props: { code, python: file.endsWith('.py') },
	}))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
	new Response(props.code as string, {
		headers: { 'Content-Type': `${props.python ? 'text/x-python' : 'text/javascript'}; charset=utf-8` },
	});
