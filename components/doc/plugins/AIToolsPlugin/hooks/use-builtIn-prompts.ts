import { TaskType } from "@/apps/web-app/settings/ai/hooks"

export const useBuiltInPrompts = () => {
  return [
    {
      id: 'mermaid',
      name: 'Mermaid',
      type: TaskType.Coding,
      icon: 'Network',
      content: `Generate a mermaid diagram from the given text. Follow these rules:
1. Always return the mermaid code that best matches the user's intent, providing the most likely chart type.
2. Ensure that the generated chart is clear, concise, and easy to understand. Intelligently infer the most suitable chart type based on the context, such as flowcharts, sequence diagrams, Gantt charts, etc. Optimize the chart layout to improve readability, and add appropriate annotations or labels when necessary.
3. Return only the mermaid content without any additional explanations.
4. Return the content in markdown format, enclosed in a code block with the language specified as mermaid.
5. Ensure that the generated mermaid syntax is correct and valid.`,
    },
    {
      id: 'translate',
      name: 'Translate',
      type: TaskType.Translation,
      icon: 'Languages',
      content: `Translate the given text to {{languages}}. You are a professional translator. Follow these rules:
1. Translate the text accurately while maintaining the original meaning and tone.
3. Return only the translated text without any additional explanations or comments.
4. Preserve any formatting or special characters present in the original text.`,
      parameters: [
        {
          name: 'Target language',
          key: 'languages',
          value: ['English', 'Chinese', 'Spanish', 'Arabic', 'Hindi', 'French', 'Russian', 'Portuguese', 'German', 'Japanese', 'Korean'],
          type: 'select',
          description: 'The target language to translate to.',
          required: true,
        }
      ]
    },
  ]
} 