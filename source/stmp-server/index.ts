import { SMTPServer } from 'smtp-server'
import { simpleParser } from 'mailparser'
import { PrismaClient } from '@prisma/client'

export function startStmpServer(port: number, db: PrismaClient): () => void {
  const server = new SMTPServer({
    onData: (stream, _session, callback) => {
      simpleParser(stream, async (err, email) => {
        if (err != null) {
          return callback(err)
        }

        const to: string[] = []
        const from: string[] = []
        const subject = email.subject || ''
        const content = email.html || email.text || ''

        if (email.from && email.from.value) {
          for (let index = 0; index < email.from.value.length; index++) {
            const emailAddress = email.from.value[index]
            if (emailAddress.address) from.push(emailAddress.address)
          }
        }

        if (email.to) {
          const toArray = Array.isArray(email.to) ? email.to : [email.to]
          for (let xIndex = 0; xIndex < toArray.length; xIndex++) {
            const address = toArray[xIndex]
            for (let yIndex = 0; yIndex < address.value.length; yIndex++) {
              const emailAddress = address.value[yIndex]
              if (emailAddress.address) to.push(emailAddress.address)
            }
          }
        }

        await db.emailInbox.create({
          data: {
            to,
            from,
            subject,
            content,
          }
        })

        callback()
      })
    },
    // 禁用身份验证
    authOptional: true,
    // 禁用验证
    onAuth: (_auth, _session, callback) => {
      callback(null, { user: 'anonymous' })
    }
  })
  server.listen(port, () => {
    console.log(`STMP server listening at port ${port}`)
  })
  return () => server.close()
}
