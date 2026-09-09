import {
    type Page,
    type Locator,
    expect,
} from '@playwright/test';

export const EDITOR_SOURCE = 'editor-source';
export const EDITOR_TRANSFORM = 'editor-transform';

type EditorName = typeof EDITOR_SOURCE | typeof EDITOR_TRANSFORM;

interface EditorHandle {
    write(text: string): Promise<void>;
    press(key: string): Promise<void>;
    read(): Promise<string>;
    cursorLine(): Promise<number>;
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
                await locator.pressSequentially(text);
            },
            async press(key: string) {
                await page.keyboard.press(key);
            },
            async read() {
                return locator.innerText();
            },
            async cursorLine() {
                const editor = page.getByTestId(name).locator('.cm-editor');
                const lines = editor.locator('.cm-line');
                const active = editor.locator('.cm-activeLine');
                const allLines = await lines.all();
                
                for (let i = 0; i < allLines.length; i++)
                    if (await allLines[i].evaluate((el, a) => el === a, await active.elementHandle()))
                        return i + 1;
                
                return -1;
            },
        };
    }
    
    async function goto() {
        await page.goto('/');
        await expect(page
            .getByRole('textbox')
            .first()).toBeVisible();
    }
    
    return {
        get,
        goto,
    };
}
