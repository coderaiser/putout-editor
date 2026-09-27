import {
    type Page,
    type Locator,
    expect,
} from '@playwright/test';

export const EDITOR_SOURCE = 'editor-source';
export const EDITOR_TRANSFORM = 'editor-transform';
export const EDITOR_CODE = 'editor-code';

type EditorName = typeof EDITOR_SOURCE | typeof EDITOR_TRANSFORM | typeof EDITOR_CODE;

interface EditorHandle {
    write(text: string): Promise<void>;
    press(key: string): Promise<void>;
    read(): Promise<string>;
    locator: Locator;
}

export function createPutoutEditor(page: Page) {
    async function get(name: EditorName): Promise<EditorHandle> {
        const locator = page
            .getByTestId(name)
            .locator('.cm-content');
        
        return {
            locator,
            async write(text: string) {
                await locator.tap();
                
                // `selectText()`, not `ControlOrMeta+a`: the default keymap is
                // `vim`, where `Ctrl-a` is bound to `incrementNumber` and
                // selects nothing, so the buffer survived and the next
                // `insertText` appended to it. `selectText()` goes through the
                // DOM selection, which no keymap can intercept.
                await locator.selectText();
                await page.keyboard.insertText(text);
            },
            async press(key: string) {
                await page.keyboard.press(key);
            },
            async read() {
                return locator.innerText();
            },
        };
    }
    
    async function goto() {
        await page.goto('/');
        await expect(
            page
                .getByRole('textbox')
                .first(),
        ).toBeVisible();
    }
    
    return {
        get,
        goto,
    };
}
