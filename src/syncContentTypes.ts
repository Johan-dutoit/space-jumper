import { Space } from "contentful-management";
import { diffString } from "json-diff";
import { printEnvironment, printKey, printLogo } from "./utils/display";
import { envPicker } from "./utils/envPicker";
import { actionPrompt } from "./utils/prompt";

export const syncContentTypes = async (spaces: Space[]) => {
  const [sourceSpace, sourceEnvironment] = await envPicker(spaces, "source");
  const [targetSpace, targetEnvironment] = await envPicker(spaces, "target");

  const sourceTypes = await sourceEnvironment.getContentTypes();
  const targetTypes = await targetEnvironment.getContentTypes();

  const sourceFullName = `${sourceSpace.name}.${sourceEnvironment.name}`;
  const targetFullName = `${targetSpace.name}.${targetEnvironment.name}`;

  for (const sourceContentType of sourceTypes.items) {
    const targetContentType = targetTypes.items.find(
      (item) => item.sys.id === sourceContentType.sys.id
    );

    if (targetContentType == null) {
      printLogo();
      printEnvironment(sourceFullName, targetFullName);
      printKey();

      const shouldCreate = await actionPrompt(
        `Create new Content Type {sourceContentType.sys.id} on ${targetFullName}?`,
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

      const fieldFullName = `${sourceContentType.sys.id}.${sourceField.id}`;

      printLogo();
      printEnvironment(sourceFullName, targetFullName);
      printKey();

      if (targetField == null) {
        const shouldCreate = await actionPrompt(
          `Create new Field ${sourceContentType.sys.id}.${sourceField.id} on ${targetFullName}?`,
          "Create"
        );
        if (!shouldCreate) {
          continue;
        }
        changesMade = true;

        targetContentType.fields.push(sourceField);
        continue;
      }

      const differences = diffString(targetField, sourceField);
      if (!differences) {
        continue;
      }

      console.log(`${fieldFullName} differences\n${differences}`);

      const shouldUpdate = await actionPrompt(
        `Update Field ${fieldFullName} on ${targetFullName}?`,
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

    if (changesMade) {
      const updatedContentType = await targetContentType.update();
      await updatedContentType.publish();
    }
  }
};
