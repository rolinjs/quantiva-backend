import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    service: "gmail",
    secure: true,
    auth: {
        user: "rolinfullstack@gmail.com",
        pass: "bnyxuighidrqzsan"
    }
})