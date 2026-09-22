import {
    test,
    expect,
    type Page,
} from './test.ts';
import {
    createPutoutEditor,
    EDITOR_TRANSFORM,
} from './putout-editor.ts';

const getTransformCode = async (page: Page) => {
    const editor = createPutoutEditor(page);
    const {read} = await editor.get(EDITOR_TRANSFORM);
    
    return read();
};

const openSnippet = (page: Page) => page
    .getByTestId('toolbar')
    .getByText('Snippet', {
        exact: false,
    })
    .hover();

const openNew = async (page: Page) => {
    await openSnippet(page);
    await page
        .getByTestId('new-menu')
        .hover();
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

test('snippet: New submenu lists 15 plugin templates', async ({page}) => {
    await openNew(page);
    const items = page
        .getByTestId('new-submenu')
        .getByRole('menuitem');
    
    // 15 categories + 1 Default
    await expect(items).toHaveCount(16);
});

test('snippet: New Replacer inserts ternary template', async ({page}) => {
    await pickTemplate(page, 'Replacer');
    
    await expect(page.getByTestId(EDITOR_TRANSFORM)).toContainText('convert-ternary-to-if');
});

test('snippet: New → Traverser inserts merge-duplicate-imports', async ({page}) => {
    await pickTemplate(page, 'Traverser');
    await expect(page.getByTestId(EDITOR_TRANSFORM)).toContainText('merge-duplicate-imports');
});

test('snippet: New → Default resets to default template', async ({page}) => {
    await pickTemplate(page, 'Replacer');
    await pickTemplate(page, 'Default');
    const code = await getTransformCode(page);
    
    expect(code.includes('convert-ternary-to-if')).toBe(false);
});

test('snippet: New submenu selection is undoable', async ({page}) => {
    const editor = createPutoutEditor(page);
    const before = await (await editor.get(EDITOR_TRANSFORM)).read();
    
    await pickTemplate(page, 'Checker');
    
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
