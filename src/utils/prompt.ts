import prompts from "prompts";

export const actionPrompt = async (
  message: string,
  type: "Create" | "Update"
) => {
  const createRes = await prompts(
    {
      type: "select",
      name: "action",
      message: message,
      choices: [
        {
          title: "Skip",
          value: "Skip",
          selected: true,
        },
        {
          title: type,
          value: type,
        },
      ],
    },
    {
      onCancel: () => {
        process.exit(0);
      },
    }
  );

  return createRes.action === type;
};
