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

test('snippet: New submenu lists 14 plugin templates', async ({page}) => {
    await page
        .getByTestId('toolbar')
        .getByText('Snippet', {
            exact: false,
        })
        .hover();
    
    const menu = page
        .locator('#Toolbar .menuButton ul')
        .first();
    
    await expect(menu.getByText('Replacer', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Includer', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Fixer', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Checker', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Watcher', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Lister', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Ignorer', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Decaler', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('EqualsTo', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Deleter', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Duplicater', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Counter', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Typer', {
        exact: true,
    })).toBeVisible();
    await expect(menu.getByText('Finder', {
        exact: true,
    })).toBeVisible();
});

test('snippet: New Replacer inserts ternary template', async ({page}) => {
    await page
        .getByTestId('toolbar')
        .getByText('Snippet', {
            exact: false,
        })
        .hover();
    
    await page
        .locator('#Toolbar .menuButton ul')
        .first()
        .getByText('Replacer', {
            exact: true,
        })
        .click();
    
    await expect(page.getByTestId(EDITOR_TRANSFORM)).toContainText('convert-ternary-to-if');
});

test('snippet: New submenu selection is undoable', async ({page}) => {
    const editor = createPutoutEditor(page);
    const before = await (await editor.get(EDITOR_TRANSFORM)).read();
    
    await page
        .getByTestId('toolbar')
        .getByText('Snippet', {
            exact: false,
        })
        .hover();
    
    await page
        .locator('#Toolbar .menuButton ul')
        .first()
        .getByText('Checker', {
            exact: true,
        })
        .click();
    
    const after = await getTransformCode(page);
    
    expect(after).not.toBe(before);
    
    await page.keyboard.press('ControlOrMeta+Z');
    
    const undone = await getTransformCode(page);
    
    expect(undone).toBe(before);
});
