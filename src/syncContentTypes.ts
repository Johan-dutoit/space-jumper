import { Space } from "contentful-management";
import { diffString } from "json-diff";
import { printEnvironment, printKey, printLogo } from "./utils/display";
import { envPicker } from "./utils/envPicker";
import { actionPrompt } from "./utils/prompt";

export const syncContentTypes = async (spaces: Space[]) => {
  const [sourceSpace, sourceEnvironment, sourceEditorInterfaces] =
    await envPicker(spaces, "source");
  const [targetSpace, targetEnvironment, targetEditorInterfaces] =
    await envPicker(spaces, "target");

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
        `Create new Content Type ${sourceContentType.sys.id} on ${targetFullName}?`,
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
    } else {
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

    const sourceEditorInterface = sourceEditorInterfaces.find(
      (ei) => ei.sys.contentType.sys.id === sourceContentType.sys.id
    )!;

    let targetEditorInterface = targetEditorInterfaces.find(
      (ei) => ei.sys.contentType.sys.id === sourceContentType.sys.id
    );

    if (!targetEditorInterface) {
      targetEditorInterface =
        await targetEnvironment.getEditorInterfaceForContentType(
          sourceContentType.sys.id
        );
    }

    const differences = diffString(
      targetEditorInterface,
      sourceEditorInterface,
      {
        excludeKeys: ["sys"],
      }
    );

    if (!differences) {
      continue;
    }

    console.log(
      `${sourceContentType.sys.id} appearance differences\n${differences}`
    );

    const shouldUpdateAppearance = await actionPrompt(
      `Update Appearance for Content Type ${sourceContentType.sys.id} on ${targetFullName}?`,
      "Update"
    );

    if (!shouldUpdateAppearance) {
      continue;
    }

    targetEditorInterface.controls = sourceEditorInterface.controls;
    targetEditorInterface.editor = sourceEditorInterface.editor;
    targetEditorInterface.editorLayout = sourceEditorInterface.editorLayout;
    targetEditorInterface.editors = sourceEditorInterface.editors;
    targetEditorInterface.groupControls = sourceEditorInterface.groupControls;
    targetEditorInterface.sidebar = sourceEditorInterface.sidebar;
    await targetEditorInterface.update();
  }
};
