
import { PrismaClient } from '@prisma/client'
import { startApiServer } from './api-server'
import { startStmpServer } from './stmp-server'

import pkg from '../package.json'

console.log("Version:", pkg.version)

const datasourceUrl = process.env.DATABASE_URL
const apiPort = parseInt(process.env.API_PORT!) || 3000
const stmpPort = parseInt(process.env.STMP_PORT!) || 3025

const db = new PrismaClient({ datasourceUrl })

const apiCloser = startApiServer(apiPort, db)
const stmpCloser = startStmpServer(stmpPort, db)

process.on('SIGINT', () => {
  apiCloser()
  stmpCloser()
  db.$disconnect()
  process.exit(0)
})
