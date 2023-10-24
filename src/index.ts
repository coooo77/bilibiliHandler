import { parse, join, extname } from 'path'
import { readdirSync, statSync } from 'fs'
import { execSync } from 'child_process'

import config from './config.json'
import { wilderCardHandler, moveFile } from './utils/helper'

import type Config from './types/config'

const { folderToCheck, validExts, renameRule, nameWildcard, folderToExeFfmpeg, excludeFolders, exeIntervalInMinutes } = config as Config

Object.entries(config).forEach(([key, value]) => {
  if (value === undefined) throw Error(`Fail to find key ${key} in config.json`)
})

let fileMap = new Map<string, number>()

async function mainProcess() {
  const exeFolderName = parse(folderToExeFfmpeg)?.name
  const excludeList = [...excludeFolders]
  if (exeFolderName) excludeList.push(exeFolderName)

  console.log(`\r\ncheck folder path: ${folderToCheck}`)

  const videoFolders = readdirSync(folderToCheck, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !excludeList.includes(dirent.name))
    .map(({ name }) => name)

  const streamerIds = Object.keys(renameRule)
  for (const folder of videoFolders) {
    const streamerId = streamerIds.find((id) => folder.includes(id))
    if (!streamerId) continue

    const rootPath = join(folderToCheck, folder)
    console.log(`\r\ncheck folder path:${rootPath} at ${new Date().toLocaleString()}`)

    const videoFiles = readdirSync(rootPath).filter((filename) => validExts.includes(extname(filename)))

    if (videoFiles.length === 0) {
      execSync(`recycle ${rootPath}`)
      continue
    }

    const wildCard = wilderCardHandler(nameWildcard, { id: streamerId, name: renameRule[streamerId] })

    for (const videoFile of videoFiles) {
      const toName = wildCard + videoFile
      const fromPath = join(rootPath, videoFile)
      const fileInfo = statSync(fromPath)

      const shouldMoveFile = fileMap.get(toName) === fileInfo.size

      if (shouldMoveFile) {
        const toPath = join(folderToExeFfmpeg, toName)
        try {
          await moveFile(fromPath, toPath)
        } catch (error) {
          const err = error as { message: string }
          console.log(err?.message)
        } finally {
          fileMap.delete(toName)
        }
      } else {
        fileMap.set(toName, fileInfo.size)
      }
    }
  }
}

function intervalFn() {
  setTimeout(async () => {
    await mainProcess()

    intervalFn()
  }, 60 * 1000 * exeIntervalInMinutes)
}

mainProcess().then(intervalFn)
