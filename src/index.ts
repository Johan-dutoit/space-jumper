import { createClient } from "contentful-management";
import figlet from "figlet";
import prompts from "prompts";
import { createMissingContentTypes } from "./actions/createMissingContentTypes";

console.log(figlet.textSync("Space Jumper"));

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
  await createMissingContentTypes(spaces);
})();
