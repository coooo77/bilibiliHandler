import { parse } from 'path'
import fs, { copyFileSync, unlinkSync, renameSync } from 'fs'

interface WilderCardHandlerOptions {
  name?: string
  id?: string
}

export function wilderCardHandler(wildCard: string, options: WilderCardHandlerOptions) {
  const { name = 'invalid_name', id = 'invalid_id' } = options
  if (id) wildCard = wildCard.replace('{id}', id)
  if (name) wildCard = wildCard.replace('{name}', name)
  return wildCard
}

export function wait(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

export async function reTry(fn: Function, maxRetries = 3, intervalInSec = 0.5) {
  try {
    await fn()
  } catch (error: any) {
    if (maxRetries <= 0) throw new Error(error?.message)

    await wait(intervalInSec)

    await reTry(fn, --maxRetries)
  }
}

export function moveFileCrossDevice(fromPath: string, toPath: string) {
  copyFileSync(fromPath, toPath)

  unlinkSync(fromPath)
}

export async function moveFile(fromPath: string, toPath: string) {
  console.log(`move file ${fromPath} to ${toPath}...`)

  const to = parse(toPath)
  const from = parse(fromPath)
  const isSameRoot = from.root === to.root

  const moveFn = isSameRoot ? renameSync.bind(fs, fromPath, toPath) : moveFileCrossDevice.bind(null, fromPath, toPath)

  try {
    await reTry(moveFn)
  } catch (error: any) {
    throw new Error(`Error occurred when move file: ${fromPath}, cross device to: ${toPath}, reason: ${error?.message}`)
  }
}
