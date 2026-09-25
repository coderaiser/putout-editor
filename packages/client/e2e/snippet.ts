import {
    test,
    expect,
    type Page,
} from './test.ts';
import {
    createPutoutEditor,
    EDITOR_CODE,
    EDITOR_SOURCE,
    EDITOR_TRANSFORM,
} from './putout-editor.ts';

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

const getCodeOutput = (page: Page) => page
    .getByTestId(EDITOR_CODE)
    .locator('.cm-content');

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
    
    await expect(page.getByTestId(EDITOR_TRANSFORM)).toContainText('convert-ternary-to-if');
});

test('snippet: New → Traverser inserts merge-duplicate-imports', async ({page}) => {
    await pickTemplate(page, 'Traverser');
    await expect(page.getByTestId(EDITOR_TRANSFORM)).toContainText('merge-duplicate-imports');
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

test('snippet: New trigger is center-aligned like other toolbar items', async ({page}) => {
    // NewButton is nested inside the Snippet dropdown, hidden until opened
    await openSnippet(page);
    
    const trigger = page
        .getByTestId('new-menu')
        .locator(':scope > span');
    
    await expect(trigger).toBeVisible();
    
    const justifyContent = await trigger.evaluate((el) => getComputedStyle(el).justifyContent);
    
    expect(justifyContent).toBe('center');
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
    await expect(getCodeOutput(page)).toContainText('if (hello)');
});

test('snippet: Includer removes empty method from output', async ({page}) => {
    await pickTemplate(page, 'Includer');
    await expect(getCodeOutput(page)).toContainText('greetWithName');
});

test('snippet: Traverser merges duplicate imports in output', async ({page}) => {
    await pickTemplate(page, 'Traverser');
    await expect(getCodeOutput(page)).toContainText('import {a, b}');
});

test('snippet: Declarator inserts missing import in output', async ({page}) => {
    await pickTemplate(page, 'Declarator');
    await expect(getCodeOutput(page)).toContainText(`import putout from 'putout'`);
});

test('snippet: Scanner produces filesystem output', async ({page}) => {
    await pickTemplate(page, 'Scanner');
    await expect(getCodeOutput(page)).toContainText('__putout_processor_filesystem');
});

test('snippet: Finder removes duplicate value in output', async ({page}) => {
    await pickTemplate(page, 'Finder');
    await expect(getCodeOutput(page)).toContainText('const z = 2');
});

test('snippet: JSON removes duplicate keyword in output', async ({page}) => {
    await pickTemplate(page, 'JSON');
    await expect(getCodeOutput(page)).toContainText('["putout", "codemod"]');
});

test('snippet: YAML removes empty needs in output', async ({page}) => {
    await pickTemplate(page, 'YAML');
    await expect(getCodeOutput(page)).toContainText('"runs-on": "ubuntu-latest"');
});

test('snippet: TOML removes empty dependencies in output', async ({page}) => {
    await pickTemplate(page, 'TOML');
    await expect(getCodeOutput(page)).toContainText('__putout_processor_toml({})');
});

test('snippet: Markdown removes trailing heading spaces in output', async ({page}) => {
    await pickTemplate(page, 'Markdown');
    await expect(getCodeOutput(page)).toContainText(`heading(2, 'Hello World')`);
});

test('snippet: CSS removes vendor prefix in output', async ({page}) => {
    await pickTemplate(page, 'CSS');
    await expect(getCodeOutput(page)).toContainText(`declaration('user-select', 'none')`);
});

test('snippet: Docker converts MAINTAINER in output', async ({page}) => {
    await pickTemplate(page, 'Docker');
    await expect(getCodeOutput(page)).toContainText('"LABEL"');
});

test('snippet: Ignore fixes lock extension in output', async ({page}) => {
    await pickTemplate(page, 'Ignore');
    await expect(getCodeOutput(page)).toContainText('"*.lock"');
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
    await expect(page.getByTestId(EDITOR_TRANSFORM)).toContainText('export const include');
});

test('snippet: Finder loads correct template text', async ({page}) => {
    await pickTemplate(page, 'Finder');
    await expect(page.getByTestId(EDITOR_TRANSFORM)).toContainText('export const find');
});

test('snippet: TOML loads correct template text', async ({page}) => {
    await pickTemplate(page, 'TOML');
    await expect(page.getByTestId(EDITOR_TRANSFORM)).toContainText('__toml');
});

test('snippet: Markdown loads correct template text', async ({page}) => {
    await pickTemplate(page, 'Markdown');
    await expect(page.getByTestId(EDITOR_TRANSFORM)).toContainText('heading');
});

test('snippet: CSS loads correct template text', async ({page}) => {
    await pickTemplate(page, 'CSS');
    await expect(page.getByTestId(EDITOR_TRANSFORM)).toContainText('__css');
});

test('snippet: Scanner loads correct template text', async ({page}) => {
    await pickTemplate(page, 'Scanner');
    await expect(page.getByTestId(EDITOR_TRANSFORM)).toContainText('export const scan');
});
