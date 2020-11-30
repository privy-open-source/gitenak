import { useContext } from './context'
import { useConfig } from './config'
import {
  Repository,
  Cred,
  FetchOptions,
  Reference,
  Signature,
  Reset,
} from 'nodegit'

export let repo: Repository

export async function initRepo (): Promise<void> {
  repo = await Repository.open(`${process.cwd()}/.git`)

  const remotes = await repo.getRemotes()
  const remote  = remotes.find((item) => {
    return item.url().includes('gitlab')
  })

  if (remote) {
    const context = useContext()
    const regex   = /([\w-]+\/[\w-]+).git$/
    const match   = regex.exec(remote.url())

    context.remote.name = remote.name()
    context.remote.url  = remote.url()

    if (match)
      context.projectId = match[1]
  }
}

export function useRepo (): Repository {
  return repo
}

export function createFetchConfig (): FetchOptions {
  const config   = useConfig()
  const username = 'oauth2'
  const password = config.get('gitlab.token')

  const fetchOptions: FetchOptions = {
    callbacks: {
      credentials: function (url: string, userName: string) {
        return url.startsWith('ssh:')
          ? Cred.sshKeyFromAgent(userName)
          : Cred.userpassPlaintextNew(username, password)
      },
      certificateCheck: function () {
        return false
      },
    },
  }

  return fetchOptions
}

export async function pullLatest (branch: string): Promise<void> {
  const context      = useContext()
  const remote       = context.remote.name
  const fetchOptions = createFetchConfig()

  await repo.fetch(remote, fetchOptions)
  await repo.mergeBranches(branch, `${remote}/${branch}`)
}

export async function pushLatest (branch: string): Promise<void> {
  const context      = useContext()
  const remote       = await repo.getRemote(context.remote.name)
  const reference    = await repo.getBranch(branch)
  const fetchOptions = createFetchConfig()

  await remote.push([`${reference.name()}:${reference.name()}`], fetchOptions)
}

export async function hasBranch (name: string): Promise<boolean> {
  try {
    return Boolean(await repo.getBranch(name))
  } catch {
    return false
  }
}

export async function startBranch (prefix: string, name: string, sourceBranch: string): Promise<void> {
  await pullLatest(sourceBranch)

  const branch  = `${prefix}/${name}`
  const commit  = await repo.getBranchCommit(sourceBranch)
  const isExist = await hasBranch(branch)

  // eslint-disable-next-line unicorn/prefer-ternary
  if (isExist)
    await repo.mergeBranches(branch, sourceBranch)
  else
    await repo.createBranch(branch, commit, false)

  await repo.checkoutBranch(branch)
}

export async function stageFile (files: string[]): Promise<void> {
  const index = await repo.refreshIndex()

  await index.addAll(files)
  await index.write()
}

export async function commitFile (message: string): Promise<void> {
  const context  = useContext()
  const config   = await repo.config()
  const username = (await config.getPath('user.name')) || context.username
  const email    = (await config.getPath('user.email')) || context.email

  const index     = await repo.refreshIndex()
  const oid       = await index.writeTree()
  const head      = await Reference.nameToId(repo, 'HEAD')
  const parent    = await repo.getCommit(head)
  const author    = Signature.now(username, email)
  const committer = Signature.now(username, email)

  await repo.createCommit('HEAD', author, committer, message, oid, [parent])
}

export async function revertFile (files: string | string[]): Promise<void> {
  const commit = await repo.getHeadCommit()

  await Reset.reset(repo, commit, Reset.TYPE.HARD, { paths: files })
}

export async function hasChanges (): Promise<boolean> {
  return (await repo.getStatus()).length > 0
}
