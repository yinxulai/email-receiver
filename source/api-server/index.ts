import fastify from 'fastify'
import { PrismaClient, Prisma } from '@prisma/client'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod'

import { Server } from '../type'
import * as s from './schema'

export function createApiServer(port: number, db: PrismaClient): Server {
  const debugLog = process.env.DEBUG_LOG
  const server = fastify({ logger: debugLog === 'true' })

  server.setValidatorCompiler(validatorCompiler)
  server.setSerializerCompiler(serializerCompiler)
  const typedServer = server.withTypeProvider<ZodTypeProvider>()

  //** token 检查 */
  typedServer.addHook('preHandler', (request, reply, done) => {
    const apiToken = process.env.API_TOKEN
    if (typeof apiToken !== 'string') {
      return done()
    }

    // 从 Authorization 头部获取凭证
    const { authorization } = request.headers

    // 验证 Authorization 头部是否存在
    if (!authorization) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    // 解析 Authorization 头部
    const [type, token] = authorization.split(' ')

    // 验证凭证是否合法
    if (type !== 'Bearer' || token !== apiToken) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    done()
  })

  /** 查询邮件 */
  typedServer.post('/query', { schema: s.QueryEmailSchema }, async request => {
    const { filter, paging } = request.body

    const where: Prisma.EmailInboxWhereInput = {}

    if (filter && filter.to && filter.to.length > 0) {
      where.to = { hasSome: filter.to }
    }

    if (filter && filter.from && filter.from.length > 0) {
      where.from = { hasSome: filter.from }
    }

    const count = await db.emailInbox.count({ where })

    const pageSize = paging?.size || 10
    const pageIndex = paging?.index || 1
    const emails = await db.emailInbox.findMany({
      where,
      take: pageSize,
      skip: (pageIndex - 1) * pageSize,
      orderBy: { createdTime: 'desc' }
    })

    return {
      status: 'SUCCESS' as const,
      message: 'success',
      data: {
        total: count,
        list: s.toPlains(emails)
      }
    }
  })

  function close() {
    return new Promise<void>((resolve) => {
      typedServer.close(resolve)
    })
  }

  function start() {
    return new Promise<void>((resolve) => {
      server.listen({ port, host: '0.0.0.0' }, err => {
        if (err) {
          console.error(err)
          process.exit(1)
        }

        resolve()
      })
    })
  }

  return { start, close }
}
