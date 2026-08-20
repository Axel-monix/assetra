    const nodemailer = require("nodemailer");
    const crypto = require("crypto");

    const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    });

    function generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
    }

    async function sendResetPasswordEmail(email, code) {
    try {
        await transporter.sendMail({
        from: `"Assetra Security" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Code For Reset Password - Valid for 5 Minutes",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #333; text-align: center;">Reset Password AssetFlow</h2>
            <p style="color: #666; font-size: 16px;">Halo,</p>
            <p style="color: #666; font-size: 16px;">Use the code below to reset your account passwordq:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
            </div>
            <p style="color: #999; font-size: 14px;">This code is valid for only<strong>5 minutes</strong>.</p>
            <p style="color: #999; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© 2026 AssetFlow</p>
            </div>
        `,
        });
        return true;
    } catch (err) {
        console.error("Error sending reset password email:", err);
        return false;
    }
    }

    module.exports = {
    generateVerificationCode,
    sendResetPasswordEmail,
    };