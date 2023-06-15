import figlet from "figlet";

export const printLogo = () => {
  console.clear();
  console.log(figlet.textSync("Space Jumper"));
};
