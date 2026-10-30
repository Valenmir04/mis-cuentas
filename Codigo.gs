/**
 * ============================================================
 *  MIS CUENTAS · Backend en Google Sheets + Apps Script
 * ============================================================
 *  1. Pegá TODO este archivo en tu planilla: Extensiones → Apps Script.
 *  2. Elegí la función "configurar" arriba y tocá ▶ Ejecutar (una sola vez).
 *  3. Implementar → Nueva implementación → Aplicación web
 *     (Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario).
 *  La guía completa está en el README.
 * ============================================================
 */

const TZ = 'America/Argentina/Buenos_Aires';

const HOJAS = { MOV: 'Movimientos', FIJ: 'Fijos', CAT: 'Categorías', MED: 'Medios de pago', AJU: 'Ajustes' };

const COLS = {
  MOV: ['id', 'fecha', 'mes', 'tipo', 'monto', 'moneda', 'descripcion', 'categoria', 'medio', 'cuotas', 'idFijo', 'origen', 'creado', 'pesos'],
  FIJ: ['id', 'nombre', 'monto', 'dia', 'categoria', 'medio', 'debitoAutomatico', 'activo', 'notas', 'moneda'],
  CAT: ['nombre', 'tipo', 'emoji', 'color', 'palabrasClave'],
  MED: ['nombre', 'palabrasClave'],
  AJU: ['clave', 'valor', 'nota']
};

const ENCABEZADOS = {
  MOV: ['ID', 'Fecha', 'Mes', 'Tipo', 'Monto', 'Moneda', 'Descripción', 'Categoría', 'Medio de pago', 'Cuotas', 'ID fijo', 'Origen', 'Creado', 'Pesos (compra/venta de USD)'],
  FIJ: ['ID', 'Nombre', 'Monto estimado', 'Día de vencimiento', 'Categoría', 'Medio de pago', 'Débito automático', 'Activo', 'Notas', 'Moneda'],
  CAT: ['Nombre', 'Tipo (gasto / ingreso)', 'Emoji', 'Color', 'Palabras clave (separadas por coma)'],
  MED: ['Nombre', 'Palabras clave (separadas por coma)'],
  AJU: ['Clave', 'Valor', 'Qué es']
};

const AJUSTES_INICIALES = [
  ['saldoInicialUSD', 0, 'Dólares que ya tenías ahorrados antes de empezar a usar la app'],
  ['saldoInicialARS', 0, 'Pesos que tenías disponibles en la fecha de abajo'],
  ['fechaInicialARS', '', 'Desde esta fecha se suman ingresos y se restan gastos en pesos (aaaa-mm-dd)'],
  ['deudaInicialTarjeta', 0, 'Tarjeta: lo que faltaba pagar del último resumen cerrado, en la fecha de la tarjeta'],
  ['consumosInicialesTarjeta', 0, 'Tarjeta: lo que ya llevabas gastado en el resumen en curso, en la fecha de la tarjeta'],
  ['cierreTarjeta', '', 'Tarjeta: día del mes en que cierra el resumen'],
  ['vencimientoTarjeta', '', 'Tarjeta: día del mes en que vence (se paga) el resumen'],
  ['fechaTarjeta', '', 'Tarjeta: desde esta fecha se suman las compras con crédito (aaaa-mm-dd)']
];

// Podés editar todo esto después directamente en la planilla.
const CATEGORIAS_INICIALES = [
  ['Supermercado', 'gasto', '🛒', '#2F5D50', 'super, supermercado, chino, almacen, verduleria, carniceria, fiambreria, panaderia, dietetica, coto, jumbo, carrefour, disco, changomas, vea, mayorista, compras'],
  ['Comida afuera', 'gasto', '🍕', '#C2693E', 'delivery, rappi, pedidosya, pedidos ya, restaurante, resto, bar, cafe, cafecito, almuerzo, cena, merienda, desayuno, birra, cerveza, helado, pizza, empanadas, hamburguesa, sushi, mcdonalds, starbucks, comida'],
  ['Transporte', 'gasto', '🚌', '#1F3A5F', 'sube, colectivo, bondi, subte, tren, uber, cabify, didi, taxi, remis, nafta, combustible, peaje, estacionamiento, cochera'],
  ['Casa y servicios', 'gasto', '🏠', '#7A2E3A', 'alquiler, expensas, luz, gas, edenor, edesur, metrogas, naturgy, aysa, abl, internet, wifi, fibertel, telecentro, celular, telefono, movistar, limpieza, ferreteria, bazar'],
  ['Salud', 'gasto', '💊', '#4E8C7A', 'farmacia, remedio, remedios, medicamento, medico, medica, dentista, odontologo, prepaga, obra social, osde, swiss medical, galeno, omint, psicologa, psicologo, terapia, analisis, oculista, lentes'],
  ['Suscripciones', 'gasto', '📱', '#6B5B95', 'netflix, spotify, disney, hbo, prime video, amazon prime, youtube premium, icloud, google one, chatgpt, claude, framer, canva, suscripcion, apple music, paramount'],
  ['Ropa y cuidado personal', 'gasto', '👗', '#C9748F', 'ropa, zapatillas, zapatos, remera, pantalon, jean, vestido, campera, buzo, cartera, peluqueria, corte de pelo, unas, manicura, depilacion, maquillaje, perfume, crema, skincare, shein, zara'],
  ['Salidas y ocio', 'gasto', '🎬', '#D4A03A', 'cine, teatro, recital, show, entrada, entradas, boliche, salida, previa, juego, videojuego, museo'],
  ['Educación', 'gasto', '📚', '#3E6E9E', 'curso, facultad, uade, taller, capacitacion, libro, libros, libreria, clase, clases'],
  ['Deporte', 'gasto', '🏋️', '#5A8F3C', 'gimnasio, gym, pilates, yoga, futbol, padel, natacion, entrenador'],
  ['Mascotas', 'gasto', '🐾', '#8C6A4F', 'veterinaria, veterinario, perro, gato, alimento balanceado, piedritas, mascota'],
  ['Regalos', 'gasto', '🎁', '#B5485D', 'regalo, regalos, cumpleanos, cumple'],
  ['Viajes', 'gasto', '✈️', '#2E8BA8', 'viaje, pasaje, pasajes, vuelo, hotel, hostel, airbnb, micro, valija, excursion'],
  ['Impuestos y bancos', 'gasto', '🧾', '#6E6A60', 'monotributo, afip, arca, impuesto, impuestos, comision, mantenimiento de cuenta, intereses, sellos'],
  ['Otros', 'gasto', '📦', '#A39E93', ''],
  ['Sueldo', 'ingreso', '💼', '#2F5D50', 'sueldo, salario, aguinaldo, tip travel, recibo'],
  ['Freelance', 'ingreso', '💻', '#1F3A5F', 'freelance, cliente, clienta, factura, social media, community, villa tamen, proyecto'],
  ['Otros ingresos', 'ingreso', '💰', '#B8862F', 'venta, vendi, reintegro, devolucion, devolvieron, reintegraron, prestamo, rendimiento, plazo fijo']
];

// Se revisan en orden: Débito va antes que Crédito para que "visa débito" sea débito.
const MEDIOS_INICIALES = [
  ['Cuenta en dólares', 'cuenta en dolares, caja en dolares, caja de ahorro en dolares, cuenta dolares, tarjeta en dolares'],
  ['Efectivo', 'efectivo, cash, billete, billetes'],
  ['Débito', 'debito, tarjeta de debito'],
  ['Crédito', 'credito, tarjeta de credito, visa, mastercard, master, amex, american express'],
  ['Mercado Pago', 'mercado pago, mercadopago, mp'],
  ['Transferencia', 'transferencia, transferi, cbu, alias'],
  ['MODO', 'modo'],
  ['Cuenta DNI', 'cuenta dni'],
  ['Sin especificar', '']
];

/* ============================================================
 *  CONFIGURACIÓN (se ejecuta una vez)
 * ============================================================ */

function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TZ);

  const hMov = asegurarHoja_(ss, HOJAS.MOV, ENCABEZADOS.MOV, []);
  hMov.getRange('B:C').setNumberFormat('@');
  hMov.getRange('E:E').setNumberFormat('#,##0.00');
  const hFij = asegurarHoja_(ss, HOJAS.FIJ, ENCABEZADOS.FIJ, []);
  hFij.getRange('C:C').setNumberFormat('#,##0.00');
  asegurarHoja_(ss, HOJAS.CAT, ENCABEZADOS.CAT, CATEGORIAS_INICIALES);
  const hMed = asegurarHoja_(ss, HOJAS.MED, ENCABEZADOS.MED, MEDIOS_INICIALES);
  // Si la planilla viene de la versión anterior, agrego "Cuenta en dólares" arriba de todo
  const nombresMed = hMed.getLastRow() > 1 ? hMed.getRange(2, 1, hMed.getLastRow() - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
  if (nombresMed.indexOf('Cuenta en dólares') < 0) {
    hMed.insertRowBefore(2);
    hMed.getRange(2, 1, 1, 2).setValues([MEDIOS_INICIALES[0]]).setFontWeight('normal').setBackground(null).setFontColor(null);
  }
  const hAju = asegurarHoja_(ss, HOJAS.AJU, ENCABEZADOS.AJU, AJUSTES_INICIALES);
  hAju.getRange('B:B').setNumberFormat('@');
  hMov.getRange('N:N').setNumberFormat('#,##0.00');

  ['Hoja 1', 'Hoja1', 'Sheet1'].forEach(function (n) {
    const h = ss.getSheetByName(n);
    if (h && h.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(h);
  });

  // Revisión diaria de débitos automáticos (9 a. m.)
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'procesarDebitosAutomaticos'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('procesarDebitosAutomaticos').timeBased().everyDays(1).atHour(9).inTimezone(TZ).create();

  const token = obtenerToken_();
  Logger.log('✅ ¡Listo! Tu clave secreta es: ' + token);
  try {
    SpreadsheetApp.getUi().alert('¡Listo!\n\nTu clave secreta es:\n\n' + token + '\n\nLa vas a pegar en la app y en el Atajo de Siri.');
  } catch (e) { /* desde el editor no hay ventanita: la clave queda en el registro */ }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('💸 Mis Cuentas')
    .addItem('Ver mi clave secreta', 'mostrarClave')
    .addItem('Registrar débitos automáticos ahora', 'procesarDebitosAutomaticos')
    .addToUi();
}

function mostrarClave() {
  SpreadsheetApp.getUi().alert('Tu clave secreta es:\n\n' + obtenerToken_());
}

function obtenerToken_() {
  const props = PropertiesService.getScriptProperties();
  let token = props.getProperty('TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
    props.setProperty('TOKEN', token);
  }
  return token;
}

function asegurarHoja_(ss, nombre, encabezados, filas) {
  let h = ss.getSheetByName(nombre);
  if (!h) h = ss.insertSheet(nombre);
  if (h.getLastRow() === 0) {
    h.getRange(1, 1, 1, encabezados.length).setValues([encabezados])
      .setFontWeight('bold').setBackground('#2F5D50').setFontColor('#FFFFFF');
    h.setFrozenRows(1);
    if (filas.length) h.getRange(2, 1, filas.length, encabezados.length).setValues(filas);
    h.autoResizeColumns(1, encabezados.length);
  } else if (h.getLastColumn() < encabezados.length) {
    // hoja creada con una versión anterior: agrego las columnas nuevas
    h.getRange(1, 1, 1, encabezados.length).setValues([encabezados])
      .setFontWeight('bold').setBackground('#2F5D50').setFontColor('#FFFFFF');
  }
  return h;
}

/* ============================================================
 *  PUNTOS DE ENTRADA (la app y Siri hablan con esto)
 * ============================================================ */

function doGet() {
  return json_({ ok: true, app: 'Mis Cuentas', mensaje: 'Funciona. Usá esta URL en la app y en el Atajo.' });
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'El pedido no es válido.' }); }

  if (String(body.token || '').trim() !== obtenerToken_()) {
    return responder_(body, { ok: false, error: 'Clave incorrecta.', mensaje: 'La clave secreta no coincide. Revisá el atajo.' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return responder_(body, ejecutar_(body));
  } catch (err) {
    return responder_(body, { ok: false, error: err.message, mensaje: 'Ups, algo falló: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

function ejecutar_(b) {
  const conDatos = function (extra) { return Object.assign({ ok: true, datos: datos_() }, extra || {}); };
  switch (b.accion) {
    case 'datos': return conDatos();
    case 'agregar': agregarMov_(b.movimiento || {}, 'app'); return conDatos({ mensaje: 'Guardado' });
    case 'editar': editarMov_(b.id, b.movimiento || {}); return conDatos({ mensaje: 'Actualizado' });
    case 'borrar': borrarMov_(b.id); return conDatos({ mensaje: 'Borrado' });
    case 'pagarFijo': pagarFijo_(b.idFijo, b.mes, b.monto, b.fecha, 'app'); return conDatos({ mensaje: 'Marcado como pagado' });
    case 'despagarFijo': despagarFijo_(b.idFijo, b.mes); return conDatos({ mensaje: 'Desmarcado' });
    case 'guardarFijo': guardarFijo_(b.fijo || {}); return conDatos({ mensaje: 'Gasto fijo guardado' });
    case 'borrarFijo': borrarFijo_(b.id); return conDatos({ mensaje: 'Gasto fijo eliminado' });
    case 'guardarAjustes': guardarAjustes_(b.ajustes || {}); return conDatos({ mensaje: 'Ajustes guardados' });
    case 'texto': {
      const desdeSiri = b.responder === 'texto';
      const r = procesarTexto_(b.texto, desdeSiri ? 'siri' : 'app', b.tipo);
      return desdeSiri ? r : Object.assign(r, { datos: datos_() });
    }
    default: throw new Error('Acción desconocida: ' + b.accion);
  }
}

function responder_(body, r) {
  if (body && body.responder === 'texto') {
    return ContentService.createTextOutput(r.mensaje || r.error || 'Listo');
  }
  return json_(r);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
 *  LECTURA Y ESCRITURA
 * ============================================================ */

function datos_() {
  return {
    categorias: leer_('CAT'),
    medios: leer_('MED'),
    fijos: leer_('FIJ'),
    movimientos: leer_('MOV'),
    ajustes: leerAjustes_(),
    planilla: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    hoy: hoy_()
  };
}

function leerAjustes_() {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJAS.AJU);
  const res = { saldoInicialUSD: 0, saldoInicialARS: 0, fechaInicialARS: '', deudaInicialTarjeta: 0, consumosInicialesTarjeta: 0, cierreTarjeta: 0, vencimientoTarjeta: 0, fechaTarjeta: '' };
  const NUMEROS = ['saldoInicialUSD', 'saldoInicialARS', 'deudaInicialTarjeta', 'consumosInicialesTarjeta', 'cierreTarjeta', 'vencimientoTarjeta'];
  if (!h || h.getLastRow() < 2) return res;
  h.getRange(2, 1, h.getLastRow() - 1, 2).getValues().forEach(function (r) {
    if (NUMEROS.indexOf(r[0]) >= 0) res[r[0]] = Number(String(r[1]).replace(',', '.')) || 0;
    if (r[0] === 'fechaInicialARS' || r[0] === 'fechaTarjeta') res[r[0]] = r[1] instanceof Date ? Utilities.formatDate(r[1], TZ, 'yyyy-MM-dd') : String(r[1]).trim();
  });
  return res;
}

function guardarAjustes_(a) {
  const h = hoja_('AJU');
  const poner = function (clave, valor) {
    const n = h.getLastRow();
    const claves = n > 1 ? h.getRange(2, 1, n - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
    const i = claves.indexOf(clave);
    const nota = (AJUSTES_INICIALES.filter(function (x) { return x[0] === clave; })[0] || [])[2] || '';
    if (i >= 0) h.getRange(i + 2, 2).setNumberFormat('@').setValue(String(valor));
    else { h.appendRow([clave, String(valor), nota]); h.getRange(h.getLastRow(), 2).setNumberFormat('@'); }
  };
  if (a.saldoInicialUSD !== undefined) poner('saldoInicialUSD', Math.abs(Number(a.saldoInicialUSD)) || 0);
  if (a.saldoInicialARS !== undefined) {
    poner('saldoInicialARS', Number(a.saldoInicialARS) || 0);
    const f = /^\d{4}-\d{2}-\d{2}$/.test(String(a.fechaInicialARS || '')) ? a.fechaInicialARS : hoy_();
    poner('fechaInicialARS', f);
  }
  if (a.deudaInicialTarjeta !== undefined) poner('deudaInicialTarjeta', Math.abs(Number(a.deudaInicialTarjeta)) || 0);
  if (a.consumosInicialesTarjeta !== undefined) poner('consumosInicialesTarjeta', Math.abs(Number(a.consumosInicialesTarjeta)) || 0);
  if (a.cierreTarjeta !== undefined) poner('cierreTarjeta', Math.min(31, Math.max(1, Math.round(Number(a.cierreTarjeta) || 1))));
  if (a.vencimientoTarjeta !== undefined) poner('vencimientoTarjeta', Math.min(31, Math.max(1, Math.round(Number(a.vencimientoTarjeta) || 1))));
  if (a.fechaTarjeta !== undefined) poner('fechaTarjeta', /^\d{4}-\d{2}-\d{2}$/.test(String(a.fechaTarjeta)) ? a.fechaTarjeta : hoy_());
}

/* ---------- Tarjeta de crédito ---------- */

/** ¿Este medio de pago es una tarjeta de crédito? ("Crédito", "Visa Crédito", "Master crédito"…) */
function esCredito_(medio) { return /cr[eé]dito/i.test(String(medio || '')); }

/** Gasto en pesos con tarjeta de crédito: se suma a la tarjeta y no a tu plata hasta que pagás el resumen. */
function vaATarjeta_(m) { return m.tipo === 'gasto' && m.moneda !== 'USD' && esCredito_(m.medio); }

/**
 * Estado de la tarjeta de crédito por resúmenes. Cada resumen ("ciclo") se identifica por el mes en que cierra (aaaa-mm).
 * Una compra va al resumen que cierra en la primera fecha de cierre igual o posterior a la compra; la cuota k va k-1 resúmenes después.
 * Los pagos se aplican primero a los resúmenes más viejos. Devuelve null si no configuraste el día de cierre.
 */
function calcularTarjeta(movs, aj, hoy) {
  var pad = function (n) { return ('0' + n).slice(-2); };
  var mover = function (mes, n) { var t = +mes.slice(0, 4) * 12 + (+mes.slice(5, 7) - 1) + n; return Math.floor(t / 12) + '-' + pad(t % 12 + 1); };
  var dias = function (mes) { return new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5, 7), 0)).getUTCDate(); };
  var C = Math.min(31, Math.max(0, Math.round(Number(aj.cierreTarjeta) || 0)));
  if (!C) return null;
  var V = Math.min(31, Math.max(1, Math.round(Number(aj.vencimientoTarjeta) || 0) || Math.min(31, C + 10)));
  var cierre = function (ciclo) { return ciclo + '-' + pad(Math.min(C, dias(ciclo))); };
  var vence = function (ciclo) { var mv = V > C ? ciclo : mover(ciclo, 1); return mv + '-' + pad(Math.min(V, dias(mv))); };
  var cicloDe = function (f) { var mes = f.slice(0, 7); return f <= cierre(mes) ? mes : mover(mes, 1); };
  var esCred = function (m) { return m.tipo === 'gasto' && m.moneda !== 'USD' && /cr[eé]dito/i.test(String(m.medio || '')); };
  var desde = aj.fechaTarjeta || aj.fechaInicialARS || '';
  var ms = movs.filter(function (m) { return m.fecha >= desde; });
  var pagos = ms.filter(function (m) { return m.tipo === 'pagoTarjeta'; }).sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; });
  var ciclos = {};
  var add = function (ciclo, monto, item) {
    if (!ciclos[ciclo]) ciclos[ciclo] = { ciclo: ciclo, monto: 0, items: [] };
    ciclos[ciclo].monto += monto;
    ciclos[ciclo].items.push(item);
  };
  var cicloIni = cicloDe(desde || hoy);
  var dIni = Number(aj.deudaInicialTarjeta) || 0, cIni = Number(aj.consumosInicialesTarjeta) || 0;
  if (dIni) add(mover(cicloIni, -1), dIni, { descripcion: 'Resumen que ya había cerrado', fecha: desde, monto: dIni, n: 1, cuotaNro: 1, inicial: true });
  if (cIni) add(cicloIni, cIni, { descripcion: 'Consumos que ya tenías', fecha: desde, monto: cIni, n: 1, cuotaNro: 1, inicial: true });
  ms.filter(esCred).forEach(function (m) {
    var n = Math.max(1, Number(m.cuotas) || 1), c0 = cicloDe(m.fecha);
    for (var k = 0; k < n; k++) add(mover(c0, k), m.monto / n, { id: m.id, descripcion: m.descripcion || m.categoria, fecha: m.fecha, monto: m.monto, n: n, cuotaNro: k + 1 });
  });
  var resto = pagos.reduce(function (a, p) { return a + p.monto; }, 0);
  var lista = Object.keys(ciclos).sort().map(function (k) {
    var c = ciclos[k];
    c.pagado = Math.min(resto, c.monto); resto -= c.pagado;
    c.pendiente = c.monto - c.pagado; c.cierra = cierre(c.ciclo); c.vence = vence(c.ciclo);
    return c;
  });
  var abierto = cicloDe(hoy);
  var actual = ciclos[abierto] || { ciclo: abierto, monto: 0, items: [], pagado: 0, pendiente: 0, cierra: cierre(abierto), vence: vence(abierto) };
  var cerrados = lista.filter(function (c) { return c.ciclo < abierto && c.pendiente > 0.5; });
  var futuros = lista.filter(function (c) { return c.ciclo > abierto && c.pendiente > 0.5; });
  var sumaP = function (l) { return l.reduce(function (a, c) { return a + c.pendiente; }, 0); };
  var aPagar = sumaP(cerrados);
  return {
    conCiclos: true, cerrados: cerrados, aPagar: aPagar,
    venceCerrado: cerrados.length ? cerrados[cerrados.length - 1].vence : "",
    vencido: cerrados.some(function (c) { return c.vence < hoy; }),
    actual: actual, futuros: futuros, enCuotasFuturas: sumaP(futuros),
    deuda: aPagar + actual.pendiente + sumaP(futuros),
    proximo: aPagar > 0.5 ? aPagar : actual.pendiente,
    ultimoPago: pagos[pagos.length - 1] || null,
    fechaCierre: cierre, fechaVence: vence, cicloDe: cicloDe
  };
}

/** Lo que debés en total en la tarjeta (con todas las cuotas que faltan). */
function deudaTarjeta_(movs, ajustes) {
  ajustes = ajustes || leerAjustes_();
  const est = calcularTarjeta(movs, ajustes, hoy_());
  if (est) return est.deuda;
  const desde = ajustes.fechaTarjeta || ajustes.fechaInicialARS || '';
  return movs.reduce(function (a, m) {
    if (m.fecha < desde) return a;
    if (vaATarjeta_(m)) return a + m.monto;
    if (m.tipo === 'pagoTarjeta') return a - m.monto;
    return a;
  }, (ajustes.deudaInicialTarjeta || 0) + (ajustes.consumosInicialesTarjeta || 0));
}

function fechaCorta_(f) { return Number(f.slice(8, 10)) + '/' + Number(f.slice(5, 7)); }

/** Frase para Siri sobre la tarjeta. */
function textoTarjeta_(movs, aj) {
  const est = calcularTarjeta(movs, aj, hoy_());
  if (!est) {
    const d = deudaTarjeta_(movs, aj);
    return d > 0.5 ? 'En la tarjeta de crédito debés ' + fmtMonto_(d, 'ARS') + ', contando cuotas futuras. ' : '';
  }
  let s = '';
  if (est.aPagar > 0.5) s += 'De la tarjeta tenés que pagar ' + fmtMonto_(est.aPagar, 'ARS') + (est.vencido ? ', que ya venció el ' : ', que vence el ') + fechaCorta_(est.venceCerrado) + '. ';
  if (est.actual.pendiente > 0.5) s += 'En el resumen en curso llevás ' + fmtMonto_(est.actual.pendiente, 'ARS') + ', cierra el ' + fechaCorta_(est.actual.cierra) + '. ';
  if (!s) s = 'No debés nada en la tarjeta. ';
  return s;
}

/** Plata disponible en pesos: saldo inicial + ingresos y ventas de USD − gastos y compras de USD (desde la fecha inicial). */
function saldoARS_(movs, ajustes) {
  ajustes = ajustes || leerAjustes_();
  if (!ajustes.fechaInicialARS) return null;
  return movs.reduce(function (a, m) {
    if (m.fecha < ajustes.fechaInicialARS) return a;
    if (m.tipo === 'ahorro') return a - (m.pesos || 0);
    if (m.tipo === 'retiro') return a + (m.pesos || 0);
    if (m.tipo === 'pagoTarjeta') return a - m.monto;
    if (m.moneda === 'USD' || vaATarjeta_(m)) return a; // lo de la tarjeta se descuenta cuando pagás el resumen
    return a + (m.tipo === 'ingreso' ? m.monto : -m.monto);
  }, ajustes.saldoInicialARS);
}

/** Saldo de la cuenta en dólares: ahorro inicial + ingresos y compras − gastos y ventas. */
function saldoUSD_(movs, ajustes) {
  return movs.reduce(function (a, m) {
    if (m.moneda !== 'USD') return a;
    return a + ((m.tipo === 'ingreso' || m.tipo === 'ahorro') ? m.monto : -m.monto);
  }, (ajustes || leerAjustes_()).saldoInicialUSD);
}

function hoja_(clave) {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJAS[clave]);
  if (!h) throw new Error('Falta la hoja "' + HOJAS[clave] + '". Ejecutá "configurar".');
  return h;
}

function leer_(clave) {
  const h = hoja_(clave);
  const cols = COLS[clave];
  const n = h.getLastRow();
  if (n < 2) return [];
  const vals = h.getRange(2, 1, n - 1, cols.length).getValues();
  const conId = clave === 'MOV' || clave === 'FIJ';
  const res = [];
  vals.forEach(function (r, i) {
    if (r.every(function (v) { return v === '' || v === null; })) return;
    if (conId && String(r[0]).trim() === '') {
      r[0] = nuevoId_();
      h.getRange(i + 2, 1).setValue(r[0]);
    }
    const o = {};
    cols.forEach(function (c, j) { o[c] = limpiarValor_(r[j], c); });
    if (clave === 'MOV') {
      if (!o.mes && o.fecha) o.mes = o.fecha.slice(0, 7);
      o.tipo = TIPOS.indexOf(o.tipo) >= 0 ? o.tipo : 'gasto';
      o.moneda = (o.moneda === 'USD' || o.tipo === 'ahorro' || o.tipo === 'retiro') ? 'USD' : 'ARS';
      o.pesos = Number(o.pesos) || 0;
    }
    if (clave === 'FIJ') o.moneda = String(o.moneda).toUpperCase() === 'USD' ? 'USD' : 'ARS';
    if (clave === 'CAT') o.tipo = norm_(o.tipo) === 'ingreso' ? 'ingreso' : 'gasto';
    res.push(o);
  });
  return res;
}

function limpiarValor_(v, c) {
  if (v instanceof Date) {
    if (c === 'mes') return Utilities.formatDate(v, TZ, 'yyyy-MM');
    if (c === 'creado') return Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm');
    return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  }
  if (c === 'monto' || c === 'dia' || c === 'cuotas' || c === 'pesos') return Number(v) || 0;
  if (c === 'debitoAutomatico') return booleano_(v, false);
  if (c === 'activo') return booleano_(v, true);
  if (c === 'fecha') {
    const s = String(v).trim();
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); // 27/10/2026 escrito a mano
    if (m) return (m[3].length === 2 ? '20' + m[3] : m[3]) + '-' + pad2_(m[2]) + '-' + pad2_(m[1]);
    return s;
  }
  return String(v === null || v === undefined ? '' : v).trim();
}

function booleano_(v, porDefecto) {
  if (v === true || v === false) return v;
  const s = norm_(v);
  if (s === '') return porDefecto;
  return ['si', 'true', 'x', '1', 'verdadero', 'yes'].indexOf(s) >= 0;
}

function filaPorId_(h, id) {
  const n = h.getLastRow();
  if (n < 2) return -1;
  const ids = h.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return -1;
}

function seguro_(s) {
  s = String(s === null || s === undefined ? '' : s);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function normalizarMov_(m) {
  let fecha = String(m.fecha || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) fecha = hoy_();
  const tipo = TIPOS.indexOf(m.tipo) >= 0 ? m.tipo : 'gasto';
  const cambio = tipo === 'ahorro' || tipo === 'retiro'; // compra / venta de dólares
  const pagoT = tipo === 'pagoTarjeta';                   // pago del resumen de la tarjeta
  const moneda = pagoT ? 'ARS' : (cambio || m.moneda === 'USD') ? 'USD' : 'ARS';
  const catDefecto = { gasto: 'Otros', ingreso: 'Otros ingresos', ahorro: 'Ahorro', retiro: 'Venta de dólares', pagoTarjeta: 'Pago de tarjeta' }[tipo];
  let medio = String(m.medio || (pagoT ? 'Crédito' : 'Sin especificar'));
  if (moneda === 'USD' && !cambio && medio === 'Sin especificar') medio = 'Cuenta en dólares';
  return {
    id: m.id || '',
    fecha: fecha,
    mes: fecha.slice(0, 7),
    tipo: tipo,
    monto: Math.abs(Number(m.monto)) || 0,
    moneda: moneda,
    descripcion: String(m.descripcion || (tipo === 'ahorro' ? 'Compra de dólares' : tipo === 'retiro' ? 'Venta de dólares' : pagoT ? 'Pago de tarjeta' : '')).slice(0, 200),
    categoria: (cambio || pagoT) ? catDefecto : String(m.categoria || catDefecto),
    medio: medio,
    cuotas: !cambio && !pagoT && Number(m.cuotas) > 1 ? Number(m.cuotas) : '',
    idFijo: (cambio || pagoT) ? '' : (m.idFijo || ''),
    origen: m.origen || '',
    creado: m.creado || '',
    pesos: cambio ? (Math.abs(Number(m.pesos)) || 0) : ''
  };
}

function filaMov_(o) {
  return COLS.MOV.map(function (c) {
    const v = o[c];
    if (c === 'descripcion' || c === 'categoria' || c === 'medio') return seguro_(v);
    return v === undefined || v === null ? '' : v;
  });
}

function agregarMov_(m, origen) {
  const mov = normalizarMov_(m);
  if (!mov.monto) throw new Error('Falta el monto.');
  mov.id = nuevoId_();
  mov.origen = origen || 'app';
  mov.creado = ahora_();
  hoja_('MOV').appendRow(filaMov_(mov));
  return mov;
}

function editarMov_(id, cambios) {
  const h = hoja_('MOV');
  const fila = filaPorId_(h, id);
  if (fila < 0) throw new Error('No encontré ese movimiento.');
  const actual = {};
  const vals = h.getRange(fila, 1, 1, COLS.MOV.length).getValues()[0];
  COLS.MOV.forEach(function (c, i) { actual[c] = limpiarValor_(vals[i], c); });
  const mov = normalizarMov_(Object.assign({}, actual, cambios, { id: actual.id, origen: actual.origen, creado: actual.creado }));
  h.getRange(fila, 1, 1, COLS.MOV.length).setValues([filaMov_(mov)]);
  return mov;
}

function borrarMov_(id) {
  const h = hoja_('MOV');
  const fila = filaPorId_(h, id);
  if (fila > 0) h.deleteRow(fila);
}

/* ---------- Gastos fijos ---------- */

function pagarFijo_(idFijo, mes, monto, fecha, origen, extra) {
  const fijo = leer_('FIJ').filter(function (f) { return f.id === idFijo; })[0];
  if (!fijo) throw new Error('No encontré ese gasto fijo.');
  mes = mes || hoy_().slice(0, 7);
  const ya = leer_('MOV').filter(function (m) { return m.idFijo === idFijo && m.mes === mes; })[0];
  if (ya) return { mov: ya, yaEstaba: true, fijo: fijo };
  if (!fecha || fecha.slice(0, 7) !== mes) {
    fecha = mes === hoy_().slice(0, 7) ? hoy_() : mes + '-' + pad2_(Math.min(fijo.dia || 1, diasDelMes_(mes)));
  }
  const mov = agregarMov_({
    fecha: fecha, tipo: 'gasto',
    monto: Number(monto) || fijo.monto,
    moneda: fijo.moneda,
    descripcion: fijo.nombre,
    categoria: fijo.categoria || 'Casa y servicios',
    medio: (extra && extra.medio) || fijo.medio || (fijo.moneda === 'USD' ? 'Cuenta en dólares' : 'Sin especificar'),
    idFijo: fijo.id
  }, origen);
  return { mov: mov, yaEstaba: false, fijo: fijo };
}

function despagarFijo_(idFijo, mes) {
  const h = hoja_('MOV');
  const n = h.getLastRow();
  if (n < 2) return;
  const vals = h.getRange(2, 1, n - 1, COLS.MOV.length).getValues();
  const iFijo = COLS.MOV.indexOf('idFijo'), iFecha = COLS.MOV.indexOf('fecha'), iMes = COLS.MOV.indexOf('mes');
  for (let i = vals.length - 1; i >= 0; i--) {
    const mesFila = limpiarValor_(vals[i][iMes], 'mes') || limpiarValor_(vals[i][iFecha], 'fecha').slice(0, 7);
    if (String(vals[i][iFijo]) === String(idFijo) && mesFila === mes) h.deleteRow(i + 2);
  }
}

function guardarFijo_(f) {
  const h = hoja_('FIJ');
  const fila = [
    f.id || nuevoId_(),
    seguro_(String(f.nombre || '').trim() || 'Sin nombre'),
    Math.abs(Number(f.monto)) || 0,
    Math.min(31, Math.max(1, Number(f.dia) || 1)),
    seguro_(f.categoria || 'Casa y servicios'),
    seguro_(f.medio || 'Sin especificar'),
    f.debitoAutomatico ? 'Sí' : 'No',
    f.activo === false ? 'No' : 'Sí',
    seguro_(f.notas || ''),
    f.moneda === 'USD' ? 'USD' : 'ARS'
  ];
  const n = f.id ? filaPorId_(h, f.id) : -1;
  if (n > 0) h.getRange(n, 1, 1, fila.length).setValues([fila]);
  else h.appendRow(fila);
  return fila[0];
}

function borrarFijo_(id) {
  const h = hoja_('FIJ');
  const fila = filaPorId_(h, id);
  if (fila > 0) h.deleteRow(fila); // los pagos ya registrados quedan en el historial
}

/** Corre todos los días a las 9: registra los fijos con débito automático cuyo día ya llegó. */
function procesarDebitosAutomaticos() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const hoy = hoy_(), mes = hoy.slice(0, 7), diaHoy = Number(hoy.slice(8, 10));
    const movs = leer_('MOV');
    leer_('FIJ').forEach(function (f) {
      if (!f.activo || !f.debitoAutomatico || !f.monto) return;
      const dia = Math.min(f.dia || 1, diasDelMes_(mes));
      const pagado = movs.some(function (m) { return m.idFijo === f.id && m.mes === mes; });
      if (dia <= diaHoy && !pagado) pagarFijo_(f.id, mes, f.monto, mes + '-' + pad2_(dia), 'débito automático');
    });
  } finally {
    lock.releaseLock();
  }
}

/* ============================================================
 *  SIRI: entender frases como "gasté 8500 en el súper con débito"
 * ============================================================ */

/** tipoForzado: 'ingreso' cuando viene del atajo "Anotar ingreso" (si no, se adivina por la frase). */
function procesarTexto_(texto, origen, tipoForzado) {
  const ctx = { categorias: leer_('CAT'), medios: leer_('MED'), fijos: leer_('FIJ'), hoy: hoy_(), tipoForzado: tipoForzado === 'ingreso' ? 'ingreso' : '' };
  const r = interpretar_(texto, ctx);

  if (r.error) return { ok: false, error: r.error, mensaje: r.error };
  if (r.consulta) return { ok: true, mensaje: resumenParaSiri_(ctx) };

  // "…fijo" sin un fijo con ese nombre: lo creo y lo marco pagado
  if (r.fijoNuevo) {
    const id = guardarFijo_({
      nombre: r.descripcion, monto: r.monto, dia: Number(r.fecha.slice(8, 10)), categoria: r.categoria,
      medio: r.medio, moneda: r.moneda, debitoAutomatico: false, activo: true, notas: 'Creado desde Siri'
    });
    const pn = pagarFijo_(id, r.fecha.slice(0, 7), r.monto, r.fecha, origen);
    return { ok: true, mensaje: 'Listo. No tenías un gasto fijo llamado ' + r.descripcion + ', así que lo agregué a tus fijos con vencimiento el día ' +
      Number(r.fecha.slice(8, 10)) + ' y lo marqué como pagado: ' + fmtMonto_(pn.mov.monto, pn.mov.moneda) + '.' };
  }

  if (r.fijo) {
    const p = pagarFijo_(r.fijo.id, r.fecha.slice(0, 7), r.monto || r.fijo.monto, r.fecha, origen,
      { medio: r.medio !== 'Sin especificar' ? r.medio : '' });
    if (p.yaEstaba) return { ok: true, mensaje: r.fijo.nombre + ' ya estaba marcado como pagado este mes.' };
    return { ok: true, mensaje: 'Listo. Marqué ' + r.fijo.nombre + ' como pagado: ' + fmtMonto_(p.mov.monto, p.mov.moneda) + '.' +
      (vaATarjeta_(p.mov) ? ' Como fue con crédito, va a la tarjeta.' : '') };
  }

  const mov = agregarMov_({
    fecha: r.fecha, tipo: r.tipo, monto: r.monto, moneda: r.moneda, descripcion: r.descripcion,
    categoria: r.categoria, medio: r.medio, cuotas: r.cuotas, pesos: r.pesos
  }, origen);
  let mensaje = mensajeAnotado_(mov, ctx.hoy);
  if (mov.tipo === 'pagoTarjeta') {
    const queda = deudaTarjeta_(leer_('MOV'));
    mensaje += queda > 0.5 ? ' En la tarjeta te quedan ' + fmtMonto_(queda, 'ARS') + ' por pagar, contando cuotas futuras.' : ' Ya no debés nada en la tarjeta.';
  } else if (vaATarjeta_(mov)) {
    const est = calcularTarjeta([mov], leerAjustes_(), hoy_());
    mensaje += est ? ' Va al resumen que cierra el ' + fechaCorta_(est.fechaCierre(est.cicloDe(mov.fecha))) + ' y vence el ' + fechaCorta_(est.fechaVence(est.cicloDe(mov.fecha))) + '. Se descuenta de tu plata cuando lo pagues.'
      : ' Va a la tarjeta: se descuenta de tu plata cuando pagues el resumen.';
  }
  if (r.fijoParecido) {
    const mes = r.fecha.slice(0, 7);
    const pagado = leer_('MOV').some(function (m) { return m.idFijo === r.fijoParecido.id && m.mes === mes; });
    if (!pagado) mensaje += ' Lo anoté como gasto variable. Si era tu fijo ' + r.fijoParecido.nombre + ', borralo en la app y decilo de nuevo agregando la palabra fijo.';
  }
  if (mov.moneda === 'USD') mensaje += ' Tu cuenta en dólares tiene ' + fmtMonto_(saldoUSD_(leer_('MOV')), 'USD') + '.';
  return { ok: true, mensaje: mensaje, movimiento: mov };
}

function mensajeAnotado_(m, hoy) {
  const delDia = m.fecha !== hoy ? ', del ' + Number(m.fecha.slice(8, 10)) + '/' + Number(m.fecha.slice(5, 7)) : '';
  if (m.tipo === 'pagoTarjeta') return 'Anotado: pagaste ' + fmtMonto_(m.monto, 'ARS') + ' de la tarjeta' + (norm_(m.medio) !== 'credito' ? ' ' + m.medio : '') + delDia + '. Ya se descontó de tu plata.';
  if (m.tipo === 'ahorro' || m.tipo === 'retiro') {
    let c = (m.tipo === 'ahorro' ? 'Anotado: ahorraste ' : 'Anotado: vendiste ') + fmtMonto_(m.monto, 'USD');
    if (m.pesos) c += (m.tipo === 'ahorro' ? ' por ' : ' y recibiste ') + fmtMonto_(m.pesos, 'ARS') + ' (a ' + fmtMonto_(m.pesos / m.monto, 'ARS') + ' cada dólar)';
    return c + delDia + '.';
  }
  let s = 'Anotado: ' + (m.tipo === 'ingreso' ? 'ingreso' : 'gasto') + ' de ' + fmtMonto_(m.monto, m.moneda) + ' en ' + m.categoria;
  if (m.descripcion && norm_(m.descripcion) !== norm_(m.categoria)) s += ' (' + m.descripcion + ')';
  if (m.medio && m.medio !== 'Sin especificar') s += ', con ' + m.medio;
  if (m.cuotas) s += ', en ' + m.cuotas + ' cuotas';
  return s + delDia + '.';
}

function resumenParaSiri_(ctx) {
  const mes = ctx.hoy.slice(0, 7);
  const movs = leer_('MOV').filter(function (m) { return m.mes === mes; });
  const suma = function (tipo, moneda) {
    return movs.filter(function (m) { return m.tipo === tipo && m.moneda === (moneda || 'ARS'); })
      .reduce(function (a, m) { return a + m.monto; }, 0);
  };
  const ahorroUSD = suma('ahorro', 'USD') - suma('retiro', 'USD');
  const gastoUSD = suma('gasto', 'USD');
  const saldo = saldoUSD_(leer_('MOV'));
  const pendientes = ctx.fijos.filter(function (f) {
    return f.activo && !movs.some(function (m) { return m.idFijo === f.id; });
  });
  let s = 'En lo que va del mes gastaste ' + fmtMonto_(suma('gasto'), 'ARS') + ' e ingresaste ' + fmtMonto_(suma('ingreso'), 'ARS') + '. ';
  const disponible = saldoARS_(leer_('MOV'));
  if (disponible !== null) s += 'Tenés disponibles ' + (disponible < 0 ? 'menos ' : '') + fmtMonto_(disponible, 'ARS') + ' en pesos. ';
  s += textoTarjeta_(leer_('MOV'), leerAjustes_());
  s += 'En dólares: ' + (ahorroUSD ? 'este mes ahorraste ' + fmtMonto_(ahorroUSD, 'USD') + ', ' : '') +
    (gastoUSD ? 'gastaste ' + fmtMonto_(gastoUSD, 'USD') + ', ' : '') + 'y tu cuenta tiene ' + fmtMonto_(saldo, 'USD') + '. ';
  if (!ctx.fijos.some(function (f) { return f.activo; })) return s;
  s += pendientes.length
    ? 'Te falta pagar ' + pendientes.length + (pendientes.length === 1 ? ' fijo: ' : ' fijos: ') + pendientes.map(function (f) { return f.nombre; }).join(', ') + '.'
    : 'Ya pagaste todos tus gastos fijos.';
  return s;
}

/**
 * Función "pura" (no toca la planilla): recibe la frase y devuelve qué entendió.
 * ctx = { categorias, medios, fijos, hoy: 'yyyy-MM-dd' }
 */
function interpretar_(texto, ctx) {
  const original = String(texto || '').trim();
  if (!original) return { error: 'No escuché nada. Probá de nuevo.' };

  const t = minusculasAlineadas_(original); // mismo largo que el original, sin tildes
  let trabajo = t;
  const mascara = new Array(t.length).fill(false);
  const marcar = function (a, b) {
    for (let i = a; i < b; i++) mascara[i] = true;
    trabajo = trabajo.slice(0, a) + ' '.repeat(b - a) + trabajo.slice(b);
  };
  const quitarPrimero = function (re) {
    const m = new RegExp(re.source).exec(trabajo);
    if (m) marcar(m.index, m.index + m[0].length);
    return m;
  };
  const quitarTodos = function (re) {
    const g = new RegExp(re.source, 'g'), lista = [];
    let m;
    while ((m = g.exec(trabajo))) { lista.push([m.index, m.index + m[0].length]); if (!m[0].length) g.lastIndex++; }
    lista.forEach(function (p) { marcar(p[0], p[1]); });
    return lista.length;
  };

  // ¿Pagaste la tarjeta? ("pagué la tarjeta 350 mil", "pagué el resumen de la visa 420.000")
  if (ctx.tipoForzado !== 'ingreso' && /\b(pague|pagamos|abone|cancele)\s+(?:el\s+|la\s+|mi\s+)?(resumen|tarjeta|visa|master|mastercard|amex)\b/.test(t)) {
    const ms = buscarMontos_(t);
    if (!ms.length) return { error: 'Decime cuánto pagaste de la tarjeta. Por ejemplo: pagué la tarjeta 350 mil.' };
    const tarjetas = (ctx.medios || []).filter(function (md) { return esCredito_(md.nombre); });
    let tarjeta = tarjetas.filter(function (md) {
      return clavesDe_(md).some(function (k) { return k !== 'credito' && k !== 'tarjeta de credito' && new RegExp('\\b' + escRe_(k) + '\\b').test(t); });
    })[0] || tarjetas[0];
    let fechaP = ctx.hoy;
    if (/\b(antes de ayer|anteayer)\b/.test(t)) fechaP = sumarDias_(ctx.hoy, -2);
    else if (/\bayer\b/.test(t)) fechaP = sumarDias_(ctx.hoy, -1);
    return {
      tipo: 'pagoTarjeta', monto: ms.reduce(function (x, y) { return y.v > x.v ? y : x; }).v, moneda: 'ARS', fecha: fechaP, cuotas: '',
      medio: tarjeta ? tarjeta.nombre : 'Crédito', categoria: 'Pago de tarjeta', descripcion: 'Pago de tarjeta', fijo: null
    };
  }

  // ¿Es una pregunta?
  if (/\bcuanto (llevo|debo|gaste|gastamos|gasto|va|vamos|tengo|ahorre|ahorrado|me queda|queda)\b|\bcuantos (dolares|pesos)\b|\bcuanta plata\b|\bcuanto (le )?debo\b|\bcomo vengo\b|\bresumen\b/.test(t)) return { consulta: true };

  // ¿Compra o venta de dólares? ("compré 200 dólares a 1.250.000", "ahorré 300 dólares", "vendí 100 dólares a 1400")
  const DOL = '(?:dolares|dolar|usd|verdes|u\\$s|us\\$)';
  const NUM = '(?:u\\$s\\s*|us\\$\\s*|usd\\s*)?(?:(?:[\\d.,]+|' + Object.keys(VALOR_PALABRA).join('|') + '|mil|millon|millones|y|k)\\s*)*';
  const esAhorro = /\b(ahorre|ahorramos|guarde|ahorro de)\b/.test(t) ||
    new RegExp('\\b(compre|compramos|compra de|cambie|pase a)\\s+(?:unos\\s+|los\\s+)?(?:' + NUM + ')?' + DOL).test(t);
  const esRetiro = new RegExp('\\b(vendi|vendimos|venta de)\\s+(?:unos\\s+|los\\s+)?(?:' + NUM + ')?' + DOL).test(t);
  if ((esAhorro || esRetiro) && ctx.tipoForzado !== 'ingreso') return interpretarCambio_(original, t, esRetiro ? 'retiro' : 'ahorro', ctx);

  // Tipo
  const tipo = ctx.tipoForzado === 'ingreso' ? 'ingreso' : /\b(cobre|cobramos|cobro|me pagaron|me depositaron|me transfirieron|me entro|me entraron|ingrese|ingreso|ingresaron|recibi|vendi|sueldo|aguinaldo)\b/.test(t) ? 'ingreso' : 'gasto';

  // Fecha
  let fecha = ctx.hoy;
  if (quitarPrimero(/\b(antes de ayer|anteayer)\b/)) fecha = sumarDias_(ctx.hoy, -2);
  else if (quitarPrimero(/\bayer\b/)) fecha = sumarDias_(ctx.hoy, -1);
  quitarTodos(/\bhoy\b/);

  // Medio de pago
  let medio = 'Sin especificar';
  for (let i = 0; i < ctx.medios.length && medio === 'Sin especificar'; i++) {
    const md = ctx.medios[i];
    if (norm_(md.nombre) === 'sin especificar') continue;
    const claves = clavesDe_(md);
    for (let j = 0; j < claves.length; j++) {
      const re = new RegExp('(?:\\b(?:con|en|por|usando|via|desde)\\s+(?:la\\s+|el\\s+|mi\\s+|una\\s+)?(?:tarjeta\\s+(?:de\\s+)?)?)?\\b' + escRe_(claves[j]) + '\\b');
      if (quitarPrimero(re)) { medio = md.nombre; break; }
    }
  }

  // Moneda
  let moneda = medio === 'Cuenta en dólares' ? 'USD' : 'ARS';
  if (quitarTodos(/\b(?:dolares|dolar|usd|verdes)\b|u\$s|us\$/)) moneda = 'USD';
  quitarTodos(/\b(pesos|mangos|ars)\b/);

  // Cuotas (antes del monto, para que "3 cuotas" no se lea como $3)
  let cuotas = '';
  const mC = quitarPrimero(/\b(?:en\s+)?(\d{1,2}|una|dos|tres|cuatro|cinco|seis|nueve|doce|dieciocho)\s+cuotas?\b/);
  if (mC) cuotas = /^\d+$/.test(mC[1]) ? Number(mC[1]) : NUM_PALABRAS[mC[1]];
  quitarTodos(/\bsin interes(es)?\b/);

  // Monto (entiende "1.519.050", "1 millón 519.050", "un millón quinientos mil", "5 lucas", "2,5 millones"…)
  let monto = 0;
  const montos = buscarMontos_(trabajo);
  if (montos.length) {
    const mayor = montos.reduce(function (x, y) { return y.v > x.v ? y : x; });
    monto = mayor.v;
    marcar(mayor.i, mayor.f);
  }
  quitarTodos(/\$/);

  // Verbos y muletillas
  quitarTodos(/\b(un gasto de|gasto de|un ingreso de|ingreso de|gaste|gastamos|gastado|pague|pagamos|abone|compre|compramos|cobre|cobramos|me pagaron|me depositaron|me transfirieron|me devolvieron|me reintegraron|me entraron|me entro|recibi|ingrese|anotame|anota que|anota|anotar|registra|registrame|siri)\b/);

  // ¿Es un gasto fijo? Solo si lo decís: "pagué la luz, gasto fijo", "alquiler fijo 450 mil"
  const dijoFijo = tipo === 'gasto' && !!quitarPrimero(/(?:\b(?:como|es|un|el|la|de|del|gasto|pago|mis|mi|los|las)\s+)*\bfij[oa]s?\b/);
  quitarTodos(/\b(gasto|pago)\b(?=\s*$)/);
  let fijo = null, fijoParecido = null;
  if (tipo === 'gasto') {
    const fijos = (ctx.fijos || []).filter(function (f) { return f.activo && f.nombre; })
      .sort(function (a, b) { return b.nombre.length - a.nombre.length; });
    for (let i = 0; i < fijos.length; i++) {
      if (new RegExp('\\b' + escRe_(norm_(fijos[i].nombre)) + 's?\\b').test(trabajo)) { fijoParecido = fijos[i]; break; }
    }
    if (dijoFijo) fijo = fijoParecido;
  }

  if (!monto && !(fijo && fijo.monto)) {
    return { error: dijoFijo && !fijo
      ? 'Para agregar un gasto fijo nuevo necesito el monto. Probá: pagué el gimnasio 35 mil, gasto fijo.'
      : 'No entendí el monto. Probá diciendo, por ejemplo: gasté 8500 en el súper con débito.' };
  }

  // Categoría
  let categoria = tipo === 'ingreso' ? 'Otros ingresos' : 'Otros';
  const cats = (ctx.categorias || []).filter(function (c) { return c.tipo === tipo; });
  buscar:
  for (let i = 0; i < cats.length; i++) {
    const claves = clavesDe_(cats[i]);
    for (let j = 0; j < claves.length; j++) {
      if (new RegExp('\\b' + escRe_(claves[j]) + '\\b').test(trabajo)) { categoria = cats[i].nombre; break buscar; }
    }
  }

  // Descripción: lo que queda de la frase original
  let desc = original.split('').filter(function (c, i) { return !mascara[i]; }).join('').replace(/\s+/g, ' ').trim();
  let antes;
  do {
    antes = desc;
    desc = desc
      .replace(/^(en|de|del|el|la|los|las|un|una|para|por|y|que|a|al|con|me)\s+/i, '')
      .replace(/\s+(en|de|del|el|la|los|las|y|con|a|al|por|para|que)$/i, '')
      .replace(/^[,.;:¡!¿?\s-]+|[,.;:¡!¿?\s-]+$/g, '')
      .trim();
  } while (desc !== antes);
  if (!desc) desc = categoria;
  desc = desc.charAt(0).toUpperCase() + desc.slice(1);

  if (moneda === 'USD' && medio === 'Sin especificar') medio = 'Cuenta en dólares';
  // Dijo "fijo" pero no coincide el nombre exacto: busco uno parecido por la descripción
  if (dijoFijo && !fijo) {
    const d = norm_(desc);
    fijo = (ctx.fijos || []).filter(function (f) {
      const n = norm_(f.nombre);
      return f.activo && n && d && (d.indexOf(n) >= 0 || n.indexOf(d) >= 0);
    })[0] || null;
  }
  if (fijo) moneda = fijo.moneda === 'USD' ? 'USD' : 'ARS';
  return {
    tipo: tipo, monto: monto, moneda: moneda, fecha: fecha, cuotas: cuotas, medio: medio, categoria: categoria, descripcion: desc,
    fijo: fijo, fijoNuevo: dijoFijo && !fijo, fijoParecido: !dijoFijo ? fijoParecido : null
  };
}

/** Compra (ahorro) o venta (retiro) de dólares. Devuelve monto = dólares y pesos = pesos. */
function interpretarCambio_(original, t, tipo, ctx) {
  let fecha = ctx.hoy;
  if (/\b(antes de ayer|anteayer)\b/.test(t)) fecha = sumarDias_(ctx.hoy, -2);
  else if (/\bayer\b/.test(t)) fecha = sumarDias_(ctx.hoy, -1);

  // Todos los montos de la frase, marcando cuál viene pegado a "dólares" y cuál a "pesos"
  const nums = buscarMontos_(t).map(function (n) {
    const despues = t.slice(n.f, n.f + 14);
    const antes = t.slice(Math.max(0, n.i - 6), n.i);
    return {
      v: n.v,
      dolar: /(u\$s|us\$|usd)\s*$/.test(antes) || /^\s*(de\s+)?(dolares|dolar|usd|verdes|u\$s)/.test(despues),
      peso: /\$\s*$/.test(antes) && !/u\$s\s*$|us\$\s*$/.test(antes) || /^\s*(de\s+)?(pesos|mangos|ars)/.test(despues),
      tasa: /\b(a|al)\s*$/.test(antes) && !/^\s*(de\s+)?(pesos|mangos)/.test(despues)
    };
  });
  let usd = nums.filter(function (n) { return n.dolar; })[0] || nums.filter(function (n) { return !n.peso; })[0];
  if (!usd) return { error: 'No entendí cuántos dólares. Probá: compré 200 dólares a 1.250.000 pesos.' };
  const otro = nums.filter(function (n) { return n !== usd; })[0];
  let pesos = 0;
  if (otro) {
    // "a 1450" (cotización) o "por 1.250.000" (total). Si es chico al lado de los dólares, es la cotización.
    const esTasa = /\b(cotizacion|cada uno|cada dolar|el dolar|c\/u)\b/.test(t) || (!otro.peso && otro.v < usd.v * 50) || (otro.tasa && otro.v < usd.v * 50);
    pesos = esTasa ? Math.round(otro.v * usd.v) : otro.v;
  }
  let medio = 'Sin especificar';
  for (let i = 0; i < ctx.medios.length; i++) {
    const claves = clavesDe_(ctx.medios[i]);
    if (claves.some(function (k) { return k !== 'sin especificar' && new RegExp('\\b' + escRe_(k) + '\\b').test(t); })) { medio = ctx.medios[i].nombre; break; }
  }
  return {
    tipo: tipo, monto: usd.v, pesos: pesos, moneda: 'USD', fecha: fecha, cuotas: '', medio: medio,
    categoria: tipo === 'ahorro' ? 'Ahorro' : 'Venta de dólares',
    descripcion: tipo === 'ahorro' ? 'Compra de dólares' : 'Venta de dólares', fijo: null
  };
}

const TIPOS = ['gasto', 'ingreso', 'ahorro', 'retiro', 'pagoTarjeta'];

// Valor de cada palabra numérica (sin tildes)
const VALOR_PALABRA = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
  veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50,
  sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100,
  doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400,
  quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700,
  ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900
};

/**
 * Busca montos en un texto en minúsculas y sin tildes. Devuelve [{ v, i, f }] (valor, inicio, fin).
 * Ej: "1.519.050", "1519050", "1 millon 519.050", "un millon quinientos diecinueve mil cincuenta",
 *     "2,5 millones", "un millon y medio", "5 mil", "5 lucas", "mil quinientos".
 */
function buscarMontos_(t) {
  const re = /\d[\d.,]*\d|\d|[a-z]+/g;
  const toks = [];
  let m;
  while ((m = re.exec(t))) toks.push({ s: m[0], i: m.index, f: m.index + m[0].length });

  const MULT = { mil: 1e3, luca: 1e3, lucas: 1e3, k: 1e3, millon: 1e6, millones: 1e6, palo: 1e6, palos: 1e6 };
  const esNum = function (x) { return /^\d/.test(x) || VALOR_PALABRA[x] !== undefined || MULT[x] !== undefined; };
  const valorDigitos = function (x) {
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(x)) return parseFloat(x.replace(/\./g, '').replace(',', '.')); // 1.519.050 / 1.519.050,50
    if (/^\d{1,3}(,\d{3})+$/.test(x)) return parseFloat(x.replace(/,/g, ''));                                  // 1,519,050
    if (/^\d+([.,]\d{1,2})?$/.test(x)) return parseFloat(x.replace(',', '.'));                                  // 1519050 / 2,5 / 4500.50
    return parseFloat(x.replace(/[.,]/g, ''));
  };

  const res = [];
  let k = 0;
  while (k < toks.length) {
    if (!esNum(toks[k].s)) { k++; continue; }
    // armar la corrida de palabras numéricas seguidas (solo espacios entre ellas; "y" permitido en el medio)
    const ini = k;
    let fin = k;
    while (fin + 1 < toks.length) {
      const sig = toks[fin + 1];
      const entre = t.slice(toks[fin].f, sig.i);
      if (!/^\s*$/.test(entre)) break;
      if (esNum(sig.s)) { fin++; continue; }
      if ((sig.s === 'y' || sig.s === 'con') && fin + 2 < toks.length && /^\s*$/.test(t.slice(sig.f, toks[fin + 2].i)) &&
          (esNum(toks[fin + 2].s) || toks[fin + 2].s === 'medio')) {
        if (toks[fin + 2].s === 'medio') { fin += 2; break; }
        fin++; continue;
      }
      break;
    }
    // un "un"/"una" suelto ("un café") no es un monto
    const corrida = toks.slice(ini, fin + 1).map(function (x) { return x.s; });
    const util = corrida.filter(function (x) { return x !== 'y' && x !== 'con'; });
    if (util.length === 1 && /^(un|una|uno)$/.test(util[0])) { k = fin + 1; continue; }

    let total = 0, actual = 0, ultimoMult = 1;
    corrida.forEach(function (x) {
      if (x === 'y' || x === 'con') return;
      if (x === 'medio') { total += (ultimoMult >= 1e3 ? ultimoMult : 1) / 2; return; }
      if (MULT[x]) {
        if (MULT[x] === 1e3 && total >= 1e6 && actual === 0 && x === 'mil') { actual = 1; }
        total += (actual || 1) * MULT[x];
        actual = 0; ultimoMult = MULT[x];
        return;
      }
      actual += /^\d/.test(x) ? valorDigitos(x) : VALOR_PALABRA[x];
    });
    const v = Math.round((total + actual) * 100) / 100;
    if (v > 0) res.push({ v: v, i: toks[ini].i, f: toks[fin].f });
    k = fin + 1;
  }
  return res;
}

const NUM_PALABRAS = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  doce: 12, quince: 15, dieciocho: 18, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, cien: 100
};

/* ============================================================
 *  UTILIDADES
 * ============================================================ */

function norm_(s) {
  return String(s === null || s === undefined ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

// Pasa a minúsculas y saca tildes SIN cambiar el largo, para poder recortar el texto original.
function minusculasAlineadas_(s) {
  return s.split('').map(function (c) {
    const n = c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return n.length ? n[0] : ' ';
  }).join('');
}

function clavesDe_(item) {
  const lista = [norm_(item.nombre)].concat(String(item.palabrasClave || '').split(',').map(norm_));
  return lista.filter(function (k, i) { return k && lista.indexOf(k) === i; })
    .sort(function (a, b) { return b.length - a.length; });
}

function escRe_(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function fmtMonto_(n, moneda) {
  const s = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (moneda === 'USD' ? 'US$ ' : '$') + s;
}

function pad2_(n) { return ('0' + Number(n)).slice(-2); }

function sumarDias_(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function diasDelMes_(mes) {
  return new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).getUTCDate();
}

function hoy_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function ahora_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'); }
function nuevoId_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 10); }
