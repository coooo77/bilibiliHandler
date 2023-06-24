import { spawn } from 'child_process'

interface WilderCardHandlerOptions {
  name?: string
  id?: string
}

export function wilderCardHandler(wildCard: string, options: WilderCardHandlerOptions) {
  const { name, id } = options
  if (id) wildCard = wildCard.replace('{id}', id)
  if (name) wildCard = wildCard.replace('{name}', name)
  return wildCard
}

export async function spawnWithConsole(command: string) {
  return new Promise((res, rej) => {
    try {
      const task = spawn(command, [], { shell: true })

      task.stderr.on('data', (data) => console.log('stderr', data.toString()))
      task.on('close', res)
    } catch (error) {
      console.error(error)
      rej()
    }
  })
}
