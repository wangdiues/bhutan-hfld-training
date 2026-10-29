/**
 * Serves every file in scripts/gee/ at /scripts/<day>/<lesson>.js so lessons can offer a
 * "Download .js" link without copying the scripts into public/ (task M3-02).
 */
import type { APIRoute, GetStaticPaths } from 'astro';

const files = import.meta.glob('/scripts/gee/**/*.js', { query: '?raw', import: 'default', eager: true }) as Record<
	string,
	string
>;

export const getStaticPaths = (() =>
	Object.entries(files).map(([file, code]) => ({
		params: { path: file.replace('/scripts/gee/', '') },
		props: { code },
	}))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
	new Response(props.code as string, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
