export const s_String = { type: "string" };

export const s_StringNotBlank = { type: "string", minLength: 1 };

export const s_StringArray = { type: "array", items: s_String };

export const s_StringNotBlankArray = { type: "array", items: s_StringNotBlank };

export const s_Null = { type: "null" };

export const s_NullOrString = { oneOf: [s_Null, s_String] };

export const s_NullOrStringNotBlank = { oneOf: [s_Null, s_StringNotBlank] };

export const s_Anything = {};

export const s_Boolean = { type: "boolean" };
