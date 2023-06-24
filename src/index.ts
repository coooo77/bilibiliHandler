import { join, extname } from 'path'
import { readdirSync, renameSync, existsSync, unlinkSync } from 'fs'

import config from './config.json'
import { wilderCardHandler, spawnWithConsole } from './utils/helper'

import type Config from './types/config'
;(async () => {
  const { folderToCheck, validExts, renameRule, nameWildcard, folderToExeFfmpeg, excludeFolders, ffmpegOutPutPostFix, ffmpegOptions } = config as Config

  const videoFolders = readdirSync(folderToCheck, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !excludeFolders.includes(dirent.name))
    .map(({ name }) => name)

  const videoFilesToConvert = [] as string[]

  const streamerIds = Object.keys(renameRule)
  for (const folder of videoFolders) {
    const streamerId = streamerIds.find((id) => folder.includes(id))
    if (!streamerId) continue

    const rootPath = join(folderToCheck, folder)
    const videoFiles = readdirSync(rootPath).filter((filename) => validExts.includes(extname(filename)))

    const wildCard = wilderCardHandler(nameWildcard, { id: streamerId, name: renameRule[streamerId] })
    for (const videoFile of videoFiles) {
      const fromPath = join(rootPath, videoFile)
      const toPath = join(folderToExeFfmpeg, wildCard + videoFile)
      renameSync(fromPath, toPath)

      videoFilesToConvert.push(toPath)
    }
  }

  for (const video of videoFilesToConvert) {
    const ext = extname(video)
    const outputFileName = video.replace(ext, `${ffmpegOutPutPostFix}${ext}`)
    const command = `ffmpeg -i ${video} ${ffmpegOptions} ${outputFileName}`

    try {
      await spawnWithConsole(command)
      if (existsSync(outputFileName)) unlinkSync(video)
    } catch (error) {
      console.error(error)
    }
  }
})()
