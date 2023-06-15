import { createClient } from "contentful-management";
import prompts from "prompts";
import { syncContentTypes } from "./syncContentTypes";
import { printLogo } from "./utils/display";

printLogo();

const questions: prompts.PromptObject<string>[] = [
  {
    type: "password",
    name: "token",
    message: "Contentful content management token?",
  },
];

(async () => {
  const response = await prompts(questions, {
    onCancel: () => {
      process.exit(0);
    },
  });

  const client = createClient({
    accessToken: response.token,
  });

  const spaces = (await client.getSpaces()).items;
  await syncContentTypes(spaces);
})();
