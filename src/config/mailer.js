import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    service: "gmail",
    port: 587,
    auth: {
        user: "rolindeveloper@gmail.com",
        pass: "qithxauckcflsfyt"
    }
})