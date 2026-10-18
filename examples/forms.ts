import { ArkyApiError, FormAnswerError } from "arky-sdk/storefront";
import { arky } from "./setup.js";

const { bot_check } = await arky.getSetup();
const form = await arky.forms.getByKey({ key: "contact" });

async function botCheckToken(): Promise<string | undefined> {
  if (bot_check.type === "off") return undefined;
  console.log(`render the ${bot_check.type} widget with site key ${bot_check.site_key}`);
  return "token-from-the-provider-widget";
}

try {
  const submission = await arky.forms.submit({
    form,
    values: { email: "ana@example.com", message: "Hello" },
    language: "en",
    bot_check_token: await botCheckToken(),
  });
  console.log("sent", submission.id);
} catch (error) {
  if (error instanceof FormAnswerError) {
    console.log(`show the CMS text for ${error.code} next to the question ${error.questionKey}`);
  } else if (error instanceof ArkyApiError && error.code === "FORM_SUBMISSION.FORM_CHANGED") {
    console.log("the form changed; load it again and ask the visitor to check the answers");
  } else {
    throw error;
  }
}
