const ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';

export async function sendMail(to: string[], subject: string, content: string) {
  if (!SENDGRID_TOKEN) {
    throw new Error("SENDGRID_TOKEN is not configured");
  }

  const body = {
    personalizations: [{to: to.map(email => ({email}))}],
    from: {email: 'status@m4rc3l.de', name: 'M4rc3l.de Status'},
    reply_to: {email: 'admin@m4rc3l.de', name: 'M4rc3l.de Administration'},
    subject,
    content: [{type: "text/html", value: content}]
  };

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (response.status !== 202) {
    const body = (await response.text()).trim();
    let message = `Unable to send mail: ${response.status} ${response.statusText}`;
    if (body) {
      message += ` - ${body}`;
    }
    throw new Error(message);
  }
}
