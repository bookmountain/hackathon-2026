// Delete account sheet: the word to type before "Delete permanently" works

export const CONFIRM_WORD = "DELETE";

/** Case and surrounding spaces don't matter, like the design */
export const deleteConfirmed = (text: string) => text.trim().toUpperCase() === CONFIRM_WORD;
