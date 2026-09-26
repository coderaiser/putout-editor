import {
    createPutoutEditor,
    EDITOR_CODE,
    EDITOR_SOURCE,
    EDITOR_TRANSFORM,
} from '#e2e/desktop';
import {
    test,
    expect,
    type Page,
} from './test.ts';

const getSourceCode = async (page: Page) => {
    const editor = createPutoutEditor(page);
    const {read} = await editor.get(EDITOR_SOURCE);
    
    return read();
};

const getTransformCode = async (page: Page) => {
    const editor = createPutoutEditor(page);
    const {read} = await editor.get(EDITOR_TRANSFORM);
    
    return read();
};

const getCodeOutput = async (page: Page) => {
    const editor = createPutoutEditor(page);
    const {read} = await editor.get(EDITOR_CODE);
    
    return read();
};

const openSnippet = (page: Page) => page
    .getByTestId('toolbar')
    .getByRole('button', {
        name: 'Snippet',
        exact: true,
    })
    .click();

const openNew = async (page: Page) => {
    await openSnippet(page);
    await page
        .getByTestId('new-menu')
        .locator(':scope > span')
        .click();
};

const closeNew = (page: Page) => page
    .getByTestId('new-menu')
    .locator(':scope > span')
    .click();

const pickTemplate = async (page: Page, label: string) => {
    await openNew(page);
    await page
        .getByTestId('new-submenu')
        .getByRole('menuitem', {
            name: label,
        })
        .click();
};

test('snippet: New submenu lists 13 plugin templates', async ({page}) => {
    await openNew(page);
    const items = page
        .getByTestId('new-submenu')
        .getByRole('menuitem');
    
    // 13 categories, no Default
    await expect(items).toHaveCount(13);
});

test('snippet: New Replacer inserts ternary template', async ({page}) => {
    await pickTemplate(page, 'Replacer');
    
    expect(await getTransformCode(page)).toContain('convert-ternary-to-if');
});

test('snippet: New → Traverser inserts merge-duplicate-imports', async ({page}) => {
    await pickTemplate(page, 'Traverser');
    expect(await getTransformCode(page)).toContain('merge-duplicate-imports');
});

test('snippet: New → Declarator inserts declare export', async ({page}) => {
    await pickTemplate(page, 'Declarator');
    expect(await getTransformCode(page)).toContain('export const declare');
});

test('snippet: New → Scanner inserts scan export', async ({page}) => {
    await pickTemplate(page, 'Scanner');
    expect(await getTransformCode(page)).toContain('export const scan');
});

test('snippet: New → JSON inserts __json', async ({page}) => {
    await pickTemplate(page, 'JSON');
    expect(await getTransformCode(page)).toContain('__json');
});

test('snippet: New → YAML inserts __yaml', async ({page}) => {
    await pickTemplate(page, 'YAML');
    expect(await getTransformCode(page)).toContain('__yaml');
});

test('snippet: New → Docker inserts __docker', async ({page}) => {
    await pickTemplate(page, 'Docker');
    expect(await getTransformCode(page)).toContain('__docker');
});

test('snippet: New → Ignore inserts __ignore', async ({page}) => {
    await pickTemplate(page, 'Ignore');
    expect(await getTransformCode(page)).toContain('__ignore');
});

test('snippet: New → Replacer sets source to ternary fixture', async ({page}) => {
    await pickTemplate(page, 'Replacer');
    
    const source = await getSourceCode(page);
    expect(source).toContain('?');
});

test('snippet: New → Traverser sets source to duplicate imports fixture', async ({page}) => {
    await pickTemplate(page, 'Traverser');
    
    const source = await getSourceCode(page);
    expect(source).toContain(`import {a} from 'x'`);
});

test('snippet: New → JSON sets source to json processor fixture', async ({page}) => {
    await pickTemplate(page, 'JSON');
    
    const source = await getSourceCode(page);
    expect(source).toContain('__putout_processor_json');
});

test('snippet: New → Declarator sets source to putout call fixture', async ({page}) => {
    await pickTemplate(page, 'Declarator');
    
    const source = await getSourceCode(page);
    expect(source).toContain('putout(source');
});

test('snippet: New trigger is left-aligned like other dropdown items', async ({page}) => {
    // NewButton is nested inside the Snippet dropdown, hidden until opened
    await openSnippet(page);
    
    const trigger = page
        .getByTestId('new-menu')
        .locator(':scope > span');
    
    await expect(trigger).toBeVisible();
    
    const justifyContent = await trigger.evaluate((el) => getComputedStyle(el).justifyContent);
    
    expect(justifyContent).toBe('flex-start');
});

test('snippet: New submenu opens on click not hover', async ({page}) => {
    await openNew(page);
    await expect(page.getByTestId('new-submenu')).toBeVisible();
});

test('snippet: New submenu closes on second click', async ({page}) => {
    await openNew(page);
    await page
        .getByTestId('new-menu')
        .locator(':scope > span')
        .click();
    await expect(page.getByTestId('new-submenu')).toBeHidden();
});

test('snippet: New submenu closes when clicking outside', async ({page}) => {
    await openNew(page);
    await page
        .getByRole('heading', {
            name: '🐊Putout Editor',
        })
        .click();
    await expect(page.getByTestId('new-submenu')).toBeHidden();
});

test('snippet: New submenu selection is undoable', async ({page}) => {
    const editor = createPutoutEditor(page);
    const before = await (await editor.get(EDITOR_TRANSFORM)).read();
    
    await pickTemplate(page, 'Declarator');
    
    const after = await getTransformCode(page);
    
    expect(after).not.toBe(before);
    
    await page
        .getByTestId(EDITOR_TRANSFORM)
        .locator('.cm-content')
        .click();
    await page.keyboard.press('ControlOrMeta+Z');
    
    const undone = await getTransformCode(page);
    
    expect(undone).toBe(before);
});

test('snippet: Replacer produces transformed output', async ({page}) => {
    await pickTemplate(page, 'Replacer');
    expect(await getCodeOutput(page)).toContain(`if ('Transform your code with 🐊Putout')`);
});

test('snippet: Includer removes empty method from output', async ({page}) => {
    await pickTemplate(page, 'Includer');
    expect(await getCodeOutput(page)).toContain('greetWithName');
});

test('snippet: Traverser merges duplicate imports in output', async ({page}) => {
    await pickTemplate(page, 'Traverser');
    expect(await getCodeOutput(page)).toContain('import {a, b}');
});

test('snippet: Declarator inserts missing import in output', async ({page}) => {
    await pickTemplate(page, 'Declarator');
    expect(await getCodeOutput(page)).toContain(`import putout from 'putout'`);
});

test('snippet: Scanner produces filesystem output', async ({page}) => {
    await pickTemplate(page, 'Scanner');
    expect(await getCodeOutput(page)).toContain('__putout_processor_filesystem');
});

test('snippet: Finder removes duplicate value in output', async ({page}) => {
    await pickTemplate(page, 'Finder');
    expect(await getCodeOutput(page)).toContain('const z = 2');
});

test('snippet: JSON removes duplicate keyword in output', async ({page}) => {
    await pickTemplate(page, 'JSON');
    expect(await getCodeOutput(page)).toContain('["putout", "codemod"]');
});

test('snippet: YAML removes empty needs in output', async ({page}) => {
    await pickTemplate(page, 'YAML');
    expect(await getCodeOutput(page)).toContain('"runs-on": "ubuntu-latest"');
});

test('snippet: TOML removes empty dependencies in output', async ({page}) => {
    await pickTemplate(page, 'TOML');
    expect(await getCodeOutput(page)).toContain('__putout_processor_toml({})');
});

test('snippet: Markdown removes trailing heading spaces in output', async ({page}) => {
    await pickTemplate(page, 'Markdown');
    expect(await getCodeOutput(page)).toContain(`heading(2, 'Hello World')`);
});

test('snippet: CSS replaces rgb with a var reference', async ({page}) => {
    await pickTemplate(page, 'CSS');
    expect(await getCodeOutput(page)).toContain(`functionValue('var', ['--shadow-color'])`);
});

test('snippet: Docker converts MAINTAINER in output', async ({page}) => {
    await pickTemplate(page, 'Docker');
    expect(await getCodeOutput(page)).toContain('"LABEL"');
});

test('snippet: Ignore fixes lock extension in output', async ({page}) => {
    await pickTemplate(page, 'Ignore');
    expect(await getCodeOutput(page)).toContain('"*.lock"');
});

test('snippet: Snippet menu closes after picking template', async ({page}) => {
    await pickTemplate(page, 'Replacer');
    await expect(page.getByTestId('snippet-menu')).toBeHidden();
});

test('snippet: New submenu closes after picking template', async ({page}) => {
    await pickTemplate(page, 'Replacer');
    await expect(page.getByTestId('new-submenu')).toBeHidden();
});

test('snippet: New trigger second click hides submenu', async ({page}) => {
    await openNew(page);
    await closeNew(page);
    await expect(page.getByTestId('new-submenu')).toBeHidden();
});

test('snippet: New trigger second click keeps Snippet menu open', async ({page}) => {
    await openNew(page);
    await closeNew(page);
    await expect(page.getByTestId('snippet-menu')).toBeVisible();
});

test('snippet: New trigger icon aligns with Save button icon', async ({page}) => {
    await openSnippet(page);
    
    const newIcon = page
        .getByTestId('new-menu')
        .locator(':scope > span > svg')
        .first();
    
    const saveIcon = page
        .getByTestId('snippet-menu')
        .locator('button:has-text("Save") > svg')
        .first();
    
    const newBox = await newIcon.boundingBox();
    const saveBox = await saveIcon.boundingBox();
    
    expect(Math.abs(newBox!.x - saveBox!.x)).toBeLessThan(1);
});

test('snippet: Snippet items are pushed below the open New submenu', async ({page}) => {
    await openNew(page);
    
    const submenu = await page
        .getByTestId('new-submenu')
        .boundingBox();
    
    const save = await page
        .getByTestId('snippet-menu')
        .locator('button:has-text("Save")')
        .boundingBox();
    
    expect(save!.y).toBeGreaterThanOrEqual(submenu!.y + submenu!.height);
});

test('snippet: Save stays clickable under the open New submenu', async ({page}) => {
    await openNew(page);
    
    const box = await page
        .getByTestId('snippet-menu')
        .locator('button:has-text("Save")')
        .boundingBox();
    
    const topmost = await page.evaluate(({x, y}) => document.elementFromPoint(x, y)?.textContent?.trim() || '', {
        x: box!.x + box!.width / 2,
        y: box!.y + box!.height / 2,
    });
    
    expect(topmost).toBe('Save');
});

test('snippet: Parser menu replaces Snippet menu', async ({page}) => {
    await openSnippet(page);
    const parser = page
        .getByTestId('toolbar')
        .locator('span[role="button"]')
        .filter({
            hasText: /babel/i,
        });
    
    await parser.click();
    await expect(parser).toHaveAttribute('aria-expanded', 'true');
});

test('snippet: Includer loads correct template text', async ({page}) => {
    await pickTemplate(page, 'Includer');
    expect(await getTransformCode(page)).toContain('export const include');
});

test('snippet: Finder loads correct template text', async ({page}) => {
    await pickTemplate(page, 'Finder');
    expect(await getTransformCode(page)).toContain('export const find');
});

test('snippet: TOML loads correct template text', async ({page}) => {
    await pickTemplate(page, 'TOML');
    expect(await getTransformCode(page)).toContain('__toml');
});

test('snippet: Markdown loads correct template text', async ({page}) => {
    await pickTemplate(page, 'Markdown');
    expect(await getTransformCode(page)).toContain('heading');
});

test('snippet: CSS loads correct template text', async ({page}) => {
    await pickTemplate(page, 'CSS');
    expect(await getTransformCode(page)).toContain('convert-rgb-to-var');
});

test('snippet: Scanner loads correct template text', async ({page}) => {
    await pickTemplate(page, 'Scanner');
    expect(await getTransformCode(page)).toContain('export const scan');
});
