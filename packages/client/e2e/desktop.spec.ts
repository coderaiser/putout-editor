import {test, expect} from '@playwright/test';
import {openEditor} from './helpers.ts';

test('renders the editor application', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('#Toolbar')).toBeVisible();
});

test('renders Putout Editor title', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('#Toolbar h1')).toContainText('Putout Editor');
});

test('mobile menu is hidden on desktop', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('#MobileMenu')).toBeHidden();
});

test('source editor renders', async ({page}) => {
    await openEditor(page);
    await expect(page.locator('.cm-editor').first()).toBeVisible();
});

test('AST output renders', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('.output').first()).toBeVisible();
});

test('AST view controls render', async ({page}) => {
    await page.goto('/');
    await expect(page.getByRole('button', {name: /tree/i})).toBeVisible();
    await expect(page.getByRole('button', {name: /json/i})).toBeVisible();
});

test('desktop parser menu opens and changes parser', async ({page}) => {
    await page.goto('/');
    
    // menu closed initially
    await expect(page.locator('#Toolbar').getByText('acorn', {exact: true})).toBeHidden();
    
    // hover opens the parser menu
    await page.locator('#Toolbar').getByText('babel', {exact: true}).first().hover();
    await expect(page.getByRole('button', {name: /acorn/i})).toBeVisible();
    
    // selecting a parser updates the toolbar
    await page.getByRole('button', {name: /acorn/i}).click();
    await expect(page.locator('#Toolbar').getByText('acorn', {exact: true}).first()).toBeVisible();
});