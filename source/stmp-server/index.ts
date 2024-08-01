import { PrismaClient } from '@prisma/client'

import { Server } from '../type'
import { createStmpServer as createInternalStmpServer } from './server'

export function createStmpServer(port: number, db: PrismaClient): Server {
  const server = createInternalStmpServer(port)

  server.onEmail((email) => {
    db.emailInbox.create({
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
