import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js";
import * as geminiService from '../utils/geminiService.js';
import { findRelevantChunks } from "../utils/textChunker.js";

//@desc generate flashcard from doc
//@route post/api/ai/generate-flashcard
//@access private
export const generateFlashcards=async (req,res,next)=>{
    try{
        const {documentId, count=10}=req.body;

        if(!documentId){
            return res.status(400).json({
                success:false,
                error:'Please provide documnetId',
                statusCode:400
            });
        }

        const document = await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:'ready'
        });

        if(!document){
            return res.status(404).json({
                success:false,
                error:'Documet not found or not ready',
                statusCode:404
            });
        }

        //generate flashcards using gemini
        const fullText = document.chunks.map(c => c.content).join(" ");

//console.log("FULL TEXT LENGTH:", fullText.length); // debug

const cards = await geminiService.generateFlashcards(
    fullText,
    parseInt(count)
);

        //save to db
        const flashcardSet=await Flashcard.create({
            userId:req.user._id,
            documentId:document._id,
            
            cards:cards.map(card=>({
                question:card.question,
                answer:card.answer,
                difficulty:card.difficulty,
                reviewCount:0,
                isStarted:false
            }))
        });
//console.log("SAVING DOCUMENT ID:", document._id);
        res.status(201).json({
            success:true,
            data:flashcardSet,
            message:'Flashcards generated successfully'
        });
    }catch(error){
        next(error);
    }
};

//@desc generate quiz from doc
//@route post/api/ai/generate-quiz
//@access private
export const generateQuiz=async (req,res,next)=>{
    try{
        const {documentId,numQuestions=5,title}=req.body;

        if(!documentId){
            return res.status(400).json({
                success:false,
                error:'Please provide DocumnetId',
                statusCode:400
            });
        }

        const document=await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:'ready'
        });

        if(!document){
            return res.status(404).json({
                success:false,
                error:'Document not found or not ready',
                statusCode:404
            });
        }

        const text = document.chunks.map(chunk => chunk.content).join(" ");
        //gen quiz
        const questions = await geminiService.generateQuiz(
            text,
            parseInt(numQuestions)
        )

        //save to db
        const quiz=await Quiz.create({
            userId:req.user._id,
            documentId:document._id,
            title:title || `${document.title} - Quiz`,
            questions:questions,
            totalQuestions:questions.length,
            userAnswers: [],
            score:0
        });

        res.status(201).json({
            success:true,
            data:quiz,
            message:'Quiz generated successfully'
        });

    }catch(error){
        next(error);
    }
};

//@desc generate doc summary
//@route post/api/ai/generate-summary
//@access private
export const generateSummary=async (req,res,next)=>{
    try{
        console.log("REQ BODY:", req.body);

        if (!req.body) {
            return res.status(400).json({
                success: false,
                error: "Request body is missing",
                statusCode: 400
            });
        }

        const {documentId}=req.body;
        if(!documentId){
            return res.status(400).json({
                success:false,
                error:'Please provide documentId',
                statusCode:400
            });
        }

        const document= await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:'ready'
        });

        if(!document){
            return res.status(404).json({
                success:false,
                error:'Documnet not found or not ready',
                statusCode:404
            });
        }

        //gen summary

const text = document.chunks.map(chunk => chunk.content).join(" ");

const summary = await geminiService.generateSummary(text);
        res.status(200).json({
            success:true,
            data:{
                documentId:document._id,
                title:document.title,
                summary
            },
            message:'Summary generated successfully'
        });
    }catch(error){
        next(error);
    }
};

//@desc generate quiz from doc
//@route post/api/ai/generate-quiz
//@access private
export const chat=async (req,res,next)=>{
    try{
        const {documentId,question}=req.body;

        if(!documentId || !question){
            return res.status(400).json({
                success:false,
                error:'Please provide documentId and question',
                statusCode:400
            });
        }

        const document=await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:'ready'
        });

        if(!document){
            return res.status(404).json({
                success:false,
                error:'Document not found or not ready',
                statusCode:404
            });
        }

        //find relevant chunks
        const relevantChunks=findRelevantChunks(document.chunks,question,3);
        const chunkIndices=relevantChunks.map(c=>c.chunkIndex);

        //get or create chat history

        let chatHistory= await ChatHistory.findOne({
            userId:req.user._id,
            documentId:document._id
        });

        if(!chatHistory){
            chatHistory=await ChatHistory.create({
                userId:req.user._id,
                documentId:document._id,
                messages:[]
            });
        }

        //gen response

        const answer=await geminiService.chatWithContext(question,relevantChunks);

        //save convo
        chatHistory.messages.push(
            {
                role:'user',
                content:question,
                timestamp:new Date(),
                relevantChunks:[]
            },
            {
                role:'assistant',
                content:answer,
                timestamp:new Date(),
                relevantChunks:chunkIndices
            }
        );

        await chatHistory.save();

        res.status(200).json({
            success:true,
            data:{
                question,
                answer,
                relevantChunks:chunkIndices,
                chatHistoryId:chatHistory._id
            },
            message:'Response generated successfully'
        })

    }catch(error){
        next(error);
    }
};

//@desc explain concept from doc
//@route post/api/ai/explain-concept
//@access private
export const explainConcept=async (req,res,next)=>{
    try{
        const {documentId,concept}=req.body;

        if(!documentId || !concept){
            return res.status(400).json({
                success:false,
                error:'Please provide documentId and concept',
                statusCode:400
            });
        }

        const document=await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:'ready'
        });

        if(!document){
            return res.status(404).json({
                success:false,
                error:'Documnet not found or not ready',
                statusCode:404
            });
        }

        //find relevant chunks
        const relevantChunks=findRelevantChunks(document.chunks,concept,3);
        const context=relevantChunks.map(c=>c.content).join('\n\n');

        //gen explanation 
        const explanation=await geminiService.explainConcept(concept,context);

        res.status(200).json({
            success:true,
            data:{
                concept,
                explanation,
                relevantChunks:relevantChunks.map(c=>c.chunkIndex)
            },
            message:'Explanation generated successfully'
        });
    }catch(error){
        next(error);
    }
};

//@desc get chat history for a do
//@route post/api/ai/chat-history/:documnetId
//@access private
export const getChatHistory=async (req,res,next)=>{
    try{
        const{documentId}=req.params;

        if(!documentId){
            return res.status(400).json({
                success:false,
                error:'Please provide documnetId',
                statusCode:400
            });
        }

        const chatHistory=await ChatHistory.findOne({
            userId:req.user._id,
            documentId:documentId
        }).select('messages');

        if(!chatHistory){
            return res.status(200).json({
                success:true,
                data:[],
                message:'No chat history found for this document'
            });
        }

        res.status(200).json({
            success:true,
            data:chatHistory.messages,
            message:'Chat history retrieved successfully'
        })
    }catch(error){
        next(error);
    }
};