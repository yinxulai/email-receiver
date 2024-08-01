export interface Server {
  close: () => Promise<void>
  start: () => Promise<void>
}
