import fastify from 'fastify'
import { PrismaClient, EmailInbox } from '@prisma/client'

interface Response<T = unknown> {
  200: T,
  '4xx': {
    error: string
    message: string
  },
  '5xx': {
    error: string
    message: string
  }
}

interface QueryEmailsRequest {
  to?: string[]
  from?: string[]
}

type QueryEmailsResponse = Response<{
  count: number
  emails: EmailInbox[]
}>

interface ClearEmailsRequest {
  beforeDays: number
}

type ClearEmailsResponse = Response<{
  count: number
}>

export function startApiServer(port: number, db: PrismaClient): () => void {
  const debugLog = process.env.DEBUG_LOG
  const server = fastify({ logger: debugLog === 'true' })

  //** token 检查 */
  server.addHook('preHandler', (request, reply, done) => {
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

  /** 清理过期邮件 */
  server.post<{ Body: ClearEmailsRequest, Reply: ClearEmailsResponse }>('/clear', async (request, reply) => {
    const { beforeDays = 10 } = request.body
    // 获取当前时间
    const deleteTime = new Date()

    // 设置为 10 天前的时间
    deleteTime.setDate(deleteTime.getDate() - beforeDays)

    const result = await db.emailInbox.deleteMany({
      where: { createdTime: { lt: deleteTime } }
    })

    return reply.code(200).send(result)
  })

  /** 查询邮件 */
  server.post<{ Body: QueryEmailsRequest, Reply: QueryEmailsResponse }>('/query', async (request, reply) => {
    const { to = [], from = [] } = request.body

    if (!to.length && !from.length) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'senders or receivers is required'
      })
    }

    const result = await db.emailInbox.findMany({
      where: {
        ...(to.length > 0 ? { to: { hasSome: to } } : {}),
        ...(from.length > 0 ? { from: { hasSome: from } } : {}),
      },
      orderBy: { createdTime: 'desc' }
    })

    return reply.code(200).send({
      emails: result,
      count: result.length
    })
  })


  server.listen({ port }, err => {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    console.log(`API server listening at port ${port}`)
  })

  return () => server.close()
}
