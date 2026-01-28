// api/utils.ts
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export function validateSchema(schema: object, data: unknown): void {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    throw new Error(
      "Schema validation failed:\n" + JSON.stringify(validate.errors, null, 2)
    );
  }
}