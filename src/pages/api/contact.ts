import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();

        const { name, email, phone, date, service, message } = data;

        // Validate required fields
        if (!name || !email || !message) {
            return new Response(JSON.stringify({
                error: 'Wymagane pola: imię, email i wiadomość'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({
                error: 'Nieprawidłowy adres email'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get Resend API key from environment
        const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;

        if (!RESEND_API_KEY) {
            console.error('Missing RESEND_API_KEY environment variable');
            // In development without key, just log and return success
            console.log('Contact form submission:', { name, email, phone, date, service, message });

            return new Response(JSON.stringify({
                success: true,
                message: 'Wiadomość została zapisana (tryb deweloperski - brak klucza API)'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Fiodorow Photography <kontakt@fiodorowphotography.pl>',
                to: ['fiodorowphotography@gmail.com'],
                reply_to: email,
                subject: `Nowe zapytanie od ${name} - Fiodorow Photography`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2d2d2d; border-bottom: 2px solid #8b9a7a; padding-bottom: 10px; font-size: 24px;">
              Nowe zapytanie ze strony
            </h1>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 140px;"><strong>Imię i nazwisko:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Email:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                  <a href="mailto:${email}" style="color: #8b9a7a;">${email}</a>
                </td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Telefon:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                  <a href="tel:${phone}" style="color: #8b9a7a;">${phone}</a>
                </td>
              </tr>
              ` : ''}
              ${date ? `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Planowana data:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${date}</td>
              </tr>
              ` : ''}
              ${service ? `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Rodzaj sesji:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${service}</td>
              </tr>
              ` : ''}
            </table>
            
            <div style="background-color: #f5f0eb; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #2d2d2d; margin-top: 0; font-size: 16px;">Wiadomość:</h3>
              <p style="color: #4a4a4a; line-height: 1.6; white-space: pre-wrap; margin: 0;">${message}</p>
            </div>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
              Ta wiadomość została wysłana z formularza kontaktowego na stronie fiodorowphotography.pl
            </p>
          </div>
        `
            })
        });

        if (!resendResponse.ok) {
            const errorData = await resendResponse.json();
            console.error('Resend API error:', errorData);
            throw new Error('Failed to send email');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Wiadomość została wysłana'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Contact form error:', error);

        return new Response(JSON.stringify({
            error: 'Wystąpił błąd podczas wysyłania wiadomości'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
