import { expect, test } from '@playwright/test';

test('navega pela sidebar, respostas e playground', async ({ page }) => {
  await page.goto('/api-reference/listInstances');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/inst/i);
  await expect(page.locator('.reference-sidebar')).toBeVisible();
  await page.locator('.endpoint-section').getByRole('tab').nth(1).click();
  await expect(page.locator('.endpoint-section').getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: /testar endpoint/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('busca global aceita teclado', async ({ page }) => {
  await page.goto('/api-reference');
  await page.keyboard.press('Control+K');
  const input = page.getByRole('combobox');
  await expect(input).toBeVisible();
  await input.fill('listInstances');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/legacyListInstances/);
});

test('mobile não cria overflow global e abre o drawer', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Cenário exclusivo do viewport mobile');
  await page.goto('/api-reference/listInstances');
  await page.getByRole('button', { name: /abrir navegação/i }).click();
  await expect(page.locator('.reference-sidebar')).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('centraliza as três colunas em viewport ultrawide', async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1200 });
  await page.goto('/api-reference/listInstances');

  const layout = await page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>('.documentation-frame')!.getBoundingClientRect();
    const sidebar = document.querySelector<HTMLElement>('.reference-sidebar')!.getBoundingClientRect();
    const panel = document.querySelector<HTMLElement>('.reference-right-panel')!.getBoundingClientRect();
    return {
      frameWidth: frame.width,
      leftGutter: frame.left,
      rightGutter: document.body.clientWidth - frame.right,
      sidebarLeft: sidebar.left,
      panelRight: panel.right,
    };
  });

  expect(layout.frameWidth).toBeLessThanOrEqual(1680);
  expect(Math.abs(layout.leftGutter - layout.rightGutter)).toBeLessThan(2);
  expect(layout.sidebarLeft).toBeGreaterThan(400);
  expect(layout.panelRight).toBeLessThan(2160);
});

test('mantém o piso tipográfico nos elementos relevantes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/api-reference/listInstances');

  const endpointSizes = await page.evaluate(() => {
    const selectors = [
      '.reference-topbar nav a',
      '.version-badge',
      '.topbar-link',
      '.sidebar-switcher button',
      '.sidebar-search input',
      '.sidebar-group summary',
      '.sidebar-group a',
      '.method-badge',
      '.endpoint-breadcrumb',
      '.endpoint-tag',
      '.code-block-toolbar',
      '.code-block pre',
      '.right-section-title strong',
      '.language-select',
    ];
    return selectors.map((selector) => ({
      selector,
      size: Number.parseFloat(getComputedStyle(document.querySelector<HTMLElement>(selector)!).fontSize),
    }));
  });

  expect(endpointSizes.every(({ size }) => size >= 11)).toBe(true);

  await page.goto('/');
  const homeSizes = await page.evaluate(() =>
    ['.portal-stats span', '.portal-card > p', '.contextual-panel-heading p', '.contextual-stats dt'].map((selector) =>
      Number.parseFloat(getComputedStyle(document.querySelector<HTMLElement>(selector)!).fontSize),
    ),
  );
  expect(homeSizes.every((size) => size >= 12)).toBe(true);
});

test('expõe a coleção oficial da CodeChat no Postman', async ({ page }) => {
  await page.goto('/api-reference');

  const postmanLink = page.locator('.postman-link');
  await expect(postmanLink).toHaveAttribute(
    'href',
    'https://www.postman.com/codechat/codechat-api/collection/1yi47fy/go-v1-0-0',
  );
  await expect(postmanLink).toHaveAttribute('target', '_blank');
  await expect(page.locator('.sidebar-resources')).toContainText('Coleção oficial · Go v1.0.0');
  await expect(page.getByRole('link', { name: /coleção no postman/i })).toBeVisible();
});
