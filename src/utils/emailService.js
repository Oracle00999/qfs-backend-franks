const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const getAppName = () => process.env.APP_NAME || "QFS Crypto Wallet";
const getSupportEmail = () =>
  process.env.EMAIL_FROM || "support@qfsworldwide.xyz";

const buildDetailsTable = (details = []) => {
  if (!details.length) return "";

  return `
    <table style="width:100%;border-collapse:separate;border-spacing:0 12px;margin-top:16px;">
      ${details
        .map(
          (detail) => `
        <tr>
          <td style="padding:14px 16px;background-color:#f8fafc;border-radius:12px;font-size:14px;color:#0f172a;line-height:1.6;">
            <span style="font-weight:700;color:#334155;display:inline-block;min-width:140px;">${detail.label}:</span>
            <span style="display:inline-block;color:#0f172a;word-break:break-word;">${detail.value}</span>
          </td>
        </tr>`,
        )
        .join("")}
    </table>
  `;
};

const buildTextDetails = (details = []) =>
  details.map((detail) => `${detail.label}: ${detail.value}`).join("\n");

const buildHtml = ({ title, intro, detailsHtml, footer }) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f5f7fb;color:#0f172a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f7fb;padding:32px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 24px 80px rgba(15, 23, 42, 0.08);">
              <tr>
                <td style="padding:32px 32px 24px;background-color:#1e3a8a;color:#ffffff;text-align:center;">
                  <h1 style="margin:0;font-size:24px;letter-spacing:0.02em;">${getAppName()}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <h2 style="margin-top:0;margin-bottom:16px;font-size:20px;color:#0f172a;">${title}</h2>
                  <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#475569;">${intro}</p>
                  ${detailsHtml}
                  <p style="margin:24px 0 0;font-size:16px;line-height:1.7;color:#475569;">${footer}</p>
                  <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#94a3b8;">If you did not initiate this action, please contact support immediately at <a href="mailto:${getSupportEmail()}" style="color:#1e3a8a;text-decoration:none;">${getSupportEmail()}</a>.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px;background-color:#f8fafc;color:#94a3b8;font-size:13px;text-align:center;">
                  ${getAppName()} | ${getSupportEmail()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is not configured");
  }

  return resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
};

const sendDepositRequestEmail = async (user, transaction, depositAddress) => {
  const title = "Deposit Request Received";
  const details = [
    {
      label: "Transaction ID",
      value: transaction.transactionId || transaction._id.toString(),
    },
    { label: "Cryptocurrency", value: transaction.cryptocurrency },
    { label: "Amount", value: `${transaction.amount} USD` },
    { label: "Deposit Address", value: depositAddress },
    {
      label: "Request Date",
      value:
        transaction.createdAt?.toLocaleString() || new Date().toLocaleString(),
    },
  ];

  if (transaction.txHash) {
    details.push({ label: "Blockchain Reference", value: transaction.txHash });
  }

  const html = buildHtml({
    title,
    intro:
      "We received your deposit request and are reviewing it. Please send the funds to the address below to complete the deposit.",
    detailsHtml: buildDetailsTable(details),
    footer:
      "Once the deposit is confirmed by our team, your wallet balance will be updated and you will receive a confirmation email.",
  });

  const text = [
    title,
    "We received your deposit request and are reviewing it.",
    ...buildTextDetails(details).split("\n"),
    "Once the deposit is confirmed by our team, your wallet balance will be updated and you will receive a confirmation email.",
  ].join("\n\n");

  return sendEmail({
    to: user.email,
    subject: title,
    html,
    text,
  });
};

const sendWithdrawalRequestEmail = async (user, transaction) => {
  const title = "Withdrawal Request Submitted";
  const details = [
    {
      label: "Transaction ID",
      value: transaction.transactionId || transaction._id.toString(),
    },
    { label: "Cryptocurrency", value: transaction.cryptocurrency },
    { label: "Amount", value: `${transaction.amount} USD` },
    { label: "Destination Address", value: transaction.toAddress || "N/A" },
    {
      label: "Request Date",
      value:
        transaction.createdAt?.toLocaleString() || new Date().toLocaleString(),
    },
  ];

  const html = buildHtml({
    title,
    intro:
      "Your withdrawal request has been received. We are reviewing it and will send confirmation once it is approved.",
    detailsHtml: buildDetailsTable(details),
    footer:
      "Your account balance has been reserved for this withdrawal request while it is pending approval.",
  });

  const text = [
    title,
    "Your withdrawal request has been received. We are reviewing it and will send confirmation once it is approved.",
    ...buildTextDetails(details).split("\n"),
    "Your account balance has been reserved for this withdrawal request while it is pending approval.",
  ].join("\n\n");

  return sendEmail({
    to: user.email,
    subject: title,
    html,
    text,
  });
};

const sendDepositConfirmedEmail = async (user, transaction) => {
  const title = "Deposit Confirmed";
  const details = [
    {
      label: "Transaction ID",
      value: transaction.transactionId || transaction._id.toString(),
    },
    { label: "Cryptocurrency", value: transaction.cryptocurrency },
    { label: "Amount", value: `${transaction.amount} USD` },
    {
      label: "Confirmed Date",
      value:
        transaction.completedAt?.toLocaleString() ||
        new Date().toLocaleString(),
    },
  ];

  const html = buildHtml({
    title,
    intro:
      "Your deposit has been confirmed and your wallet balance has been updated successfully.",
    detailsHtml: buildDetailsTable(details),
    footer: "You can view the transaction in your account history at any time.",
  });

  const text = [
    title,
    "Your deposit has been confirmed and your wallet balance has been updated successfully.",
    ...buildTextDetails(details).split("\n"),
    "You can view the transaction in your account history at any time.",
  ].join("\n\n");

  return sendEmail({
    to: user.email,
    subject: title,
    html,
    text,
  });
};

const sendWithdrawalConfirmedEmail = async (user, transaction) => {
  const title = "Withdrawal Approved";
  const details = [
    {
      label: "Transaction ID",
      value: transaction.transactionId || transaction._id.toString(),
    },
    { label: "Cryptocurrency", value: transaction.cryptocurrency },
    { label: "Amount", value: `${transaction.amount} USD` },
    { label: "Destination Address", value: transaction.toAddress || "N/A" },
    {
      label: "Approved Date",
      value:
        transaction.completedAt?.toLocaleString() ||
        new Date().toLocaleString(),
    },
  ];

  const html = buildHtml({
    title,
    intro: "Your withdrawal has been approved and is now being processed.",
    detailsHtml: buildDetailsTable(details),
    footer:
      "If you have any questions about this withdrawal, please contact support.",
  });

  const text = [
    title,
    "Your withdrawal has been approved and is now being processed.",
    ...buildTextDetails(details).split("\n"),
    "If you have any questions about this withdrawal, please contact support.",
  ].join("\n\n");

  return sendEmail({
    to: user.email,
    subject: title,
    html,
    text,
  });
};

const sendWalletLinkedEmail = async (user, wallet) => {
  const title = "Wallet Linked Successfully";
  const details = [
    { label: "Wallet Name", value: wallet.walletName },
    {
      label: "Linked Date",
      value: wallet.linkedAt?.toLocaleString() || new Date().toLocaleString(),
    },
    { label: "Status", value: wallet.isActive ? "Active" : "Inactive" },
  ];

  const html = buildHtml({
    title,
    intro: "Your external wallet has been linked successfully.",
    detailsHtml: buildDetailsTable(details),
    footer:
      "For security, never share your recovery phrase with anyone. You can manage linked wallets from your account settings.",
  });

  const text = [
    title,
    "Your external wallet has been linked successfully.",
    ...buildTextDetails(details).split("\n"),
    "For security, never share your recovery phrase with anyone. You can manage linked wallets from your account settings.",
  ].join("\n\n");

  return sendEmail({
    to: user.email,
    subject: title,
    html,
    text,
  });
};

module.exports = {
  sendDepositRequestEmail,
  sendWithdrawalRequestEmail,
  sendDepositConfirmedEmail,
  sendWithdrawalConfirmedEmail,
  sendWalletLinkedEmail,
};
