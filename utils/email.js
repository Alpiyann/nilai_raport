const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = async (email, otp) => {
    const mailOptions = {
        from: `"Portal Akademik" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Yuk, Verifikasi Akunmu! 🚀',
        html: `
            <div style="font-family: 'Segoe UI', user-select: none; sans-serif; padding: 30px; color: #1f2937; max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #f3f4f6;">
                <h2 style="color: #7c3aed; margin-bottom: 20px; font-size: 24px;">Selamat Datang! 👋</h2>
                <p style="font-size: 16px; line-height: 1.6;">Hai calon mahasiswa sukses,</p>
                <p style="font-size: 16px; line-height: 1.6;">Terima kasih sudah bergabung. Tinggal satu langkah lagi nih buat aktifin akun kamu. Masukkan kode rahasia di bawah ini ya:</p>
                
                <div style="background: linear-gradient(to right, #7c3aed, #db2777); padding: 2px; border-radius: 12px; margin: 25px 0;">
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; text-align: center;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; display: block;">${otp}</span>
                    </div>
                </div>

                <p style="font-size: 14px; color: #6b7280; text-align: center;">Kode ini cuma berlaku 10 menit. Jangan dikasih ke siapa-siapa ya!</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email verifikasi terkirim ke:', email);
        return true;
    } catch (error) {
        console.error('Gagal mengirim email:', error);
        return false;
    }
};

const sendResetPasswordEmail = async (email, otp) => {
    const mailOptions = {
        from: `"Tim Portal Akademik" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Password Akun 🔐',
        html: `
            <div style="font-family: 'Segoe UI', sans-serif; padding: 30px; color: #1f2937; max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #f3f4f6;">
                <h2 style="color: #ef4444; margin-bottom: 20px; font-size: 24px;">Lupa Password? Santai Aja. 🧘‍♂️</h2>
                <p style="font-size: 16px; line-height: 1.6;">Kami menerima permintaan buat reset password kamu. Kalau ini beneran kamu, pakai kode di bawah ini buat bikin password baru:</p>
                
                <div style="background: linear-gradient(to right, #ef4444, #f97316); padding: 2px; border-radius: 12px; margin: 25px 0;">
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; text-align: center;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; display: block;">${otp}</span>
                    </div>
                </div>

                <p style="font-size: 14px; color: #6b7280; text-align: center;">Hati-hati, kode ini kedaluwarsa dalam 15 menit.</p>
                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">Kalau bukan kamu yang minta, cuekin aja email ini ya.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email reset password terkirim ke:', email);
        return true;
    } catch (error) {
        console.error('Gagal mengirim email reset:', error);
        return false;
    }
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
