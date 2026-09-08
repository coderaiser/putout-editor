import {type Page, type Locator} from '@playwright/test';

export const EDITOR_SOURCE = 'editor-source';
export const EDITOR_TRANSFORM = 'editor-transform';

type EditorName = typeof EDITOR_SOURCE | typeof EDITOR_TRANSFORM;

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
                await locator.pressSequentially(text);
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
        await page.waitForSelector('[data-testid="editor-source"]', {
            state: 'visible',
        });
    }
    
    return {
        get,
        goto,
    };
}
