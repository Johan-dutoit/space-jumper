import { ContentType, Environment, Space } from "contentful-management";
import { DiffItem, diff } from "json-diff";
import prompts from "prompts";
import { envPicker } from "../utils/envPicker";

const handleNewTypes = async (
  targetSpace: Space,
  targetEnvironment: Environment,
  newTypes: DiffItem<ContentType>[]
) => {
  for (const [_, item] of newTypes) {
    const actionResponse = await prompts({
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
    });

    if (actionResponse.choice === "Skip") {
      continue;
    } else {
      const contentType = await targetEnvironment.createContentTypeWithId(
        item.sys.id,
        { ...item }
      );

      if (actionResponse.choice === "CreatePublish") {
        await contentType.publish();
      }
    }
  }
};

export const syncContentTypes = async (spaces: Space[]) => {
  const [_sourceSpace, sourceEnvironment] = await envPicker(spaces, "source");
  const [targetSpace, targetEnvironment] = await envPicker(spaces, "target");

  const sourceTypes = await sourceEnvironment.getContentTypes();
  const targetTypes = await targetEnvironment.getContentTypes();

  const difference = diff<ContentType>(targetTypes, sourceTypes, {
    full: true,
  });

  const res = await prompts({
    type: "confirm",
    message: `These changes will apply to ${targetSpace.name}`,
    name: "confirm",
  });

  if (!res.confirm) {
    return;
  }

  const newTypes = difference.items.filter(([type]) => type === "+");
  await handleNewTypes(targetSpace, targetEnvironment, newTypes);
};
