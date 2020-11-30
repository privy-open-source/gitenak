declare module 'lint-staged' {
  interface Options {
    allowEmpty?: boolean
    concurrent?: boolean
    config?: any
    cwd?: string
    debug?: boolean
    maxArgLength?: number
    quiet?: boolean
    relative?: boolean
    shell?: boolean
    stash?: boolean
    verbose?: boolean
  }

  export default function name(options: Options): Promise<boolean>
}
