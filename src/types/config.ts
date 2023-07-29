type Id = string

type StreamerName = string

export default interface Config {
  renameRule: { [key: Id]: StreamerName }
  nameWildcard: string
  folderToCheck: string
  folderToExeFfmpeg: string
  excludeFolders: string[]
  validExts: string[]
  exeIntervalInMinutes: number
}
