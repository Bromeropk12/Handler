import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage antes de cada test
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Ir a la página principal (debería redirigir a login)
    await page.goto('/');
  });

  test('should show login page by default', async ({ page }) => {
    // Verificar que estamos en la página de login
    await expect(page).toHaveURL(/.*login/);

    // Verificar elementos de la página de login
    await expect(page.locator('h1')).toContainText('Handler TrackSamples');
    await expect(page.locator('text=Gestión inteligente de muestras químicas')).toBeVisible();

    // Verificar campos del formulario
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Hacer clic en submit sin llenar campos
    await page.locator('button[type="submit"]').click();

    // Verificar que aún estamos en login (no se envió)
    await expect(page).toHaveURL(/.*login/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Llenar credenciales válidas
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');

    // Hacer submit
    await page.locator('button[type="submit"]').click();

    // Verificar redirección al dashboard/warehouse
    await expect(page).toHaveURL(/.*\/$/); // URL raíz sin /login

    // Verificar que ya no estamos en login
    await expect(page.locator('h1')).not.toContainText('Handler TrackSamples');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Llenar credenciales inválidas
    await page.locator('input[name="username"]').fill('invalid');
    await page.locator('input[name="password"]').fill('invalid');

    // Hacer submit
    await page.locator('button[type="submit"]').click();

    // Verificar que permanecemos en login
    await expect(page).toHaveURL(/.*login/);

    // Verificar mensaje de error (asumiendo que se muestra)
    await expect(page.locator('text=Error de conexión')).toBeVisible();
  });

  test('should redirect authenticated users away from login', async ({ page }) => {
    // Simular usuario autenticado
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'fake-token');
    });

    // Ir a login
    await page.goto('/login');

    // Debería redirigir automáticamente
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simular desconexión de red (esto requiere configuración específica)
    // Por ahora, probamos con credenciales que causen timeout

    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');

    // Simular desconexión cortando las requests de red
    await page.route('**/api/auth/login', async route => {
      // Simular timeout de red
      setTimeout(() => {
        route.abort('failed');
      }, 100);
    });

    await page.locator('button[type="submit"]').click();

    // Verificar manejo de error de red
    await expect(page.locator('text=Error de conexión')).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');

    // Simular delay en la respuesta
    await page.route('**/api/auth/login', async route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: { id: '1', username: 'admin', role: 'admin' },
              token: 'fake-token'
            }
          })
        });
      }, 2000); // 2 segundos de delay
    });

    await page.locator('button[type="submit"]').click();

    // Verificar que el botón está deshabilitado durante loading
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    // Esperar a que termine
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });
});