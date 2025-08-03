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
  console.log("Sending email");

  try {
    const attachments = imagePaths?.map((path, index) => ({
      filename: `image${index + 1}.png`, // File name
      path, // File path
      cid: `image${index + 1}@deliverx`, // Content-ID
    }));

    const info = await transporter.sendMail({
      from: `"PharmaHealth" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 16px; color: #333; background-color: #ffffff; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #ddd; padding: 20px;">
                <tr>
                  <td>
                    ${text}
                  </td>
                </tr>
                ${
                  attachments?.length
                    ? `<tr><td style="padding-top: 15px;">` +
                      attachments
                        .map(
                          (attachment, index) =>
                            `<img src="cid:image${
                              index + 1
                            }@deliverx" alt="Image ${
                              index + 1
                            }" style="width: 150px; display: block; margin-bottom: 10px;" />`
                        )
                        .join("") +
                      `</td></tr>`
                    : ""
                }
              </table>
            </td>
          </tr>
        </table>
      `,
      attachments,
    });
    return info.messageId;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
