import QRCode from 'qrcode';

/**
 * Genera y descarga el QR de una persona — clon de GeneralesServiceImpl.generarQr,
 * ahora 100% client-side (el plan §12 lo marca trivial con `qrcode`).
 * Contenido EXACTO codificado: la URL `http://docnomina.com/doc/persona/{id}/persona-qr`.
 * Imagen 300x350: QR 300x300 + numId y nombre centrados debajo (Arial bold).
 * Descarga como `{nombre}-{numId}.png`.
 */
export async function descargarQrPersona(persona: {
  id: number;
  numero_id: string | null;
  nombre_completo: string | null;
}): Promise<void> {
  const url = `http://docnomina.com/doc/persona/${persona.id}/persona-qr`;
  const size = 300;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, 350);

  // QR en un canvas temporal y lo pintamos arriba
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, url, { width: size, margin: 1 });
  ctx.drawImage(qrCanvas, 0, 0, size, size);

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(persona.numero_id ?? '', size / 2, size + 20);
  ctx.fillText((persona.nombre_completo ?? '').slice(0, 40), size / 2, size + 42);

  const nombreArchivo =
    persona.nombre_completo && persona.numero_id
      ? `${persona.nombre_completo}-${persona.numero_id}.png`
      : 'QR.png';
  const link = document.createElement('a');
  link.download = nombreArchivo;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
