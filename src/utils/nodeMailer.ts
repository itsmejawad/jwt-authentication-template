import nodemailer, { SendMailOptions, Transporter, TransportOptions } from 'nodemailer';

// Define the type for email options
interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

// Define the sendEmail function with type annotations
const sendEmail = async (options: EmailOptions): Promise<void> => {
  // 1) Create Transporter
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_USERNAME,
      pass: process.env.MAILTRAP_PASSWORD,
    },
  } as TransportOptions);

  // 2) Define the email options
  const mailOptions: SendMailOptions = {
    from: `Jawad Aldabas <hello@jawadaldabas.com>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // TODO: Send email as HTML if necessary.
  };

  // 3) Send the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
