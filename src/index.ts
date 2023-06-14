import { createClient } from "contentful-management";
import figlet from "figlet";
import prompts from "prompts";
import { syncContentTypes } from "./actions/syncContentTypes";

console.log(figlet.textSync("Space Jumper"));

const questions: prompts.PromptObject<string>[] = [
  {
    type: "password",
    name: "token",
    message: "Contentful content management token?",
  },
];

(async () => {
  const response = await prompts(questions);

  const client = createClient({
    accessToken: response.token,
  });

  const spaces = (await client.getSpaces()).items;
  await syncContentTypes(spaces);
})();
