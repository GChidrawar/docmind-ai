// Prompt templates shown on the empty chat screen.
export interface PromptTemplate {
  icon: string
  title: string
  desc: string
  prompt: string
}

export const getTemplates = (scoped: boolean): PromptTemplate[] => {
  const t = scoped ? 'this document' : 'the documents'
  return [
    { icon: '📄', title: 'Summarize Key Points', desc: 'Summarize the key points and executive highlights of this document.', prompt: `Summarize the key points and executive highlights of ${t}.` },
    { icon: '❓', title: 'Interview / Q&A Insights', desc: 'What are the most critical questions and answers covered in this text?', prompt: `What are the most critical questions and answers covered in ${t}?` },
    { icon: '📝', title: 'Action Items & Deadlines', desc: 'List all actionable takeaways, deadlines, and responsibilities mentioned.', prompt: `List all actionable takeaways, deadlines, and responsibilities mentioned in ${t}.` },
    { icon: '🔍', title: 'Technical Concepts', desc: 'Explain the main technical concepts and architecture described in this document.', prompt: `Explain the main technical concepts and architecture described in ${t}.` },
  ]
}
