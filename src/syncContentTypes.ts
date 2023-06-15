import { Space } from "contentful-management";
import { diffString } from "json-diff";
import { printLogo } from "./utils/display";
import { envPicker } from "./utils/envPicker";
import { actionPrompt } from "./utils/prompt";

export const syncContentTypes = async (spaces: Space[]) => {
  const [_sourceSpace, sourceEnvironment] = await envPicker(spaces, "source");
  const [_targetSpace, targetEnvironment] = await envPicker(spaces, "target");

  const sourceTypes = await sourceEnvironment.getContentTypes();
  const targetTypes = await targetEnvironment.getContentTypes();

  for (const sourceContentType of sourceTypes.items) {
    const targetContentType = targetTypes.items.find(
      (item) => item.sys.id === sourceContentType.sys.id
    );

    if (targetContentType == null) {
      const shouldCreate = await actionPrompt(
        `Create ${sourceContentType.sys.id} in ${targetEnvironment.name}?`,
        "Create"
      );
      if (!shouldCreate) {
        continue;
      }

      const { sys, ...rest } = sourceContentType;
      const contentType = await targetEnvironment.createContentTypeWithId(
        sys.id,
        {
          ...rest,
        }
      );
      await contentType.publish();
      continue;
    }

    let changesMade = false;

    for (const sourceField of sourceContentType.fields) {
      const targetField = targetContentType.fields.find(
        ({ id }) => id === sourceField.id
      );

      printLogo();

      if (targetField == null) {
        const shouldCreate = await actionPrompt(
          `Create ${sourceField.id} in ${targetContentType.sys.id}?`,
          "Create"
        );
        if (!shouldCreate) {
          continue;
        }
        changesMade = true;

        targetContentType.fields.push(sourceField);
        continue;
      } else {
        const changes = diffString(targetField, sourceField);
        if (!changes) {
          continue;
        }

        console.log(`${targetField.id} changes\n${changes}`);

        const shouldUpdate = await actionPrompt(
          `Update ${targetField.id} in ${targetContentType.sys.id}?`,
          "Update"
        );

        if (!shouldUpdate) {
          continue;
        }

        changesMade = true;

        targetField.disabled = sourceField.disabled;
        targetField.items = sourceField.items;
        targetField.linkType = sourceField.linkType;
        targetField.localized = sourceField.localized;
        targetField.name = sourceField.name;
        targetField.omitted = sourceField.omitted;
        targetField.required = sourceField.required;
        targetField.type = sourceField.type;
        targetField.validations = sourceField.validations;
      }
    }

    if (changesMade) {
      const updatedContentType = await targetContentType.update();
      await updatedContentType.publish();
    }
  }
};
