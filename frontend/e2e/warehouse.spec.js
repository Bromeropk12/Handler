import { test, expect } from '@playwright/test';

test.describe('Warehouse Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();

    // Wait for navigation to warehouse
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('should load warehouse page after login', async ({ page }) => {
    // Verificar que estamos en la página principal del warehouse
    await expect(page.locator('h1')).toContainText('Almacén');

    // Verificar elementos principales
    await expect(page.locator('text=Líneas de Mercado')).toBeVisible();
  });

  test('should display market lines', async ({ page }) => {
    // Esperar a que carguen las market lines
    await page.waitForSelector('[data-testid="market-line"]');

    // Verificar que se muestran las market lines
    const marketLines = page.locator('[data-testid="market-line"]');
    await expect(marketLines).toHaveCount(3); // Cosmética, Farmacéutica, Industrial

    // Verificar nombres específicos
    await expect(page.locator('text=Cosmética')).toBeVisible();
    await expect(page.locator('text=Farmacéutica')).toBeVisible();
    await expect(page.locator('text=Industrial')).toBeVisible();
  });

  test('should navigate to shelves when selecting market line', async ({ page }) => {
    // Esperar market lines
    await page.waitForSelector('[data-testid="market-line"]');

    // Hacer clic en la primera market line (Cosmética)
    await page.locator('[data-testid="market-line"]').first().click();

    // Verificar navegación a shelves
    await expect(page.locator('text=Anaqueles')).toBeVisible();

    // Verificar que se muestran los shelves de cosmética
    const shelves = page.locator('[data-testid="shelf-item"]');
    await expect(shelves).toHaveCount(5); // BASF #1, BASF #2, BASF #3, JRS #1, THOR #1
  });

  test('should display shelf statistics', async ({ page }) => {
    // Ir a una market line
    await page.waitForSelector('[data-testid="market-line"]');
    await page.locator('[data-testid="market-line"]').first().click();

    // Verificar estadísticas de shelf
    await expect(page.locator('text=Ocupación')).toBeVisible();
    await expect(page.locator('text=Capacidad')).toBeVisible();

    // Verificar que se muestran porcentajes
    await expect(page.locator('text=%')).toBeVisible();
  });

  test('should navigate to 2D map when selecting shelf', async ({ page }) => {
    // Ir a market line y luego a shelf
    await page.waitForSelector('[data-testid="market-line"]');
    await page.locator('[data-testid="market-line"]').first().click();

    await page.waitForSelector('[data-testid="shelf-item"]');
    await page.locator('[data-testid="shelf-item"]').first().click();

    // Verificar que estamos en el mapa 2D
    await expect(page.locator('text=Mapa 2D')).toBeVisible();

    // Verificar elementos del grid
    await expect(page.locator('[data-testid="grid-cell"]')).toBeVisible();
  });

  test('should handle empty warehouse gracefully', async ({ page }) => {
    // Simular respuesta vacía de la API
    await page.route('**/api/samples/market-lines', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      });
    });

    // Recargar página
    await page.reload();

    // Verificar mensaje de vacío
    await expect(page.locator('text=No hay líneas de mercado disponibles')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Simular error de API
    await page.route('**/api/samples/market-lines', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' })
      });
    });

    // Recargar página
    await page.reload();

    // Verificar manejo de error (debería mostrar error boundary o mensaje)
    await expect(page.locator('text=Error al cargar')).toBeVisible();
  });

  test('should handle circuit breaker fallback', async ({ page }) => {
    // Simular múltiples fallos para activar circuit breaker
    let failureCount = 0;

    await page.route('**/api/warehouse/**', async route => {
      failureCount++;
      if (failureCount <= 3) { // Fallar las primeras 3 veces
        await route.abort();
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] })
        });
      }
    });

    // Intentar cargar datos del warehouse
    await page.waitForSelector('[data-testid="market-line"]');
    await page.locator('[data-testid="market-line"]').first().click();

    // Verificar mensaje de servicio no disponible
    await expect(page.locator('text=Servicio temporalmente no disponible')).toBeVisible();
  });

  test('should maintain state across navigation', async ({ page }) => {
    // Ir a market line
    await page.waitForSelector('[data-testid="market-line"]');
    await page.locator('[data-testid="market-line"]').first().click();

    // Verificar que la market line seleccionada se mantiene visualmente
    await expect(page.locator('[data-testid="selected-market-line"]')).toBeVisible();

    // Ir a un shelf
    await page.locator('[data-testid="shelf-item"]').first().click();

    // Volver atrás
    await page.locator('[data-testid="back-button"]').click();

    // Verificar que aún estamos en la market line correcta
    await expect(page.locator('[data-testid="selected-market-line"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Cambiar a viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });

    // Verificar que los elementos se adaptan
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Verificar que el contenido es legible
    const content = page.locator('main');
    const boundingBox = await content.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });
});