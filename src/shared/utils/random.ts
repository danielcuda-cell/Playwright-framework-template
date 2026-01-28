export function generateTemplateId(length = 12) {
  return `cl${Math.random().toString(36).substring(2, 2 + length)}`;
}

