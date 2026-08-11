export default async function handler(req, res) {
  // Handle CORS
  const allowedOrigins = ['https://fiodorowphotography.pl', 'https://www.fiodorowphotography.pl'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, phone, eventDate, eventType, eventLocation, message, website, formTimestamp } = req.body;

    // --- Anti-spam checks ---

    // 1. Honeypot: if the hidden "website" field is filled, it's a bot
    if (website) {
      // Return 200 to not tip off the bot
      return res.status(200).json({ success: true, message: 'Wiadomość została wysłana' });
    }

    // 2. Timing: reject if form was submitted in under 3 seconds
    if (formTimestamp) {
      const elapsed = Date.now() - parseInt(formTimestamp, 10);
      if (elapsed < 3000) {
        return res.status(200).json({ success: true, message: 'Wiadomość została wysłana' });
      }
    }

    // 3. Content validation: reject gibberish names (no vowels or excessive length)
    const hasVowels = /[aeiouyąęó]/i;
    if (firstName && firstName.length > 2 && !hasVowels.test(firstName)) {
      return res.status(200).json({ success: true, message: 'Wiadomość została wysłana' });
    }
    if (lastName && lastName.length > 2 && !hasVowels.test(lastName)) {
      return res.status(200).json({ success: true, message: 'Wiadomość została wysłana' });
    }

    // 4. Reject if name or message is excessively long random text
    if ((firstName && firstName.length > 50) || (lastName && lastName.length > 50)) {
      return res.status(200).json({ success: true, message: 'Wiadomość została wysłana' });
    }

    // 5. Reject common spam patterns in email
    const spamEmailPatterns = /(.)\1{4,}|^[a-z]\.[a-z]\.[a-z]/i;
    if (email && spamEmailPatterns.test(email.split('@')[0])) {
      return res.status(200).json({ success: true, message: 'Wiadomość została wysłana' });
    }

    // --- End anti-spam checks ---

    const name = `${firstName || ''} ${lastName || ''}`.trim();
    const date = eventDate;
    const service = eventType;

    // Validate required fields
    if (!firstName || !email || !eventLocation || !message) {
      return res.status(400).json({ error: 'Wymagane pola: imię, email, lokalizacja i wiadomość' });
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
        from: 'Fiodorow Photography <kontakt@fiodorowphotography.pl>',
        to: ['fiodorowphotography@gmail.com'],
        reply_to: email,
        subject: `Nowe zapytanie od ${name} - Fiodorow Photography`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#faf8f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:48px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr>
          <td style="padding:0 0 32px;text-align:center;">
            <img src="https://fiodorowphotography.pl/logo-dark.png" alt="Fiodorow Photography" width="200" style="display:inline-block;width:200px;height:auto;" />
          </td>
        </tr>

        <!-- Divider thin olive -->
        <tr>
          <td style="padding:0 0 32px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
              <td style="width:60px;height:1px;background:#8b9a7a;"></td>
            </tr></table>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td style="padding:0 0 8px;text-align:center;">
            <p style="margin:0;color:#8b9a7a;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:'Montserrat',Arial,sans-serif;">Nowe zapytanie ze strony</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 40px;text-align:center;">
            <h1 style="margin:0;color:#2d2d2d;font-size:26px;font-weight:300;letter-spacing:1px;font-family:'Cormorant Garamond',Georgia,serif;">${name}</h1>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#ffffff;padding:0;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <table width="100%" cellpadding="0" cellspacing="0">

              <!-- Details Section -->
              <tr>
                <td style="padding:32px 36px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:14px 0;border-bottom:1px solid #f5f0eb;">
                        <p style="margin:0 0 3px;color:#aaa;font-size:9px;letter-spacing:2px;text-transform:uppercase;font-family:'Montserrat',Arial,sans-serif;">Email</p>
                        <a href="mailto:${email}" style="color:#8b9a7a;text-decoration:none;font-size:15px;font-family:'Cormorant Garamond',Georgia,serif;">${email}</a>
                      </td>
                    </tr>
                    ${phone ? `<tr>
                      <td style="padding:14px 0;border-bottom:1px solid #f5f0eb;">
                        <p style="margin:0 0 3px;color:#aaa;font-size:9px;letter-spacing:2px;text-transform:uppercase;font-family:'Montserrat',Arial,sans-serif;">Telefon</p>
                        <a href="tel:${phone}" style="color:#2d2d2d;text-decoration:none;font-size:15px;font-family:'Cormorant Garamond',Georgia,serif;">${phone}</a>
                      </td>
                    </tr>` : ''}
                    ${service ? `<tr>
                      <td style="padding:14px 0;border-bottom:1px solid #f5f0eb;">
                        <p style="margin:0 0 3px;color:#aaa;font-size:9px;letter-spacing:2px;text-transform:uppercase;font-family:'Montserrat',Arial,sans-serif;">Rodzaj sesji</p>
                        <p style="margin:0;color:#2d2d2d;font-size:15px;font-family:'Cormorant Garamond',Georgia,serif;">${service}</p>
                      </td>
                    </tr>` : ''}
                    ${date ? `<tr>
                      <td style="padding:14px 0;border-bottom:1px solid #f5f0eb;">
                        <p style="margin:0 0 3px;color:#aaa;font-size:9px;letter-spacing:2px;text-transform:uppercase;font-family:'Montserrat',Arial,sans-serif;">Planowana data</p>
                        <p style="margin:0;color:#2d2d2d;font-size:15px;font-family:'Cormorant Garamond',Georgia,serif;">${date}</p>
                      </td>
                    </tr>` : ''}
                    ${eventLocation ? `<tr>
                      <td style="padding:14px 0;border-bottom:1px solid #f5f0eb;">
                        <p style="margin:0 0 3px;color:#aaa;font-size:9px;letter-spacing:2px;text-transform:uppercase;font-family:'Montserrat',Arial,sans-serif;">Lokalizacja</p>
                        <p style="margin:0;color:#2d2d2d;font-size:15px;font-family:'Cormorant Garamond',Georgia,serif;">${eventLocation}</p>
                      </td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>

              <!-- Message Section -->
              <tr>
                <td style="padding:0 36px 32px;">
                  <div style="background:#faf8f5;padding:24px 28px;border-radius:2px;margin-top:8px;">
                    <p style="margin:0 0 10px;color:#aaa;font-size:9px;letter-spacing:2px;text-transform:uppercase;font-family:'Montserrat',Arial,sans-serif;">Wiadomość</p>
                    <p style="margin:0;color:#2d2d2d;font-size:15px;line-height:1.8;white-space:pre-wrap;font-family:'Cormorant Garamond',Georgia,serif;">${message}</p>
                  </div>
                </td>
              </tr>

              <!-- Reply Button -->
              <tr>
                <td style="padding:0 36px 36px;text-align:center;">
                  <a href="mailto:${email}" style="display:inline-block;background:#2d2d2d;color:#ffffff;text-decoration:none;padding:14px 40px;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:'Montserrat',Arial,sans-serif;border-radius:1px;">Odpowiedz</a>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:36px 0 0;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;"><tr>
              <td style="width:40px;height:1px;background:#ddd;"></td>
            </tr></table>
            <p style="margin:0 0 4px;color:#bbb;font-size:10px;letter-spacing:1px;font-family:'Montserrat',Arial,sans-serif;">
              <a href="https://fiodorowphotography.pl" style="color:#8b9a7a;text-decoration:none;">fiodorowphotography.pl</a>
            </p>
            <p style="margin:0;color:#ccc;font-size:9px;font-family:'Montserrat',Arial,sans-serif;">Formularz kontaktowy</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
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
