import inquirer from 'inquirer'

export default async function mainMenu (): Promise<void> {
  const result = await inquirer.prompt([
    {
      type   : 'list',
      name   : 'menu',
      message: 'What do you want??',
      loop   : false,
      choices: [
        { name: 'Start Task', value: 'start-task' },
        { name: 'Finish Task', value: 'finish-task' },
        { name: 'Commit', value: 'commit' },
        { name: 'Quit', value: 'quit' },
      ],
    },
  ])

  if (result.menu)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    await require(`./${result.menu}`).default()
}
