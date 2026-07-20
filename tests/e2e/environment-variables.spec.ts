import { expect, test } from '@playwright/test';

const requiredViewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 3440, height: 1440 },
];

test('variáveis de ambiente não criam overflow nas resoluções exigidas', async ({ page }) => {
  for (const viewport of requiredViewports) {
    await page.setViewportSize(viewport);
    await page.goto('/docs/environment');
    await expect(page.getByRole('heading', { name: 'Variáveis de ambiente' })).toBeVisible();

    const layout = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll<HTMLElement>('.environment-variable-item'));
      const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      const itemOverflow = items.some((item) => item.scrollWidth > item.clientWidth + 1);
      const descriptionClipped = items.some((item) => {
        const description = item.querySelector<HTMLElement>('.environment-variable-item__description');
        return description ? description.scrollWidth > description.clientWidth + 1 : false;
      });

      return { bodyOverflow, itemOverflow, descriptionClipped, itemCount: items.length };
    });

    expect(layout.itemCount).toBe(48);
    expect(layout.bodyOverflow).toBe(false);
    expect(layout.itemOverflow).toBe(false);
    expect(layout.descriptionClipped).toBe(false);
  }
});

test('pesquisa, filtros, grupos e âncoras funcionam na página de ambiente', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/docs/environment');

  await page.getByPlaceholder('Pesquisar por nome, descrição ou exemplo...').fill('strong-secret');
  await expect(page.locator('.environment-variable-item')).toHaveCount(1);
  await expect(page.locator('#authentication-jwt-secret .environment-variable-item__name')).toHaveText(
    'AUTHENTICATION_JWT_SECRET',
  );

  await page.getByRole('button', { name: 'Limpar pesquisa' }).click();
  await page.getByRole('radio', { name: 'Obrigatórias' }).click();
  await expect(page.getByText(/14 de 48 variáveis/)).toBeVisible();

  await page.getByRole('radio', { name: 'Todas' }).click();
  await page.getByLabel('Filtrar por categoria').selectOption('Message Batch');
  await expect(page.locator('.environment-variable-item')).toHaveCount(7);

  await page.getByRole('button', { name: 'Recolher', exact: true }).click();
  await expect(page.locator('#message-batch-worker-enabled')).toBeHidden();

  await page.goto('/docs/environment#message-batch-worker-enabled');
  await expect(page.locator('#message-batch-worker-enabled')).toBeVisible();
  await expect(page.locator('#message-batch-worker-enabled')).toBeInViewport();
});
