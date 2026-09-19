import { test, expect } from "@playwright/test";

test.describe("Panel de Administración - Autenticación y Flujos de Trabajo", () => {
  test("Redirige a /admin/login al intentar acceder a /admin sin sesión", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/.*\/admin\/login.*/);
    await expect(page.locator("h1")).toContainText(/Panel de administración/i);
  });

  test("Muestra error ante credenciales incorrectas", async ({ page }) => {
    await page.goto("/admin/login");

    await page.fill("input[name='email']", "admin@propietariosunidos.mx");
    await page.fill("input[name='password']", "clave-equivocada-1234");
    await page.click("button[type='submit']");

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(/incorrectos|inválidos/i);
  });

  test("Inicia sesión exitosamente con credenciales válidas y carga el panel", async ({ page }) => {
    await page.goto("/admin/login");

    await page.fill("input[name='email']", "admin@propietariosunidos.mx");
    await page.fill("input[name='password']", "gK43zbbSc5SIXxLG");
    await page.click("button[type='submit']");

    // Debe redirigir al panel de administración
    await expect(page).toHaveURL(/\/admin(\/)?$/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText(/Hola,/i);

    // Verificar componentes del dashboard
    await expect(page.getByText(/Miembros activos/i)).toBeVisible();
    await expect(page.getByText(/Ingresos/i).first()).toBeVisible();

    // Barra lateral de navegación
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Miembros" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Pagos" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Gastos" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Bitácora" })).toBeVisible();

    // Navegación a Miembros
    await sidebar.getByRole("link", { name: "Miembros" }).click();
    await expect(page).toHaveURL(/.*\/admin\/miembros.*/);
    await expect(page.locator("h1")).toContainText("Miembros");

    // Navegación a Pagos
    await sidebar.getByRole("link", { name: "Pagos" }).click();
    await expect(page).toHaveURL(/.*\/admin\/pagos.*/);
    await expect(page.locator("h1")).toContainText("Pagos");

    // Navegación a Gastos
    await sidebar.getByRole("link", { name: "Gastos" }).click();
    await expect(page).toHaveURL(/.*\/admin\/gastos.*/);
    await expect(page.locator("h1")).toContainText("Gastos");

    // Navegación a Bitácora
    await sidebar.getByRole("link", { name: "Bitácora" }).click();
    await expect(page).toHaveURL(/.*\/admin\/bitacora.*/);
    await expect(page.locator("h1")).toContainText("Bitácora");

    // Cerrar sesión
    await sidebar.getByRole("button", { name: /Cerrar sesión/i }).click();
    await expect(page).toHaveURL(/.*\/admin\/login.*/);
  });
});
