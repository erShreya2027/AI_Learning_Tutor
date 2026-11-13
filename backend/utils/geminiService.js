import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
//import { explainConcept } from '../controllers/aiController';

dotenv.config();

const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});

if(!process.env.GEMINI_API_KEY){
    console.error('FATAL ERROR:GEMINI_API_KEY is not set in the env variables.');
    process.exit(1);
}

/**
 * generate flashcards from text
 * @param {string} text-Document text
 * @param {number} count-Number of flashcards to generate
 * @returns {Promise<Array<{question:string,answer:string,difficulty:string}>>}
 * 
 */

export const generateFlashcards=async (text,count=10)=>{
    if (!text) {
    throw new Error("No text available for flashcard generation");
}
    const prompt=`Generate exactly ${count} educational flashcards from the following text.
    Format each flashcard as:
    Q: [Clear, specific question]
    A: [Concise, accurate answer]
    D: [Difficulty level: easy, medium, or hard]
    
    Seperate each flashcard with "---
    
    Text:
    ${text.substring(0,15000)}`;

    try{

        const response=await ai.models.generateContent({
            model:"gemini-2.5-flash-lite",
            contents:prompt,
        });

        const generatedText=response.text;

        const flashcards=[];
        const cards=generatedText.split('---').filter(c=>c.trim());

        for(const card of cards){
            const lines=card.trim().split('\n');
            let question='',answer='',difficulty='medium';

            for(const line of lines){
                if(line.startsWith('Q:')){
                    question=line.substring(2).trim();
                }
                else if(line.startsWith('A:')){
                    answer=line.substring(2).trim();
                }
                else if(line.startsWith('D:')){
                    const diff=line.substring(2).trim().toLowerCase();
                    if(['easy','medium','hard'].includes(diff)){
                        difficulty=diff;
                    }
                }
            }

            if(question && answer){
                flashcards.push({question,answer,difficulty});
            }
        }

        return flashcards.slice(0,count);
    }catch(error){
        console.error('Gemini API error:',error);
        throw new Error('Failed to generate flashcards');
    }

};

export const generateQuiz = async (text, numQuestions = 5) => {
    const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
Format each question as:
Q: [Question]
01: [Option 1]
02: [Option 2]
03: [Option 3]
04: [Option 4]
C: [Correct option number]
E: [Brief explanation]
D: [Difficulty: easy, medium, or hard]

Separate questions with "---"

Text:
${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("RAW GEMINI RESPONSE:", rawText);

        if (!rawText) {
            throw new Error("No response from Gemini");
        }

        const questions = [];
        const questionBlocks = rawText.split('---').filter(q => q.trim());

        for (const block of questionBlocks) {
            const lines = block.trim().split('\n');

            let question = '';
            let options = [];
            let correctAnswer = '';
            let explanation = '';
            let difficulty = 'medium';

            for (const line of lines) {
                const trimmed = line.trim();

                if (trimmed.startsWith('Q:')) {
                    question = trimmed.substring(2).trim();
                }
                else if (/^\d{1,2}:/.test(trimmed)) {
    const optionText = trimmed.split(':')[1]?.trim();
    if (optionText) {
        options.push(optionText);

        //console.log("BLOCK:", block);
//console.log("OPTIONS FOUND:", options);
    }
}
                else if (trimmed.startsWith('C:')) {
                    const index = parseInt(trimmed.substring(2).trim()) - 1;
                    if (options[index]) {
                        correctAnswer = options[index];
                    }
                }
                else if (trimmed.startsWith('E:')) {
                    explanation = trimmed.substring(2).trim();
                }
                else if (trimmed.startsWith('D:')) {
                    const diff = trimmed.substring(2).trim().toLowerCase();
                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }

            if (question && options.length === 4 && correctAnswer) {
                questions.push({   // ✅ FIXED
                    question,
                    options,
                    correctAnswer,
                    explanation,
                    difficulty
                });
            }
        }

        const validQuestions = questions.filter(q => 
    q.question &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.correctAnswer
);

//console.log("Valid Questions:", validQuestions);

return validQuestions.slice(0, numQuestions);

    } catch (error) {
        console.error('Gemini API error', error);
        throw new Error('Failed to generate quiz');
    }
};
/**
 * Generate documnet summary
 * @param {string} text-documnet text
 * @returns {Promise<string>}
 */

export const generateSummary=async (text)=>{
    const prompt=`Provide a concise summary of the following text, highlighting the key concepts, main ideas, and important points.
    Keep the summary clear and structured.
    
    test:
    ${text.substring(0,20000)}`;

    try{
        const response=await ai.models.generateContent({
            model:"gemini-2.5-flash-lite",
            contents:prompt,
        });
                //console.log("FULL GEMINI RESPONSE:", response);

        const generatedText=response.text;
        return generatedText
    }
    catch(error){
        console.error('Gemini API error : ',error);
        throw new Error('Failed to generate summary');
    }
};

/**
 * chat with doc context
 * @param {string} question-user question
 * @param {Array<Object>}chunks-relevant documnet chunks
 * @returns {Promise<string>}
 */

export const chatWithContext=async (question,chunks)=>{
    const context=chunks.map((c,i)=>`[Chunk ${i+1}]\n${c.content}`).join('\n\n');

    const prompt =`Based on the following context from a documnet, Analyse the context and answer the users questions.
    If the answer is not in the context say so.
    
    Conext:
    ${context}
    
    Question: ${question}
    
    Answer:`;

    try{
        const response=await ai.models.generateContent({
            model:"gemini-2.5-flash-lite",
            contents:prompt,
        });

        const generatedText=response.text;
        return generatedText
    }
    catch(error){
        console.error('Gemini API error : ',error);
        throw new Error('Failed to process chat request');
    }
};

/**
 * explain a specific concept
 * @param {string} concept -concept to explain
 * @param {string} context-relevant context
 * @returns {Promise<string>}
 */

export const explainConcept=async (concept,context)=>{
    const prompt =`Explain the concept of "${concept}" based on the following context.
    Provide clear, educational explanation thats easy to understand.
    Include exaples if relevant.
    
    Context:
    ${context.substring(0,10000)}`;

    try{
        const response=await ai.models.generateContent({
            model:"gemini-2.5-flash-lite",
            contents:prompt,
        });

        const generatedText=response.text;
        return generatedText;
    }
    catch(error){
        console.error('Gemini API error : ',error);
        throw new Error('Failed to exaplin concept');
    }
};