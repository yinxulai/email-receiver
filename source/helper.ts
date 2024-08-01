export function getRandomHighPort() {
  // 定义可用的端口范围
  const MIN_PORT = 49152
  const MAX_PORT = 65535

  // 生成随机端口号
  return Math.floor(Math.random() * (MAX_PORT - MIN_PORT + 1)) + MIN_PORT
}
