import { useContext } from './context'
import { useConfig } from './config'
import Git, { SimpleGit } from 'simple-git/promise'
import { URL } from 'url'

export let repo: SimpleGit

export async function initRepo (): Promise<void> {
  repo = Git()

  const remotes = await repo.getRemotes(true)
  const remote  = remotes.find((item) => {
    return item.refs.fetch === item.refs.push
      && item.refs.fetch.includes('gitlab')
  })

  if (remote) {
    const context = useContext()
    const regex   = /([\w-]+\/[\w-]+).git$/
    const url     = remote.refs.fetch
    const match   = regex.exec(url)

    context.remote.name = remote.name
    context.remote.url  = url

    if (match)
      context.projectId = match[1]
  }
}

export function useRepo (): SimpleGit {
  return repo
}

export async function pullLatest (branch: string): Promise<void> {
  const context = useContext()
  const config  = useConfig()
  const url     = new URL(context.remote.url)

  if (url.protocol === 'https:') {
    url.username = 'oauth2'
    url.password = config.get('gitlab.token')
  }

  await repo.pull(url.toString(), `${branch}:${branch}`)
}

export async function pushLatest (branch: string): Promise<void> {
  const context = useContext()
  const config  = useConfig()
  const url     = new URL(context.remote.url)

  if (url.protocol === 'https:') {
    url.username = 'oauth2'
    url.password = config.get('gitlab.token')
  }

  await repo.push(url.toString(), `${branch}:${branch}`)
}

export async function startBranch (prefix: string, name: string, sourceBranch: string): Promise<void> {
  await pullLatest(sourceBranch)
  await repo.checkoutBranch(`${prefix}/${name}`, sourceBranch)
}

export async function stageFile (files: string[]): Promise<void> {
  await repo.add(files)
}

export async function commitFile (message: string): Promise<void> {
  // eslint-disable-next-line unicorn/no-null
  await repo.commit(message, undefined, { '--no-verify': null })
}

export async function revertFile (files: string[]): Promise<void> {
  await repo.checkout(['--', ...files])
}

export async function hasChanges (): Promise<boolean> {
  return (await repo.status()).isClean() === false
}
