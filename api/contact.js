export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, date, service, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Wymagane pola: imię, email i wiadomość' });
    }

    // Check for API key
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return res.status(500).json({ error: 'Błąd konfiguracji serwera' });
    }

    // Send email via Resend
    // Using resend.dev domain for testing (no domain verification needed)
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Fiodorow Photography <onboarding@resend.dev>',
        to: ['fiodorowphotography@gmail.com'],
        reply_to: email,
        subject: `Nowe zapytanie od ${name} - Fiodorow Photography`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2d2d2d; border-bottom: 2px solid #8b9a7a; padding-bottom: 10px;">
              Nowe zapytanie ze strony
            </h1>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Imię i nazwisko:</strong></td>
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
              <h3 style="color: #2d2d2d; margin-top: 0;">Wiadomość:</h3>
              <p style="color: #4a4a4a; line-height: 1.6; white-space: pre-wrap; margin: 0;">${message}</p>
            </div>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
              Ta wiadomość została wysłana z formularza kontaktowego na stronie fiodorowphotography.pl
            </p>
          </div>
        `
      })
    });

    const responseData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', responseData);
      return res.status(500).json({
        error: 'Błąd wysyłania wiadomości',
        details: responseData.message || 'Unknown error'
      });
    }

    return res.status(200).json({ success: true, message: 'Wiadomość została wysłana' });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas wysyłania wiadomości' });
  }
}
