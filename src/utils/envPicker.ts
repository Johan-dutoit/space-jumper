import { Space } from "contentful-management";
import prompts from "prompts";

export const envPicker = async (spaces: Space[], type: "source" | "target") => {
  const spaceResponse = await prompts(
    {
      type: "select",
      name: "space",
      message: `Which space would you like to use as the ${type}?`,
      choices: spaces.map(({ name, sys }) => ({
        title: name,
        value: sys.id,
      })),
    },
    {
      onCancel: () => {
        process.exit(0);
      },
    }
  );

  const space = spaces.find(({ sys }) => sys.id === spaceResponse.space)!;

  const environments = (await space.getEnvironments()).items;
  const environmentResponse = await prompts(
    {
      type: "select",
      name: "environment",
      message: `Which environment would you like to use as the ${type}?`,
      choices: environments.map(({ name, sys }) => ({
        title: name,
        value: sys.id,
      })),
    },
    {
      onCancel: () => {
        process.exit(0);
      },
    }
  );

  const environment = environments.find(
    ({ sys }) => sys.id === environmentResponse.environment
  )!;

  const editorInterfaces = (await environment.getEditorInterfaces()).items;
  return [space, environment, editorInterfaces] as const;
};
