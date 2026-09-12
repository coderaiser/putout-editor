import {montag} from 'montag';
import {test, expect} from './test.ts';
import {createPutoutEditor} from './putout-editor.ts';

test('renders the editor application', async ({page}) => {
    await expect(page.getByTestId('toolbar')).toBeVisible();
});

test('renders Putout Editor title', async ({page}) => {
    await expect(page.getByRole('heading', {
        name: '🐊Putout Editor',
    })).toBeVisible();
});

test('mobile menu is hidden on desktop', async ({page}) => {
    await expect(page.locator('#MobileMenu')).toBeHidden();
});

test('source editor renders', async ({page}) => {
    await expect(
        page
            .getByTestId('editor-source')
            .getByRole('textbox'),
    ).toBeVisible();
});

test('AST output renders', async ({page}) => {
    await expect(page.getByTestId('ast-output')).toBeVisible();
});

test('AST view controls render', async ({page}) => {
    await expect(page.getByRole('button', {
        name: /tree/i,
    })).toBeVisible();
    await expect(page.getByRole('button', {
        name: /json/i,
    })).toBeVisible();
});

test('desktop parser menu opens and changes parser', async ({page}) => {
    await expect(
        page
            .getByTestId('toolbar')
            .getByText('acorn', {
                exact: true,
            }),
    ).toBeHidden();
    await page
        .getByTestId('toolbar')
        .getByText('babel', {
            exact: true,
        })
        .first()
        .hover();
    await expect(page.getByRole('button', {
        name: /acorn/i,
    })).toBeVisible();
    await page
        .getByRole('button', {
            name: /acorn/i,
        })
        .click();
    await expect(
        page
            .getByTestId('toolbar')
            .getByText('acorn', {
                exact: true,
            })
            .first(),
    ).toBeVisible();
});

test('vim mode works after switching keymap away and back', async ({page}) => {
    const editor = createPutoutEditor(page);
    
    // switch keymap: hover opens the dropdown, mouse.move resets
    // the force-closed state so it can be reopened
    const keymap = page.getByTestId('keymap');
    
    await keymap.hover();
    await page
        .getByTestId('default')
        .click();
    await page.mouse.move(0, 0);
    
    await keymap.hover();
    await page
        .getByTestId('vim')
        .click();
    await page.mouse.move(0, 0);
    
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    
    const {
        write,
        press,
        read,
    } = await editor.get('editor-source');
    
    // replace the whole buffer with known content
    await press('i');
    await press('ControlOrMeta+A');
    await write('hello');
    await press('Escape');
    
    // vim-only check: 'x' deletes the char under the cursor in
    
    // normal mode ('o'), while a non-vim keymap would insert 'x'
    await press('x');
    
    const result = await read();
    
    expect(result).toBe('hell');
});

test('vim mode preserves indent after consecutive Enter presses', async ({page}) => {
    const editor = createPutoutEditor(page);
    
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    const {
        write,
        press,
        read,
    } = await editor.get('editor-source');
    
    await press('i');
    await press('ControlOrMeta+A');
    await write('    hello');
    await press('Enter');
    await press('Enter');
    await write('X');
    await press('Escape');
    
    const result = await read();
    expect(result).toContain('  X');
});

test('vim paste preserves yanked line indentation', async ({page}) => {
    const editor = createPutoutEditor(page);
    
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    const {
        write,
        press,
        read,
    } = await editor.get('editor-source');
    
    await press('ControlOrMeta+A');
    await write('for (const [index, element] of elements.entries()) {\n    if (compare(element, "heading(2, \\"Rules\\")")) {\n        rules.push(element);\n    }\n}');
    await press('Escape');
    
    await press('4');
    await press('g');
    await press('g');
    await press('0');
    await press('v');
    await press('k');
    await press('k');
    await press('y');
    await press('p');
    
    const lines = (await read()).split('\n');
    const closingBraceLine = lines.find((line, idx) => idx > 4 && line.trim() === '}');
    
    expect(closingBraceLine).toBe('    }');
});
const CONTENT = montag`
    export const report = () => \`Use 'if condition' instead of 'ternary expression'\`;
    export const replace = () => ({
        '__a ? __b : __c': 'if (__a) __b; else __c;',
    });
`;

test('vim paste below preserves pasted block indentation', async ({page}) => {
    const editor = createPutoutEditor(page);
    
    await page
        .getByTestId('editor-source')
        .locator('.cm-content')
        .click();
    const {
        write,
        press,
        read,
    } = await editor.get('editor-source');
    
    await press('Escape');
    await press('i');
    await press('ControlOrMeta+A');
    await write(CONTENT);
    await press('Escape');
    
    // 2 V jj y jj p - yank replace block (lines 2-4), paste below its closing line
    await press('2');
    await press('g');
    await press('g');
    await press('V');
    await press('j');
    await press('j');
    await press('y');
    await press('j');
    await press('j');
    await press('p');
    
    const result = await read();
    const lines = result
        .split('\n')
        .filter((line) => line.trim().length > 0);
    
    // CONTENT has 4 lines. We yank lines 2-4 (the replace block) and paste below.
    // Result: line 1 + lines 2-4 (original) + lines 2-4 (pasted) = 7 lines
    const expected = [
        lines[0],
        // export const report...
        lines[1],
        // export const replace = () => ({
        lines[2],
        // '__a ? __b : __c':...
        lines[3],
        // }); (original)
        lines[4],
        // export const replace = () => ({ (pasted)
        lines[5],
        // '__a ? __b : __c':... (pasted)
        lines[6] // }); (pasted)
        ,
    ].join('\n');
    
    expect(result).toBe(expected);
});
