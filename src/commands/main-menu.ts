import inquirer, { Separator } from 'inquirer'

export const menus = [
  { name: 'Start Task', value: 'start-task' },
  { name: 'Finish Task', value: 'finish-task' },
  new Separator(),
  { name: 'Commit Change', value: 'commit' },
  { name: 'Discard Change', value: 'discard' },
  new Separator(),
  { name: 'Quit', value: 'quit' },
]

export default async function mainMenu (): Promise<void> {
  const result = await inquirer.prompt([
    {
      type   : 'list',
      name   : 'menu',
      message: 'What do you want??',
      loop   : false,
      choices: menus,
    },
  ])

  if (result.menu)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    await require(`./${result.menu}`).default()
}
