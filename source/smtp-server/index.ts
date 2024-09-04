import { PrismaClient } from '@prisma/client'

import { Server } from '../type'
import { createSmtpServer as createInternalStmpServer } from './server'

export function createSmtpServer(port: number, db: PrismaClient): Server {
  const server = createInternalStmpServer(port)

  server.onEmail(async email => {
    db.emailInbox.create({ data: email })
      .then(() => console.log('received email successfully form ' + email.from))
      .catch(error => console.error('received email failed form ' + email.from, error))
  })

  return server
}
