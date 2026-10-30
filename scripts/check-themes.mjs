// Axe scan of chosen pages in BOTH themes, plus a keyboard run through any quiz, failing on
// console errors. pa11y-ci (CI) only scans the default theme.
//
// Usage: npx astro preview --port 4321 &   then
//        node scripts/check-themes.mjs /about/components/ /reference/glossary/
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const origin = process.env.SITE ?? 'http://localhost:4321/bhutan-hfld-training';
const paths = process.argv.slice(2);
if (paths.length === 0) paths.push('/');

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
let failures = 0;

for (const path of paths) {
	for (const theme of ['light', 'dark']) {
		const page = await browser.newPage();
		const errors = [];
		page.on('pageerror', (e) => errors.push(e.message));
		page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
		await page.evaluateOnNewDocument((t) => localStorage.setItem('starlight-theme', t), theme);
		await page.setViewport({ width: 1280, height: 900 });
		await page.goto(origin + path, { waitUntil: 'networkidle0' });

		// Open every <details> so hidden content is scanned too.
		await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));

		// Keyboard quiz run: Tab to the first radio of each question, Space to pick it, submit.
		const quizzes = await page.$$('hfld-quiz');
		for (const quiz of quizzes) {
			const radios = await quiz.$$('fieldset input[type=radio]:first-of-type');
			for (const r of radios) {
				await r.focus();
				await page.keyboard.press('Space');
			}
			await (await quiz.$('button[type=submit]')).focus();
			await page.keyboard.press('Enter');
			const status = await quiz.$eval('[role=status]', (el) => el.textContent);
			if (!/You got \d+ of \d+/.test(status)) errors.push(`quiz did not report a score: "${status}"`);
		}

		// Keyboard slide-deck run: focus the stage, then ArrowRight, End, Home must move the counter.
		const decks = await page.$$('hfld-slides');
		for (const deck of decks) {
			const total = Number(await deck.evaluate((el) => el.dataset.total));
			const current = () => deck.$eval('[data-current]', (el) => Number(el.textContent));
			await (await deck.$('.hfld-slides__stage')).focus();
			const steps = [['ArrowRight', Math.min(2, total)], ['End', total], ['PageUp', Math.max(1, total - 1)], ['Home', 1]];
			for (const [key, want] of steps) {
				await page.keyboard.press(key);
				const got = await current();
				if (got !== want) errors.push(`slide deck: ${key} gave slide ${got}, expected ${want}`);
			}
			const visible = await deck.$$eval('.hfld-slides__slide:not([hidden])', (els) => els.length);
			if (visible !== 1) errors.push(`slide deck shows ${visible} slides at once`);
		}

		await page.addScriptTag({ content: axeSource });
		const result = await page.evaluate(() =>
			// eslint-disable-next-line no-undef
			axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }),
		);
		const issues = result.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(' ')}`));
		const ok = issues.length === 0 && errors.length === 0;
		failures += ok ? 0 : 1;
		console.log(`${ok ? 'ok  ' : 'FAIL'} ${path} [${theme}] axe ${issues.length}, console errors ${errors.length}, quizzes ${quizzes.length}, decks ${decks.length}`);
		for (const line of [...issues, ...errors]) console.log(`     ${line}`);
		await page.close();
	}
}

await browser.close();
process.exit(failures ? 1 : 0);
