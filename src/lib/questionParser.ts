export interface ParsedQuestion {
    id?: string;
    text: string;
    options: string[];
    correctAnswer: number; // 0-indexed option index
    points: number;
    explanation?: string;
    isError?: boolean;
    errorMessage?: string;
    rawText?: string;
}

/**
 * Normalizes option prefixes and identifies correct option index
 */
function normalizeOptionPrefix(line: string): { label: string; text: string } | null {
    const trimmed = line.trim();
    // English: A. or A) or (A) or A - 
    const enMatch = trimmed.match(/^([A-D])[\.\)\-\:\s]\s*(.+)$/i);
    if (enMatch) {
        return { label: enMatch[1].toUpperCase(), text: enMatch[2].trim() };
    }
    // Arabic: أ. or أ) or ب. or ج. or د.
    const arMatch = trimmed.match(/^([أابجد])[\.\)\-\:\s]\s*(.+)$/);
    if (arMatch) {
        const letter = arMatch[1];
        let label = 'A';
        if (letter === 'أ' || letter === 'ا') label = 'A';
        else if (letter === 'ب') label = 'B';
        else if (letter === 'ج') label = 'C';
        else if (letter === 'د') label = 'D';
        return { label, text: arMatch[2].trim() };
    }
    return null;
}

/**
 * Identifies answer indicator line
 */
function parseAnswerLine(line: string): { answerIndex: number; rawAnswer: string } | null {
    const trimmed = line.trim();
    // Matching patterns like: "Answer: B", "Correct Answer: C", "الإجابة الصحيحة: ب", "الإجابة: أ"
    const match = trimmed.match(/(?:Correct\s*Answer|Answer|الإجابة\s*الصحيحة|الإجابة|الحل)[\:\s=]*([A-D|أ|ا|ب|ج|د|1-4])/i);
    if (match) {
        const ans = match[1].toUpperCase();
        let idx = -1;
        if (ans === 'A' || ans === 'أ' || ans === 'ا' || ans === '1') idx = 0;
        else if (ans === 'B' || ans === 'ب' || ans === '2') idx = 1;
        else if (ans === 'C' || ans === 'ج' || ans === '3') idx = 2;
        else if (ans === 'D' || ans === 'د' || ans === '4') idx = 3;

        if (idx !== -1) {
            return { answerIndex: idx, rawAnswer: ans };
        }
    }
    return null;
}

/**
 * Identifies points line
 */
function parsePointsLine(line: string): number | null {
    const trimmed = line.trim();
    const match = trimmed.match(/(?:Points|الدرجات|النقاط|الدرجة)[\:\s=]*(\d+(?:\.\d+)?)/i);
    if (match) {
        return parseFloat(match[1]);
    }
    return null;
}

/**
 * Identifies explanation line
 */
function parseExplanationLine(line: string): string | null {
    const trimmed = line.trim();
    const match = trimmed.match(/(?:Explanation|الشرح|التفسير)[\:\s=]*(.+)$/i);
    if (match) {
        return match[1].trim();
    }
    return null;
}

/**
 * Parses raw text input into a list of questions (supports single & bulk paste)
 */
export function parseQuestionsFromText(rawText: string): ParsedQuestion[] {
    if (!rawText || !rawText.trim()) return [];

    // Split text into blocks separated by blank lines or "Question X" header
    const lines = rawText.split('\n');
    const questionBlocks: string[][] = [];
    let currentBlock: string[] = [];

    for (let line of lines) {
        const trimmed = line.trim();
        // Check if line marks start of new question, e.g., "Question 1", "السؤال 2", "1.", "Q1."
        const isNewQuestionHeader = /^(?:Question|Q|السؤال)\s*\d+[\.\:\-]?/i.test(trimmed) ||
            (/^\d+[\.\)]\s+/.test(trimmed) && currentBlock.some(l => parseAnswerLine(l) !== null));

        if (isNewQuestionHeader && currentBlock.length > 0) {
            questionBlocks.push(currentBlock);
            currentBlock = [line];
        } else if (trimmed === '' && currentBlock.some(l => parseAnswerLine(l) !== null)) {
            // Empty line after an answer line indicates block separator
            questionBlocks.push(currentBlock);
            currentBlock = [];
        } else {
            if (trimmed !== '' || currentBlock.length > 0) {
                currentBlock.push(line);
            }
        }
    }
    if (currentBlock.length > 0) {
        questionBlocks.push(currentBlock);
    }

    const results: ParsedQuestion[] = [];

    questionBlocks.forEach((blockLines, index) => {
        // Filter out completely empty lines
        const cleanLines = blockLines.map(l => l.trim()).filter(l => l.length > 0);
        if (cleanLines.length === 0) return;

        let textLines: string[] = [];
        let options: string[] = [];
        let correctAnswer = -1;
        let points = 1;
        let explanation = '';

        for (let line of cleanLines) {
            // Clean leading question header like "Question 1:" or "1."
            const cleanHeaderLine = line.replace(/^(?:Question|Q|السؤال)\s*\d+[\.\:\-]?\s*/i, '').replace(/^\d+[\.\)]\s*/, '');

            const option = normalizeOptionPrefix(line);
            const answer = parseAnswerLine(line);
            const pts = parsePointsLine(line);
            const exp = parseExplanationLine(line);

            if (answer) {
                correctAnswer = answer.answerIndex;
            } else if (pts !== null) {
                points = pts;
            } else if (exp !== null) {
                explanation = exp;
            } else if (option) {
                options.push(option.text);
            } else {
                // Line belongs to question text
                if (options.length === 0) {
                    textLines.push(cleanHeaderLine || line);
                }
            }
        }

        const questionText = textLines.join(' ').trim();
        const qNumber = index + 1;

        if (!questionText || options.length < 2 || correctAnswer === -1) {
            let errorMsg = `تعذر تحليل السؤال رقم ${qNumber}. `;
            if (!questionText) errorMsg += 'نص السؤال مفقود. ';
            if (options.length < 2) errorMsg += `عدد الاختيارات غير كافٍ (${options.length}). `;
            if (correctAnswer === -1) errorMsg += 'لم يتم التعرف على الإجابة الصحيحة. ';

            results.push({
                id: `parsed-${Date.now()}-${index}`,
                text: questionText || `سؤال رقم ${qNumber}`,
                options: options.length >= 2 ? options : ['اختيار 1', 'اختيار 2', 'اختيار 3', 'اختيار 4'],
                correctAnswer: correctAnswer >= 0 ? correctAnswer : 0,
                points: points || 1,
                explanation,
                isError: true,
                errorMessage: errorMsg,
                rawText: blockLines.join('\n')
            });
        } else {
            results.push({
                id: `parsed-${Date.now()}-${index}`,
                text: questionText,
                options,
                correctAnswer,
                points: points || 1,
                explanation,
                isError: false,
                rawText: blockLines.join('\n')
            });
        }
    });

    return results;
}
