<?php
// Importar las clases de PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Cargar los archivos necesarios
require_once __DIR__ . '/Exception.php';
require_once __DIR__ . '/PHPMailer.php';
require_once __DIR__ . '/SMTP.php';

/**
 * Función para enviar un correo electrónico con los datos del formulario de contacto
 * 
 * @param array $form_data Datos del formulario de contacto
 * @return array Resultado de la operación (success: bool, message: string)
 */
function send_contact_form($form_data) {
    $fullname = isset($form_data['fullname']) ? $form_data['fullname'] : '';
    $mail = isset($form_data['mail']) ? $form_data['mail'] : '';
    $message = isset($form_data['message']) ? $form_data['message'] : '';

    require_once __DIR__ . '/PHPMailer.php';
    require_once __DIR__ . '/SMTP.php';
    require_once __DIR__ . '/Exception.php';
    $mailSender = new PHPMailer(true);
    $mailSender->isSMTP();
    $mailSender->Host = 'mail.jeyder.com.ar';
    $mailSender->SMTPAuth = true;
    $mailSender->Username = 'info@jeyder.com.ar';
    $mailSender->Password = 'Yk3ZY*lS';
    $mailSender->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mailSender->Port = 587;
    $mailSender->CharSet = 'UTF-8';
    $mailSender->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );

    // 1. Mail para el usuario que completó el formulario
    $mailSender->setFrom('info@jeyder.com.ar', 'Jeyder Multimedia');
    $mailSender->addAddress($mail, $fullname);
    $mailSender->isHTML(true);
    $mailSender->Subject = 'Gracias por contactarte con Jeyder Multimedia';
    $mailSender->Body = '<p>Gracias por contactarte con Jeyder Multimedia.</p><p>Esta es tu consulta:</p><blockquote>"' . nl2br(htmlspecialchars($message)) . '"</blockquote>';
    $mailSender->AltBody = "Gracias por contactarte con Jeyder Multimedia.\nEsta es tu consulta: '" . $message . "'";
    $mailSender->send();

    // 2. Mail para info@jeyder.com.ar con todos los datos
    $mailAdmin = new PHPMailer(true);
    $mailAdmin->isSMTP();
    $mailAdmin->Host = 'mail.jeyder.com.ar';
    $mailAdmin->SMTPAuth = true;
    $mailAdmin->Username = 'info@jeyder.com.ar';
    $mailAdmin->Password = 'Yk3ZY*lS';
    $mailAdmin->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mailAdmin->Port = 587;
    $mailAdmin->CharSet = 'UTF-8';
    $mailAdmin->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );
    $mailAdmin->setFrom('info@jeyder.com.ar', 'Jeyder Multimedia');
    $mailAdmin->addAddress('info@jeyder.com.ar', 'Jeyder Multimedia');
    $mailAdmin->isHTML(true);
    $mailAdmin->Subject = 'Nueva consulta desde el formulario web';
    $mailAdmin->Body = '<h2>Nueva consulta</h2>'
        . '<p><b>Mail:</b> ' . htmlspecialchars($mail) . '</p>'
        . '<p><b>Nombre:</b> ' . htmlspecialchars($fullname) . '</p>'
        . '<p><b>Consulta:</b><br>' . nl2br(htmlspecialchars($message)) . '</p>';
    $mailAdmin->AltBody = 'Nueva consulta\nMail: ' . $mail . '\nNombre: ' . $fullname . '\nConsulta: ' . $message;
    $mailAdmin->send();

    return [ 'success' => true, 'message' => 'Form enviado correctamente' ];
}
