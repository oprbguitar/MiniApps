const download = (name, content, mime) => {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

export const exportAsTxt = (prompt) => download(`${prompt.title || "prompt"}.txt`, prompt, "text/plain;charset=utf-8");
export const exportAsJson = (promptObject) => download(`${promptObject.title || "prompt"}.json`, JSON.stringify(promptObject, null, 2), "application/json");
export const exportAsMarkdown = (promptObject) => {
  const md = `# ${promptObject.title}\n\n## Meta\n- Category: ${promptObject.category}\n- Target: ${promptObject.target_model}\n\n## Prompt\n\n\
${promptObject.final_prompt}`;
  download(`${promptObject.title || "prompt"}.md`, md, "text/markdown;charset=utf-8");
};
