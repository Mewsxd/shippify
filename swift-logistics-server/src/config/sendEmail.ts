import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // false for TLS, true for SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  imagePaths?: string[] // Accept image paths as an optional parameter
): Promise<string> => {
  if (!to || !subject || !text) {
    throw new Error("All fields (to, subject, text) are required");
  }

  try {
    const attachments = imagePaths?.map((path, index) => ({
      filename: `image${index + 1}.png`, // File name
      path, // File path
      cid: `image${index + 1}@deliverx`, // Content-ID
    }));

    const info = await transporter.sendMail({
      from: `"Shippify" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `
        <div>${text}</div>
        ${
          attachments?.length
            ? attachments
                .map(
                  (attachment, index) =>
                    `<img src="cid:image${index + 1}@deliverx" alt="Image ${
                      index + 1
                    }" style="width: 150px; margin-right: 10px; " />`
                )
                .join("")
            : ""
        }
      `,
      attachments,
    });

    return info.messageId;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
