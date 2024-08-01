import nodemailer from 'nodemailer'

import { getRandomHighPort } from '../helper'
import { createStmpServer, Email } from './server'

interface MockEmail {
  to?: string,
  from?: string,
  subject?: string,
  content?: string
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
    text: email.content || 'Hello world',
    subject: email.subject || 'Test email',
    from: email.from || '"Sender" <sender@example.com>',
    to: email.to || '"Receiver" <receiver@example.com>',
  })
}

describe('ReceiveEmail', () => {
  it('receive mail normally', async () => {
    const port = getRandomHighPort()
    const server = createStmpServer(port)

    var email: Email | undefined
    server.onEmail(inbox => email = inbox)

    await server.start()

    const sendEmail: MockEmail = {
      to: 'receiver@example.com',
      from: 'sender@example.com',
      subject: 'Test email',
      content: 'Hello world',
    }

    await sendTestEmail(port, sendEmail)

    expect(email).not.toBeUndefined()
    expect(email?.to).toContain(sendEmail.to)
    expect(email?.from).toContain(sendEmail.from)
    expect(email?.subject).toContain(sendEmail.subject)
    expect(email?.content).toContain(sendEmail.content)

    await server.close()
  })
})
