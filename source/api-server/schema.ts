
import { Prisma } from '@prisma/client'
import { FastifySchema } from 'fastify'
import { z, ZodEnum, ZodType } from 'zod'

export function pagingSchema() {
  return z.object({
    size: z.number(),
    index: z.number()
  })
}

export function sortSchema<T extends ZodEnum<[string, ...string[]]>>(t: T) {
  return z.array(z.object({
    key: t,
    order: z.enum(['ASC', 'DESC'])
  }))
}

export function queryBodySchema<F extends ZodType, E extends ZodEnum<[string, ...string[]]>>(f: F, e: E) {
  return z.object({
    filter: f,
    sort: sortSchema(e),
    paging: pagingSchema()
  })
}

export function queryResultSchema<T extends ZodType>(t: T) {
  return z.object({
    total: z.number(),
    list: z.array(t)
  })
}

export function queryResponseSchema<T extends ZodType>(t: T) {
  return responseSchema(queryResultSchema(t))
}

/**
 * 为什么 responseSchema 的 status 只能是 SUCCESS
 * 在 RouteHandler 中，任何错误只能通过 throw ErrorResponse 来抛出，这么做有以下好处：
 * 1. 足够小的接口可以限制 RouteHandler 实现更加一致
 * 2. throw ErrorResponse 可以更好的跟踪错误调用栈
 */
export function responseSchema<T extends ZodType>(t: T) {
  return {
    default: z.object({
      message: z.string(),
      status: z.literal('SUCCESS'),
      data: t
    })
  }
}

export const EmailFilterSchema = z.object({
  to: z.array(z.string()).optional(),
  from: z.array(z.string()).optional()
})

export const EmailSchema = z.object({
  subject: z.string(),
  to: z.array(z.string()),
  from: z.array(z.string()),
  contentHtml: z.string(),
  contentText: z.string(),
  createdTime: z.string(),
})

export type Email = z.TypeOf<typeof EmailSchema>


export const QueryEmailBodySchema = queryBodySchema(EmailFilterSchema, z.enum(['createdTime']))
export type QueryEmailBody = z.TypeOf<typeof QueryEmailBodySchema>

export const QueryEmailResponseSchema = queryResponseSchema(EmailSchema)
export type QueryEmailResponse = z.TypeOf<typeof QueryEmailResponseSchema.default>

export const QueryEmailSchema = {
  body: QueryEmailBodySchema,
  response: QueryEmailResponseSchema
} satisfies FastifySchema


export function toPlain<T extends Prisma.EmailInboxGetPayload<undefined>>(model: T): Email {
  return {
    to: model.to,
    from: model.from,
    subject: model.subject,
    contentHtml: model.contentHtml,
    contentText: model.contentText,
    createdTime: model.createdTime.toISOString()
  }
}

export function toPlains<T extends Prisma.EmailInboxGetPayload<undefined>>(model: T[]): Email[] {
  return model.map(toPlain)
}
