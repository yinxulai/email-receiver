import * as https from 'https'
import { PrismaClient, EmailInbox } from '@prisma/client'
import fastify, { FastifyInstance, FastifyPluginCallback, FastifyRequest, preHandlerHookHandler } from 'fastify'

interface Response<T = unknown> {
  200: {
    data: T
  },
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
  sender?: string[]
  receiver?: string[]
}

type QueryEmailsResponse = Response<{
  count: number
  emails: EmailInbox[]
}>

export function startApiServer(port: number, db: PrismaClient): () => void {
  const server = fastify({ logger: true })

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


  server.post<{ Body: QueryEmailsRequest, Reply: QueryEmailsResponse }>('/query', async (request, reply) => {
    const { receiver = [], sender = [] } = request.body

    if (!receiver && !sender) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'sender or receiver is required'
      })
    }

    const result = await db.emailInbox.findMany({
      where: {
        ...(sender.length > 0 ? { sender: { hasSome: sender } } : {}),
        ...(receiver.length > 0 ? { receiver: { hasSome: receiver } } : {})
      }
    })

    return reply.code(200).send({
      data: {
        emails: result,
        count: result.length
      }
    })
  })

  server.listen({ port }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })

  return () => server.close()
}
