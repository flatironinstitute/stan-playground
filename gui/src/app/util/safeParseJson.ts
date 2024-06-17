export const safeParseJson = (text: string): any => {
    try {
        return JSON.parse(text)
    } catch (e) {
        return null
    }
}
