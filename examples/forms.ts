import { ArkyApiError, FormAnswerError } from "arky-sdk/storefront";
import { arky } from "./setup.js";

const form = await arky.forms.getByKey({ key: "contact" });

try {
  const submission = await arky.forms.submit({
    form,
    values: { email: "ana@example.com", message: "Hello" },
    language: "en",
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
