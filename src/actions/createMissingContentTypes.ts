import chalk from "chalk";
import { ContentType, Environment, Space } from "contentful-management";
import prompts from "prompts";
import { envPicker } from "../utils/envPicker";

const handleNewTypes = async (
  targetEnvironment: Environment,
  newTypes: ContentType[]
) => {
  for (const item of newTypes) {
    const actionResponse = await prompts(
      {
        type: "select",
        name: "choice",
        message: `Create ${item.sys.id}?`,
        choices: [
          {
            title: "Skip",
            value: "Skip",
          },
          {
            title: "Create",
            value: "Create",
          },
          {
            title: "Create and publish",
            value: "CreatePublish",
          },
        ],
      },
      {
        onCancel: () => {
          process.exit(0);
        },
      }
    );

    if (actionResponse.choice === "Create") {
      const { sys, ...rest } = item;
      const contentType = await targetEnvironment.createContentTypeWithId(
        sys.id,
        {
          ...rest,
        }
      );

      if (actionResponse.choice === "CreatePublish") {
        await contentType.publish();
      }
    }
  }
};

export const createMissingContentTypes = async (spaces: Space[]) => {
  const [_sourceSpace, sourceEnvironment] = await envPicker(spaces, "source");
  const [_targetSpace, targetEnvironment] = await envPicker(spaces, "target");

  const sourceTypes = await sourceEnvironment.getContentTypes();
  const targetTypes = await targetEnvironment.getContentTypes();

  const missingTypes = sourceTypes.items.filter((item) => {
    const targetContentType = targetTypes.items.find(
      (targetItem) => targetItem.sys.id === item.sys.id
    );

    return targetContentType == null;
  });

  if (missingTypes.length === 0) {
    console.log(chalk.yellow("No new content types to create."));
  }

  await handleNewTypes(targetEnvironment, missingTypes);
};
