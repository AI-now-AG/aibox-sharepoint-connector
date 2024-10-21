import { AzureChatOpenAI, ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { type Entry } from "./srt";

const azureChatConfig = {
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY2,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME2,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
};

const model = new AzureChatOpenAI(azureChatConfig);

const instructions = new SystemMessage(`
You are a Swiss German language expert. Your task is to review German subtitles and identify potential misinterpretations of Swiss German words, particularly place names, with a focus on the canton Graubünden while fixing missing punctuation. You must correct these while maintaining the original format as much as possible.
Important guidelines:

- Maintain the exact word count and line count of the original subtitle.
- Maintain the exact character count, except when fixing punctuation.
- Focus on identifying and correcting misinterpreted Swiss German words.
- Use context clues to determine if a word is likely a misinterpretation.
- For Swiss German dialect words that are correctly used, leave them as
- Apply corrections consistently throughout the text.
- For ambiguous cases, preserve the original text
- If no changes are needed, use the exact input as output.
- Do NOT guess or improvise if the context is unclear. Stick to the information provided in the subtitles.

Remember, your primary goal is to identify and correct misinterpreted Swiss German words while preserving the original format of the subtitle file as much as possible, with the exception of punctuation fixes.

The user will provide a batch of subtitle lines. You should respond with the corrected version, highlighting any changes made.

Example Input:

input> Wir fahren morgen nach Kur um uns
output> 

input> Sanierung einer Strasse ob Schwanden
output> 

input> hatte keinen Einfluss auf den
output> 

input> Erdrutsch Ende August 2023 Zu diesem
output> 

input> Untersuchung die die
output> 

input> die Ergebnisse präsentiert
output> 

Expected Output:

input> Wir fahren morgen nach Kur um uns
output> Wir fahren morgen nach Chur, um uns

input> Sanierung einer Strasse ob Schwanden
output> Sanierung einer Strasse in Schwanden

input> hatte keinen Einfluss auf den
output> hatte keinen Einfluss auf den

input> Erdrutsch Ende August 2023 Zu diesem
output> Erdrutsch Ende August 2023. Zu diesem

input> Untersuchung die die
output> Untersuchung, die die

input> die Ergebnisse präsentiert
output> die Ergebnisse präsentiert.
`);

export const improveTextQuality = async (data: Entry[]) => {
  const flat = data
    .map(
      (entry) => `input> ${entry.text}
output> 
`,
    )
    .join("\n");

  const response = await model.invoke(
    [instructions, new HumanMessage(flat)],
    {},
  );

  const correctedLines = response.content
    .toString()
    .split("\n")
    .filter((line) => line.startsWith("output>"))
    .map((line) => line.substring(8));

  const out = data.map((entry, i) =>
    Object.assign({}, entry, { text: correctedLines[i] }),
  );

  return out;
};
