import { parse, join, extname } from 'path'
import { readdirSync } from 'fs'

import config from './config.json'
import { wilderCardHandler, moveFile } from './utils/helper'

import type Config from './types/config'

const { folderToCheck, validExts, renameRule, nameWildcard, folderToExeFfmpeg, excludeFolders, exeIntervalInMinutes } = config as Config

Object.entries(config).forEach(([key, value]) => {
  if (value === undefined) throw Error(`Fail to find key ${key} in config.json`)
})

async function mainProcess() {
  const exeFolderName = parse(folderToExeFfmpeg)?.name
  const excludeList = [...excludeFolders]
  if (exeFolderName) excludeList.push(exeFolderName)

  console.log(`check folder path: ${folderToCheck}`)

  const videoFolders = readdirSync(folderToCheck, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !excludeList.includes(dirent.name))
    .map(({ name }) => name)

  const videoFilesToConvert = [] as string[]

  const streamerIds = Object.keys(renameRule)
  for (const folder of videoFolders) {
    const streamerId = streamerIds.find((id) => folder.includes(id))
    if (!streamerId) continue

    const rootPath = join(folderToCheck, folder)
    console.log(`check folder path:${rootPath}`)
    const videoFiles = readdirSync(rootPath).filter((filename) => validExts.includes(extname(filename)))

    const wildCard = wilderCardHandler(nameWildcard, { id: streamerId, name: renameRule[streamerId] })
    for (const videoFile of videoFiles) {
      const fromPath = join(rootPath, videoFile)
      const toPath = join(folderToExeFfmpeg, wildCard + videoFile)
      try {
        await moveFile(fromPath, toPath)

        videoFilesToConvert.push(toPath)
      } catch (error) {
        console.error(error)
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
