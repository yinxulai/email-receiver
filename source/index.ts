
import { PrismaClient } from '@prisma/client'
import { createApiServer } from './api-server'
import { createSmtpServer } from './smtp-server'

import pkg from '../package.json'

console.log("Version:", pkg.version)

const datasourceUrl = process.env.DATABASE_URL
const apiPort = parseInt(process.env.API_PORT!) || 3000
const smtpPort = parseInt(process.env.SMTP_PORT!) || 3025

const db = new PrismaClient({ datasourceUrl })

const apiServer = createApiServer(apiPort, db)
const smtpServer = createSmtpServer(smtpPort, db)

apiServer.start().then(() => console.log(`api server started on port ${apiPort}`))
smtpServer.start().then(() => console.log(`smtp server started on port ${smtpPort}`))

process.on('SIGINT', async () => {
  await smtpServer.close()
  await apiServer.close()
  db.$disconnect()
  process.exit(0)
})
