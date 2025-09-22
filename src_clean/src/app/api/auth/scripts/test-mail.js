const nodemailer = require("nodemailer");

(async () => {
    const t = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "127.0.0.1",
        port: Number(process.env.SMTP_PORT || 1025),
        secure: false,
    });

    await t.verify(); 
    await t.sendMail({
        from: "no-reply@local.test",
        to: "test@local.test",
        subject: "MailHog test",
        text: "hello",
    });

    console.log("Sent. Check http://localhost:8025");
})();
