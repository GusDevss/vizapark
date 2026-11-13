<?php
/**
 * Viza Park · Envío del formulario de contacto por correo (Hostinger)
 *
 * CONFIGURACIÓN: escribe aquí el correo que recibirá los mensajes.
 * Recomendado: un correo de tu dominio creado en hPanel → Correos (ej. ventas@tudominio.com).
 */
$DESTINO = 'CAMBIAR@tudominio.com';
$ASUNTO  = 'Nuevo contacto desde el sitio Viza Park';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function responder($ok, $msg, $code = 200) {
  http_response_code($code);
  echo json_encode(['ok' => $ok, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(false, 'Método no permitido.', 405);
if (strpos($DESTINO, 'CAMBIAR@') === 0) responder(false, 'El formulario aún no tiene un correo de destino configurado.', 500);

// Antispam: campo trampa y límite de envíos por sesión
if (!empty($_POST['website'])) responder(true, 'Gracias, recibimos tu mensaje.');
session_start();
$ahora = time();
$_SESSION['envios'] = array_filter($_SESSION['envios'] ?? [], fn($t) => $t > $ahora - 600);
if (count($_SESSION['envios']) >= 5) responder(false, 'Has enviado varios mensajes. Intenta de nuevo en unos minutos.', 429);

// Limpieza de campos (sin saltos de línea para evitar inyección de cabeceras)
function campo($k, $max) {
  $v = trim((string)($_POST[$k] ?? ''));
  $v = str_replace(["\r", "\0"], '', $v);
  return mb_substr($v, 0, $max);
}
$nombre  = preg_replace('/\s+/', ' ', campo('nombre', 100));
$empresa = preg_replace('/\s+/', ' ', campo('empresa', 120));
$tel     = preg_replace('/[^0-9+\-\s()]/', '', campo('tel', 20));
$email   = campo('email', 120);
$nave    = preg_replace('/[^0-9]/', '', campo('nave', 3));
$msg     = campo('msg', 1500);

if ($nombre === '' || $tel === '') responder(false, 'Nombre y teléfono son obligatorios.', 422);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) responder(false, 'Escribe un correo válido.', 422);

$cuerpo  = "Nuevo contacto desde el sitio web de Viza Park\n";
$cuerpo .= str_repeat('-', 46) . "\n";
$cuerpo .= "Nombre:   $nombre\n";
if ($empresa !== '') $cuerpo .= "Empresa:  $empresa\n";
$cuerpo .= "Teléfono: $tel\n";
$cuerpo .= "Correo:   $email\n";
$cuerpo .= "Nave:     " . ($nave !== '' ? "Nave $nave" : 'Sin definir') . "\n";
if ($msg !== '') $cuerpo .= "\nMensaje:\n$msg\n";
$cuerpo .= "\n" . str_repeat('-', 46) . "\nEnviado el " . date('d/m/Y H:i') . ' desde ' . ($_SERVER['HTTP_HOST'] ?? '') . "\n";

$host = preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
$host = preg_replace('/[^a-z0-9.\-]/i', '', $host);
$headers  = "From: Viza Park <no-reply@$host>\r\n";
$headers .= "Reply-To: " . str_replace(["\n", "\r"], '', "$nombre <$email>") . "\r\n";
$headers .= "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n";

$asunto = '=?UTF-8?B?' . base64_encode($ASUNTO . ($nave !== '' ? " · Nave $nave" : '')) . '?=';

if (@mail($DESTINO, $asunto, $cuerpo, $headers, "-fno-reply@$host")) {
  $_SESSION['envios'][] = $ahora;
  responder(true, '¡Gracias! Recibimos tu mensaje y un asesor te contactará pronto.');
}
responder(false, 'No pudimos enviar el correo. Escríbenos por WhatsApp, por favor.', 500);
