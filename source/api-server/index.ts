import { PrismaClient, EmailInbox } from '@prisma/client'
import fastify from 'fastify'

interface Response<T> {
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
  sender?: string
  receiver?: string
}

type QueryEmailsResponse = Response<{
  count: number
  emails: EmailInbox[]
}>

export function startApiServer(port: number, db: PrismaClient): () => void {
  const server = fastify()

  server.post<{ Body: QueryEmailsRequest, Reply: QueryEmailsResponse }>('/query', async (request, reply) => {
    const { receiver, sender } = request.body

    if (!receiver && !sender) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'sender or receiver is required'
      })
    }

    const result = await db.emailInbox.findMany({
      where: {
        ...(sender ? { sender: { has: sender } } : {}),
        ...(receiver ? { receiver: { has: receiver } } : {})
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
