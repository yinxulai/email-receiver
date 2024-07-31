import { SMTPServer } from 'smtp-server'
import { simpleParser } from 'mailparser'
import { PrismaClient } from '@prisma/client'

export function startStmpServer(port: number, db: PrismaClient): () => void {
  const server = new SMTPServer({
    onData: (stream, _session, callback) => {
      simpleParser(stream, async (err, mail) => {
        if (err != null) {
          return callback(err)
        }

        const sender: string[] = []
        const receiver: string[] = []
        const content = mail.html || mail.text || 'No content'

        if (mail.from && mail.from.value) {
          for (let index = 0; index < mail.from.value.length; index++) {
            const emailAddress = mail.from.value[index]
            if (emailAddress.address) sender.push(emailAddress.address)
          }
        }

        if (mail.to) {
          const toArray = Array.isArray(mail.to) ? mail.to : [mail.to]
          for (let xIndex = 0; xIndex < toArray.length; xIndex++) {
            const address = toArray[xIndex]
            for (let yIndex = 0; yIndex < address.value.length; yIndex++) {
              const emailAddress = address.value[yIndex]
              if (emailAddress.address) receiver.push(emailAddress.address)
            }
          }
        }

        await db.emailInbox.create({
          data: {
            sender,
            receiver,
            content
          }
        })

        callback()
      })
    }
  })
  server.listen(port, () => {
    console.log(`STMP server listening at port ${port}`)
  })
  return () => server.close()
}
