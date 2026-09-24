import {
    test,
    expect,
    type Page,
} from './test.ts';
import {
    createPutoutEditor,
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

