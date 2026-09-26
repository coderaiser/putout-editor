import {
    createPutoutEditor,
    EDITOR_TRANSFORM,
} from '#e2e/mobile';
import {
    test,
    expect,
    type Page,
} from './test.ts';

const mobileMenu = (page: Page) => page.getByTestId('mobile-menu');

const openNewSubmenu = async (page: Page) => {
    const menu = mobileMenu(page);
    
    await menu
        .locator(':scope > .mobile-dropdown > .mobile-dropdown__trigger')
        .nth(0)
        .tap();
    await menu
        .getByTestId('new-trigger')
        .tap();
};

const pickMobileTemplate = async (page: Page, label: string) => {
    await openNewSubmenu(page);
    await mobileMenu(page)
        .getByTestId('new-submenu')
        .getByRole('menuitem', {
            name: label,
        })
        .tap();
};

const mobileTemplateMarkers = {
    Replacer: 'convert-ternary-to-if',
    Includer: 'remove-empty-method',
    Traverser: 'merge-duplicate-imports',
    Declarator: 'declare',
    Scanner: 'scan',
    Finder: 'find',
    JSON: '__json',
    YAML: '__yaml',
    TOML: '__toml',
    Markdown: 'heading',
    CSS: 'use-custom-property-for-color',
    Docker: '__docker',
    Ignore: '__ignore',
} as const;

test('mobile menu is visible', async ({page}) => {
    await expect(page.locator('#MobileMenu')).toBeVisible();
});

test('desktop toolbar controls are hidden on mobile', async ({page}) => {
    // the compact toolbar info row remains
    await expect(page.locator('#Toolbar')).toBeVisible();
    
    // desktop menu triggers are hidden on mobile
    await expect(
        page
            .locator('#Toolbar')
            .getByText('babel', {
                exact: true,
            })
            .first(),
    ).toBeHidden();
    
    // mobile menu is shown instead
    await expect(page.locator('#MobileMenu')).toBeVisible();
});

test('logo is visible', async ({page}) => {
    await expect(page.locator('#Toolbar h1')).toBeVisible();
});

test('snippet dropdown opens', async ({page}) => {
    const snippet = page.getByRole('button', {
        name: /snippet/i,
    });
    
    await snippet.tap();
    await expect(
        page
            .getByRole('menu')
            .first(),
    ).toBeVisible();
});

test('snippet dropdown exposes accessible semantics', async ({page}) => {
    const snippet = page.getByRole('button', {
        name: /snippet/i,
    });
    
    await expect(snippet).toHaveAttribute('aria-expanded', 'false');
    await snippet.tap();
    await expect(snippet).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('menu')).toBeVisible();
});

test('parser dropdown opens', async ({page}) => {
    const parser = page.getByRole('button', {
        name: /babel/i,
    });
    
    await parser.tap();
    await expect(
        page
            .getByRole('menu')
            .first(),
    ).toBeVisible();
});

test('dropdown closes on outside tap', async ({page}) => {
    const snippet = page.getByRole('button', {
        name: /snippet/i,
    });
    
    await snippet.tap();
    await expect(
        page
            .getByRole('menu')
            .first(),
    ).toBeVisible();
    
    // tapping the editor closes the dropdown
    await page
        .locator('.cm-editor')
        .first()
        .tap();
    await expect(
        page
            .getByRole('menu')
            .first(),
    ).toBeHidden();
});

test('mobile tabs render', async ({page}) => {
    await expect(page.locator('.mobile-tabs')).toBeVisible();
});

test('mobile tabs contain four controls', async ({page}) => {
    const tabs = page
        .locator('.mobile-tabs')
        .getByRole('tab');
    
    await expect(tabs).toHaveCount(4);
});

test('all tab buttons are within the viewport', async ({page}) => {
    const viewport = page.viewportSize()!;
    const tabs = page
        .locator('.mobile-tabs')
        .getByRole('tab');
    
    for (const tab of await tabs.all()) {
        const box = await tab.boundingBox();
        
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    }
});

test('all tab buttons meet minimum tap target size', async ({page}) => {
    const MIN_TAP_SIZE = 44;
    const tabs = page
        .locator('.mobile-tabs')
        .getByRole('tab');
    
    for (const tab of await tabs.all()) {
        const box = await tab.boundingBox();
        
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(MIN_TAP_SIZE);
        expect(box!.height).toBeGreaterThanOrEqual(MIN_TAP_SIZE);
    }
});

test('contribution bar is not visible on mobile', async ({page}) => {
    await expect(page.locator('#contribution')).toBeHidden();
});

test('contribution bar does not obscure tab buttons', async ({page}) => {
    const tabs = page
        .locator('.mobile-tabs')
        .getByRole('tab');
    
    for (const tab of await tabs.all()) {
        await expect(tab).toBeInViewport();
    }
});

test('each tab is tappable and switches panel', async ({page}) => {
    const tabPanelMap: {
        tab: string;
        selector: string;
    }[] = [{
        tab: 'Source',
        selector: '[data-testid="editor-source"] .cm-editor',
    }, {
        tab: 'AST',
        selector: '.output',
    }, {
        tab: 'Code',
        selector: '[data-testid="editor-code"]',
    }, {
        tab: 'Transform',
        selector: '[data-testid="editor-transform"] .cm-editor',
    }];
    
    for (const {tab, selector} of tabPanelMap) {
        await page
            .getByRole('tab', {
                name: tab,
            })
            .tap();
        await expect(
            page
                .locator(selector)
                .first(),
        ).toBeVisible();
    }
});

test('source tab opens the editor', async ({page}) => {
    await page
        .getByRole('tab', {
            name: /source/i,
        })
        .tap();
    await expect(
        page
            .locator('.cm-editor')
            .first(),
    ).toBeVisible();
});

test('ast tab opens the AST output', async ({page}) => {
    await page
        .getByRole('tab', {
            name: /ast/i,
        })
        .tap();
    await expect(
        page
            .locator('.output')
            .first(),
    ).toBeVisible();
});

test('updating transform editor changes source output', async ({page}) => {
    const editor = createPutoutEditor(page);
    
    await page
        .getByRole('tab', {
            name: /transform/i,
        })
        .tap();
    
    await page
        .getByTestId('editor-transform')
        .locator('.cm-content')
        .click();
    
    const {write, press} = await editor.get(EDITOR_TRANSFORM);
    await press('i');
    await write(`export const replace = () => ({'"use strict"': ''});`);
    await page.waitForTimeout(400);
    
    await page
        .getByRole('tab', {
            name: /source/i,
        })
        .tap();
    
    const source = page
        .getByTestId('editor-source')
        .locator('.cm-content');
    
    await expect(source).not.toContainText('"use strict"');
});

test('updating transform editor changes code output', async ({page}) => {
    const editor = createPutoutEditor(page);
    
    await page
        .getByRole('tab', {
            name: /transform/i,
        })
        .tap();
    
    await page
        .getByTestId('editor-transform')
        .locator('.cm-content')
        .click();
    
    const {write, press} = await editor.get(EDITOR_TRANSFORM);
    await press('i');
    await write(`export const replace = () => ({'"use strict"': ''});`);
    await page.waitForTimeout(400);
    
    await page
        .getByRole('tab', {
            name: /code/i,
        })
        .tap();
    
    const output = page.getByTestId('editor-code');
    
    await expect(output).toBeVisible();
});

test('@putout/editor: client: mobile: updating transform editor changes code output: no "use strict"', async ({page}) => {
    const editor = createPutoutEditor(page);
    
    await page
        .getByRole('tab', {
            name: /transform/i,
        })
        .tap();
    
    await page
        .getByTestId('editor-transform')
        .locator('.cm-content')
        .click();
    
    const {write, press} = await editor.get(EDITOR_TRANSFORM);
    await press('i');
    await write(`export const replace = () => ({'"use strict"': ''});`);
    await page.waitForTimeout(400);
    
    await page
        .getByRole('tab', {
            name: /code/i,
        })
        .tap();
    
    const output = page.getByTestId('editor-code');
    
    await expect(output).not.toContainText('"use strict"');
});

test('mobile: only one dropdown open at a time', async ({page}) => {
    // only top-level dropdowns: exclude the nested new-trigger button
    const triggers = page
        .getByTestId('mobile-menu')
        .locator(':scope > .mobile-dropdown > .mobile-dropdown__trigger');
    
    await triggers
        .nth(0)
        .tap();
    
    // open Snippet
    await triggers
        .nth(1)
        .tap();
    
    // open Parser
    await expect(
        page
            .getByTestId('mobile-menu')
            .locator(':scope > .mobile-dropdown > .mobile-dropdown__menu'),
    ).toHaveCount(1);
});

test('mobile: New trigger visible inside Snippet dropdown', async ({page}) => {
    await page
        .getByTestId('mobile-menu')
        .locator(':scope > .mobile-dropdown > .mobile-dropdown__trigger')
        .nth(0)
        .tap();
    
    await expect(
        page
            .getByTestId('mobile-menu')
            .getByTestId('new-trigger'),
    ).toBeVisible();
});

test('mobile: New submenu opens on New tap', async ({page}) => {
    await page
        .getByTestId('mobile-menu')
        .locator(':scope > .mobile-dropdown > .mobile-dropdown__trigger')
        .nth(0)
        .tap();
    
    await page
        .getByTestId('mobile-menu')
        .getByTestId('new-trigger')
        .tap();
    
    await expect(
        page
            .getByTestId('mobile-menu')
            .getByTestId('new-submenu'),
    ).toBeVisible();
});

test('mobile: New submenu contains Replacer', async ({page}) => {
    await page
        .getByTestId('mobile-menu')
        .locator(':scope > .mobile-dropdown > .mobile-dropdown__trigger')
        .nth(0)
        .tap();
    
    await page
        .getByTestId('mobile-menu')
        .getByTestId('new-trigger')
        .tap();
    
    await expect(
        page
            .getByTestId('mobile-menu')
            .getByTestId('new-submenu')
            .getByRole('menuitem', {
                name: 'Replacer',
            }),
    ).toBeVisible();
});

test('mobile: New submenu contains Declarator', async ({page}) => {
    await page
        .getByTestId('mobile-menu')
        .locator(':scope > .mobile-dropdown > .mobile-dropdown__trigger')
        .nth(0)
        .tap();
    
    await page
        .getByTestId('mobile-menu')
        .getByTestId('new-trigger')
        .tap();
    
    await expect(
        page
            .getByTestId('mobile-menu')
            .getByTestId('new-submenu')
            .getByRole('menuitem', {
                name: 'Declarator',
            }),
    ).toBeVisible();
});

test('mobile: New submenu contains JSON', async ({page}) => {
    await page
        .getByTestId('mobile-menu')
        .locator(':scope > .mobile-dropdown > .mobile-dropdown__trigger')
        .nth(0)
        .tap();
    
    await page
        .getByTestId('mobile-menu')
        .getByTestId('new-trigger')
        .tap();
    
    await expect(
        page
            .getByTestId('mobile-menu')
            .getByTestId('new-submenu')
            .getByRole('menuitem', {
                name: 'JSON',
            }),
    ).toBeVisible();
});

test('mobile: picking Replacer loads template into transform editor', async ({page}) => {
    await pickMobileTemplate(page, 'Replacer');
    await page
        .getByRole('tab', {
            name: /transform/i,
        })
        .tap();
    
    await expect(
        page
            .getByTestId('editor-transform')
            .locator('.cm-content'),
    ).toContainText('convert-ternary-to-if');
});

for (const [label, marker] of Object.entries(mobileTemplateMarkers)) {
    test(`mobile: ${label} template loads via New submenu`, async ({page}) => {
        await pickMobileTemplate(page, label);
        await page
            .getByRole('tab', {
                name: /transform/i,
            })
            .tap();
        
        await expect(
            page
                .getByTestId('editor-transform')
                .locator('.cm-content'),
        ).toContainText(marker);
    });
}

test('mobile: Replacer fixture loads in Source panel', async ({page}) => {
    await pickMobileTemplate(page, 'Replacer');
    await page
        .getByRole('tab', {
            name: /source/i,
        })
        .tap();
    
    await expect(
        page
            .getByTestId('editor-source')
            .locator('.cm-content'),
    ).toContainText('Transform your code with 🐊Putout');
});
