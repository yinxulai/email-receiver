
import { PrismaClient } from '@prisma/client'
import { createApiServer } from './api-server'
import { createStmpServer } from './stmp-server'

import pkg from '../package.json'

console.log("Version:", pkg.version)

const datasourceUrl = process.env.DATABASE_URL
const apiPort = parseInt(process.env.API_PORT!) || 3000
const stmpPort = parseInt(process.env.STMP_PORT!) || 3025

const db = new PrismaClient({ datasourceUrl })

const apiServer = createApiServer(apiPort, db)
const stmpServer = createStmpServer(stmpPort, db)

apiServer.start().then(() => console.log(`api server started on port ${apiPort}`))
stmpServer.start().then(() => console.log(`stmp server started on port ${stmpPort}`))

process.on('SIGINT', async () => {
  await stmpServer.close()
  await apiServer.close()
  db.$disconnect()
  process.exit(0)
})
