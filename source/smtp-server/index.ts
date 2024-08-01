import { PrismaClient } from '@prisma/client'

import { Server } from '../type'
import { createSmtpServer as createInternalStmpServer } from './server'

export function createSmtpServer(port: number, db: PrismaClient): Server {
  const server = createInternalStmpServer(port)

  server.onEmail(async (email) => {
    await db.emailInbox.create({
      data: {
        to: email.to,
        from: email.from,
        subject: email.subject,
        content: email.content,
      }
    })
  })

  return server
}
