# 💸 Mis Cuentas

Mi app personal para llevar al día gastos, ingresos, **ahorros en dólares** y gastos en dólares: los cargo hablándole a Siri, se guardan en una planilla de Google y los veo con gráficos en una web propia.

```
 🎙️ Siri ("gasté 8500 en el súper con débito")
        │
        ▼
 📊 Google Sheets + Apps Script  ◄──►  📱 Web en GitHub Pages
    (donde viven los datos)            (resumen, gráficos, fijos)
```

**Todo es gratis.** No hace falta saber programar: son 4 pasos de copiar y pegar (unos 20 minutos).

---

## Paso 1 · Crear la planilla (Google Sheets)

1. Entrá a [sheets.new](https://sheets.new) y ponele de nombre **Mis Cuentas**.
2. Arriba: **Extensiones → Apps Script**. Se abre otra pestaña.
3. Borrá todo lo que haya en el archivo `Código.gs` y pegá **todo** el contenido de `Codigo.gs` de este repositorio.
4. Tocá el ícono 💾 (Guardar).
5. Arriba, en el menú desplegable de funciones, elegí **`configurar`** y tocá **▶ Ejecutar**.
6. Te va a pedir permisos:
   - **Revisar permisos** → elegí tu cuenta.
   - Va a aparecer *"Google no verificó esta app"* (es normal, la app sos vos): tocá **Configuración avanzada → Ir a Mis Cuentas (no seguro) → Permitir**.
7. Abajo, en el **Registro de ejecución**, vas a ver: `✅ ¡Listo! Tu clave secreta es: xxxxxxxx`. **Copiala** y guardala (en Notas, por ejemplo).

> Si la perdés, en la planilla aparece un menú nuevo **💸 Mis Cuentas → Ver mi clave secreta** (recargá la planilla si no lo ves).

La planilla ahora tiene 5 hojas: **Movimientos**, **Fijos**, **Categorías**, **Medios de pago** y **Ajustes**.

## Paso 2 · Publicar el "cerebro" (Aplicación web)

1. En Apps Script, arriba a la derecha: **Implementar → Nueva implementación**.
2. En el engranaje ⚙️ de "Seleccionar tipo", elegí **Aplicación web**.
3. Completá así:
   - Descripción: `Mis Cuentas`
   - **Ejecutar como: Yo**
   - **Quién tiene acceso: Cualquier usuario** *(tranqui: sin tu clave secreta nadie puede leer ni escribir nada)*
4. **Implementar** → copiá la **URL de la aplicación web** (termina en `/exec`). Guardala junto a la clave.

## Paso 3 · Subir la web a GitHub Pages

1. En GitHub (usuario **Valenmir04**), tocá **+ → New repository**.
   - Nombre: `mis-cuentas` · **Public** · Create repository.
   *(Puede ser público: en el código no hay ningún dato tuyo ni la clave.)*
2. **uploading an existing file** → arrastrá `index.html`, `icon.png`, `Codigo.gs` y `README.md` → **Commit changes**.
3. Andá a **Settings → Pages**:
   - Source: **Deploy from a branch** · Branch: **main** · carpeta **/ (root)** → **Save**.
4. En 1–2 minutos tu app está en: **https://valenmir04.github.io/mis-cuentas/**

### En el iPhone
1. Abrí ese link en **Safari**.
2. Pegá la **URL** del Paso 2 y la **clave secreta** → **Conectar mi planilla**.
3. Tocá **Compartir → Agregar a pantalla de inicio**. Queda como una app más, con su ícono.
4. Andá a **Ajustes** y cargá tus puntos de partida:
   - **Tu plata en pesos:** cuánto tenés disponible hoy (banco + billeteras + efectivo) y la fecha.
   - **Tu cuenta en dólares:** cuántos dólares tenés ahorrados.

> ¿Querés verla antes de configurar nada? En la pantalla de inicio tocá **"Ver la app con datos de ejemplo"**.

## Paso 4 · El Atajo de Siri 🎙️

En el iPhone abrí la app **Atajos** → **+** (nuevo atajo) y agregá estas 3 acciones:

| # | Acción (buscala por nombre) | Cómo configurarla |
|---|---|---|
| 1 | **Dictar texto** | Idioma: *Español (Argentina)* · Dejar de escuchar: *Después de una pausa* |
| 2 | **Obtener contenido de URL** | URL: la del Paso 2 · Tocá **Mostrar más** → Método: **POST** · Cuerpo de la solicitud: **JSON** · agregá 4 campos de **Texto**:<br>`token` → tu clave secreta<br>`accion` → `texto`<br>`responder` → `texto`<br>`texto` → la variable **Texto dictado** (tocá y elegila) |
| 3 | **Mostrar resultado** | Que muestre **Contenido de la URL**. Siri te lo lee en voz alta. |

Arriba, ponele de nombre **Anotar gasto** y listo.

**Cómo se usa:** *"Oye Siri, anotar gasto"* → Siri escucha → decís la frase → te confirma lo que entendió.

### Segundo atajo: "Anotar ingreso"
1. En la app **Atajos**, mantené apretado el atajo **Anotar gasto** → **Duplicar**.
2. Abrí la copia y cambiale el nombre a **Anotar ingreso**.
3. En la acción **Obtener contenido de URL**, tocá **Añadir campo nuevo → Texto** y agregá: `tipo` → `ingreso`.
4. **OK**. Ahora *"Oye Siri, anotar ingreso"* → *"950 mil de sueldo"* se anota siempre como ingreso.

> Tip: si querés, hacé un tercer atajo llamado **"Cuánto gasté"** igual al anterior pero sin el paso 1 y con `texto` fijo en `cuanto llevo gastado`.

### Frases que entiende

| Decís… | Se anota como |
|---|---|
| gasté 8500 en el súper con débito | Gasto · $8.500 · Supermercado · Débito |
| ayer gasté 5 mil en Uber con crédito | Gasto de **ayer** · $5.000 · Transporte · Crédito |
| zapatillas 85.000 en 3 cuotas con visa | Gasto · $85.000 · Ropa · Crédito · **3 cuotas** |
| pagué la luz 31.200, **gasto fijo** | **Marca el fijo "Luz" como pagado** este mes con $31.200 |
| pagué el alquiler **fijo** | Marca "Alquiler" como pagado con su monto estimado |
| pagué el gimnasio 35 mil, **gasto fijo** | Si no tenías un fijo "Gimnasio", **lo crea** y lo marca pagado |
| pagué la luz 31.200 (sin decir "fijo") | Gasto **variable**. Siri te avisa si tenés un fijo "Luz" pendiente |
| *(anotar ingreso)* 950 mil de sueldo | Ingreso · $950.000 · Sueldo |
| cobré 950 mil de sueldo | **Ingreso** · $950.000 · Sueldo |
| me pagaron 200 lucas de Villa Tamen por transferencia | Ingreso · $200.000 · Freelance · Transferencia |
| gasté 20 dólares en ChatGPT | Gasto en **US$** desde la cuenta en dólares |
| compré 200 dólares a 1.250.000 pesos | **Ahorro**: +US$ 200 a tu cuenta, −$1.250.000 de tus pesos |
| compré 100 dólares a 1450 | Ahorro: +US$ 100 (calcula solo $145.000) |
| ahorré 300 dólares | Ahorro: +US$ 300 (sin monto en pesos) |
| vendí 100 dólares a 1400 | Venta: −US$ 100 de tu cuenta, +$140.000 a tus pesos |
| cuántos dólares tengo | Te dice cuánto ahorraste este mes y el saldo de tu cuenta en dólares |
| cuánto llevo gastado | Te dice gastos, ingresos y qué fijos te faltan pagar |

Entiende: montos con o sin punto (`8.500`, `8500`), "mil", "lucas", "ayer", "anteayer", cuotas, dólares, y detecta solo si es ingreso (cobré, me pagaron, sueldo, recibí…).

---

## Cómo funciona

**Gastos fijos vs. variables.** En la pestaña **Fijos** cargás una sola vez tus gastos de todos los meses (alquiler, expensas, luz, internet, Netflix…) con su monto estimado, día de vencimiento, medio de pago y si tienen **débito automático**. Cada mes:
- Tocás el círculo ⭕ para marcarlo como pagado (o le decís a Siri "pagué la luz").
- Los que tienen **débito automático se marcan solos** el día del vencimiento a las 9 a. m. Si el monto fue distinto, tocás el monto y lo corregís.
- Si se pasa el día y no está pagado, aparece en rojo como **Vencido**.

Todo lo demás cuenta como **variable**.

**Pesos y dólares por separado.** Arriba del Resumen hay un selector **🇦🇷 Pesos / 🇺🇸 Dólares**:
- **Pesos:** lo de siempre. Lo que pasás a dólares aparece como **Ahorro** (no como gasto) y se descuenta de lo que te queda en el mes.
- **Dólares:** el saldo de tu cuenta en dólares, cuánto ahorraste y gastaste este mes, la cotización promedio a la que compraste, cuánto ahorraste en el año y un gráfico de cómo crece tu ahorro mes a mes.

El saldo en dólares se calcula así: lo que tenías al empezar (en Ajustes) + dólares comprados + ingresos en dólares − gastos en dólares − dólares vendidos.

**Fijos en dólares.** Al crear un gasto fijo elegís si **se paga en pesos o en dólares**. Tus suscripciones que salen de la cuenta en dólares (ej. ChatGPT, iCloud) van en dólares con medio de pago **Cuenta en dólares** y débito automático. En la pestaña Fijos se ven en dos grupos separados.

**Resumen en pesos.** Cuánto te queda en el mes, ingresos vs. gastos, fijos vs. variables, en qué categorías se fue la plata, por medio de pago, los últimos 6 meses y cuánto te quedaría después de pagar los fijos pendientes. Con las flechas ‹ › navegás meses anteriores.

**Personalizar.** En la planilla podés editar:
- **Categorías**: nombre, emoji, color y **palabras clave** (las que usa Siri para adivinar la categoría). Ej: agregá "dietética del barrio" a Supermercado.
- **Medios de pago**: agregá tus tarjetas o billeteras con sus palabras clave (ej. `Ualá` → `uala`).

También podés cargar o corregir movimientos directo en la planilla: la app los toma igual.

## Si algo no anda

| Problema | Solución |
|---|---|
| "Clave incorrecta" | Revisá que la clave en la app y en el Atajo sea exactamente la del Paso 1. |
| "La URL no parece ser la de tu Apps Script" | Tiene que ser la URL que termina en `/exec` (no la del editor). |
| Cambié `Codigo.gs` y no se nota | **Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar**. Así la URL no cambia. |
| Siri anota la categoría equivocada | Agregá la palabra a la columna "Palabras clave" de la categoría correcta. |
| No entendió el monto | Decí el número claro: "8500" o "8 mil". |
