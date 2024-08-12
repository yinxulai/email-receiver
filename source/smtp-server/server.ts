import { convert } from 'html-to-text'
import { SMTPServer } from 'smtp-server'
import { simpleParser } from 'mailparser'
import { Server } from '../type'

export interface Email {
  to: string[]
  from: string[]
  subject: string
  contentHtml: string
  contentText: string
}

interface StmpServer extends Server {
  onEmail: (call: (email: Email) => void) => void
}

export function createSmtpServer(port: number): StmpServer {
  const emailCallbacks = new Set<((email: Email) => void)>()

  const server = new SMTPServer({
    onData: (stream, _session, callback) => {
      simpleParser(stream, async (err, email) => {
        if (err != null) {
          return callback(err)
        }

        const to: string[] = []
        const from: string[] = []
        const subject = email.subject || ''
        const contentHtml = email.text || ''
        const contentText = convert(contentHtml)

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

        emitEmail({ to, from, subject, contentHtml, contentText })
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

  function close() {
    return new Promise<void>((resolve) => {
      server.close(resolve)
    })
  }

  function start() {
    return new Promise<void>((resolve) => {
      server.listen(port, resolve)
    })
  }

  function onEmail(call: (email: Email) => void) {
    emailCallbacks.add(call)
  }

  function emitEmail(email: Email) {
    for (const call of emailCallbacks) {
      call(email)
    }
  }

  return {
    close,
    start,
    onEmail,
  }
}
