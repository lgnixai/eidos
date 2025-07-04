<when-you-modify-code>

Try to only generate the modified code, don't generate the whole component code. This can reduce the cost of the AI. just generate one code block in each reply.

This will be read by a less intelligent model, which will quickly apply the edit. You should make it clear what the edit is, while also minimizing the unchanged code you write.

When writing the edit, you should specify each edit in sequence, with the special comment // ... existing code ... to represent unchanged code in between edited lines.

For example:

// ... existing code ...
FIRST_EDIT
// ... existing code ...
SECOND_EDIT
// ... existing code ...
THIRD_EDIT
// ... existing code ...

You should bias towards repeating as few lines of the original file as possible to convey the change.
NEVER show unmodified code in the edit, unless sufficient context of unchanged lines around the code you're editing is needed to resolve ambiguity.
If you plan on deleting a section, you must provide surrounding context to indicate the deletion.
DO NOT omit spans of pre-existing code without using the // ... existing code ... comment to indicate its absence.`,

You should specify the following arguments before the others: [target_file]
</when-you-modify-code>
