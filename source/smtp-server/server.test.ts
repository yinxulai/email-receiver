import nodemailer from 'nodemailer'

import { getRandomHighPort } from '../helper'
import { createSmtpServer, Email } from './server'

interface MockEmail {
  to?: string,
  from?: string,
  subject?: string,
  contentHtml?: string
  contentText?: string
}

function sendTestEmail(port: number, email: MockEmail) {
  // 创建一个 SMTP 客户端配置
  const transporter = nodemailer.createTransport({
    port: port,
    secure: false,
    host: 'localhost',
    tls: { rejectUnauthorized: false }
  })

  return transporter.sendMail({
    text: email.contentHtml || 'Hello world',
    subject: email.subject || 'Test email',
    from: email.from || '"Sender" <sender@example.com>',
    to: email.to || '"Receiver" <receiver@example.com>',
  })
}

describe('ReceiveEmail', () => {
  it('receive mail normally', async () => {
    const port = getRandomHighPort()
    const server = createSmtpServer(port)

    let email: Email | undefined
    server.onEmail(inbox => email = inbox)

    await server.start()

    const sendEmail: MockEmail = {
      to: 'receiver@example.com',
      from: 'sender@example.com',
      subject: 'Test email',
      contentText: 'Hello world',
      contentHtml: '<a>Hello world</a>',
    }

    await sendTestEmail(port, sendEmail)

    expect(email).not.toBeUndefined()
    expect(email?.to).toContain(sendEmail.to)
    expect(email?.from).toContain(sendEmail.from)
    expect(email?.subject).toContain(sendEmail.subject)
    expect(email?.contentText).toContain(sendEmail.contentText)
    expect(email?.contentHtml).toContain(sendEmail.contentHtml)

    await server.close()
  })
})
