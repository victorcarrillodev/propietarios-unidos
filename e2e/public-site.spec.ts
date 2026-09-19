import { test, expect } from "@playwright/test";

test.describe("Sitio Público - Navegación y Páginas Principales", () => {
  test("Página de inicio carga correctamente con encabezado, hero y secciones", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Propietarios Unidos/i);

    // Encabezado y logo
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.getByText("Propietarios Unidos")).toBeVisible();

    // H1 en portada
    const h1 = page.locator("h1");
    await expect(h1).toContainText("bosque");

    // Botones de llamada a la acción en la sección principal
    const main = page.locator("main");
    await expect(main.getByRole("link", { name: "Conócenos" })).toBeVisible();
    await expect(main.getByRole("link", { name: /Reportar una incidencia/i }).first()).toBeVisible();

    // Secciones
    await expect(page.getByText("Cuidar el bosque es cuidar nuestra casa")).toBeVisible();
    await expect(page.getByText("Trabajo constante por La Primavera")).toBeVisible();

    // Pie de página
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByText("Todos los derechos reservados.")).toBeVisible();
  });

  test("Página 'Quiénes somos' carga con misión y estructura", async ({ page }) => {
    await page.goto("/quienes-somos");
    await expect(page).toHaveTitle(/Quiénes somos/i);
    await expect(page.locator("h1")).toContainText(/Propietarios unidos/i);
    await expect(page.getByText(/En pocas palabras/i)).toBeVisible();
  });

  test("Página 'El bosque' carga información del área natural protegida", async ({ page }) => {
    await page.goto("/el-bosque");
    await expect(page).toHaveTitle(/El bosque/i);
    await expect(page.locator("h1")).toContainText("La Primavera");
  });

  test("Página 'Qué hacemos' carga programas y bitácora", async ({ page }) => {
    await page.goto("/que-hacemos");
    await expect(page).toHaveTitle(/Qué hacemos/i);
    await expect(page.locator("h1")).toContainText(/Trabajo en campo/i);
    await expect(page.getByText(/Registro de nuestras acciones/i)).toBeVisible();
  });

  test("Página 'Noticias' lista noticias o publicaciones", async ({ page }) => {
    await page.goto("/noticias");
    await expect(page).toHaveTitle(/Noticias/i);
    await expect(page.locator("h1")).toContainText("Noticias");
  });

  test("Página 'Eventos' muestra agenda y actividades", async ({ page }) => {
    await page.goto("/eventos");
    await expect(page).toHaveTitle(/Eventos/i);
    await expect(page.locator("h1")).toContainText("Eventos");
  });

  test("Página 'Transparencia' muestra informes y documentos", async ({ page }) => {
    await page.goto("/transparencia");
    await expect(page).toHaveTitle(/Transparencia/i);
    await expect(page.locator("h1")).toContainText(/Cuentas claras/i);
  });

  test("Página 'Aviso de privacidad' muestra el aviso legal", async ({ page }) => {
    await page.goto("/aviso-de-privacidad");
    await expect(page).toHaveTitle(/Aviso de privacidad/i);
    await expect(page.locator("h1")).toContainText("Aviso de privacidad");
  });
});

test.describe("Sitio Público - Formularios Interactivos", () => {
  test("Formulario de reporte ciudadano muestra campos y valida requeridos", async ({ page }) => {
    await page.goto("/reportar");
    await expect(page.locator("h1")).toContainText(/Reporta/i);

    // Verificar campos presentes
    await expect(page.getByLabel(/¿Qué quieres reportar\?/i)).toBeVisible();
    await expect(page.getByLabel(/¿Dónde\?/i)).toBeVisible();
    await expect(page.getByLabel(/Describe lo que viste/i)).toBeVisible();

    // Botón de envío
    const submitBtn = page.getByRole("button", { name: /Enviar reporte/i });
    await expect(submitBtn).toBeVisible();
  });

  test("Formulario de contacto muestra campos y valida datos", async ({ page }) => {
    await page.goto("/contacto");
    await expect(page.locator("h1")).toContainText(/Hablemos/i);

    await expect(page.getByLabel(/Nombre/i)).toBeVisible();
    await expect(page.getByLabel(/Correo electrónico/i)).toBeVisible();
    await expect(page.getByLabel(/Mensaje/i)).toBeVisible();
  });

  test("Formulario de solicitud de unión muestra opciones", async ({ page }) => {
    await page.goto("/unete");
    await expect(page.locator("h1")).toContainText(/Súmate/i);
    await expect(page.getByLabel(/Nombre completo/i)).toBeVisible();
  });
});
