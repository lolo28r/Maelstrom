const PAGE_LENGTH = 900;

export function paginateDocument(content: string): string[] {
    const pages: string[] = [];
    let remaining = content;

    while (remaining.length > PAGE_LENGTH) {
        const candidate = remaining.slice(0, PAGE_LENGTH + 1);
        const paragraphEnd = candidate.lastIndexOf('\n\n');
        const sentenceEnd = Math.max(candidate.lastIndexOf('. '), candidate.lastIndexOf('? '), candidate.lastIndexOf('! '));
        const whitespaceEnd = candidate.search(/\s+\S*$/);
        const splitAt = paragraphEnd >= PAGE_LENGTH / 3
            ? paragraphEnd + 2
            : sentenceEnd >= PAGE_LENGTH / 3
                ? sentenceEnd + 2
                : whitespaceEnd > 0 ? whitespaceEnd : PAGE_LENGTH;
        pages.push(remaining.slice(0, splitAt));
        remaining = remaining.slice(splitAt);
    }

    if (remaining || pages.length === 0) pages.push(remaining);
    return pages;
}
