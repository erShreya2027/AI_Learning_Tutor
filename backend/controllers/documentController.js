import Document from '../models/Document.js';
import flashcard from '../models/Flashcard.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import {extractTextFromPDF} from '../utils/pdfParser.js';
import {chunkText} from '../utils/textChunker.js';
import fs from 'fs/promises';
import mongoose from 'mongoose';

//@desc upload pdf
//@route post/apidocuments/upload
//@access private

export const uploadDocument=async(req,res,next)=>{
    try{
        if(!req.file){
            return res.status(400).json({
                success:false,
                error:'Please upload a PDF file',
                statusCode:400
            });
        }

        const {title}=req.body;

        if(!title){
            //del uploaded file if no title provided
            await fs.unlink(req.file.path);
            return res.staus(400).json({
                success:false,
                error:'Please provide a document title',
                statusCode:400
            });
        }

        //construct the url for the uploaded file
        const baseUrl=`http://localhost:${process.env.PORT || 8000}`;
        const fileUrl=`${baseUrl}/uploads/documents/${req.file.filename}`;

        //create document record
        const document=await Document.create({
            userId:req.user._id,
            title,
            fileName:req.file.originalname,
            filePath:fileUrl,
            fileSize:req.file.size,
            status:'processing'
        });

        //process pdf in background(in production use a queue like bull)
        processPDF(document._id,req.file.path).catch(err=>{
            console.error('PDF processing error:',err);
        });

        res.status(201).json({
            success:true,
            data:document,
            message:'Document uploaded successfully.Processing in progrss...'
        });
    }catch(error){
        if(req.file){
            await fs.unlink(req.file.path).catch(()=>{});
        }
        next(error);
    }
};

//helper function to process df
const processPDF=async(documentId,filePath)=>{
    try{
        const result = await extractTextFromPDF(filePath);

const text = result.text;   

        //create chunks
        const chunks=chunkText(text,500,50);

        //update doc
        await Document.findByIdAndUpdate(documentId,{
            extractText:text,
            chunks:chunks,
            status:'ready'
        });
        console.log(`Document ${documentId} processed successfully`);
console.log("TEXT TYPE:", typeof text);
console.log("TEXT LENGTH:", text.length);    }catch(error){
        console.error(`Error processing documnet ${documentId}`,error);

        await Document.findByIdAndUpdate(documentId,{
            status:'failed'
        });
    }
};

//@desc get all user docs
//@route get/api/documents
//@access private

export const getDocuments=async(req,res,next)=>{
    try{
        const documnets=await Document.aggregate([
            {
                $match: {userId:new mongoose.Types.ObjectId(req.user._id)}
            },
            {
                $lookup:{
                    from:'flashcards',
                    localField:'_id',
                    foreignField:'documentId',
                    as:'flashcardSets'
                }
            },
            {
                $lookup:{
                    from:'quizzes',
                    localField:'_id',
                    foreignField:'documentId',
                    as:'quizzes'
                }
            },
            {
                $addFields:{
                    flashcardCount:{$size:'$flashcardSets'},
                    quizCount:{$size:'$quizzes'}
                }
            },
            {
                $project:{
                    extractedText:0,
                    chunks:0,
                    flashcardSets:0,
                    quizzes:0
                }
            },
            {
                $sort:{uploadDate:-1}
            }
        ]);

        res.status(200).json({
            success:true,
            count:documnets.length,
            data:documnets
        });
    }catch(error){
        if(req.file){
            await fs.unlink(req.file.path).catch(()=>{});
        }
        next(error);
    }
}

//@desc get single doc with chunks
//@route get/api/documents/:id
//@access private

export const getDocument=async(req,res,next)=>{
    try{
        const document=await Document.findOne({
            _id:req.params.id,
            userId:req.user._id
        });

        if(!document){
            return res.status(404).json({
                success:false,
                error:'Documnet not foound',
                statusCode:404
            });
        }

        const flashcardCount=await Flashcard.countDocuments({documentId:document._id, userId:req.user._id});
        const quizCount=await Quiz.countDocuments({documentId:document._id,userId:req.user._id});
         
        document.lastAccessed=Date.now();
        await document.save();

        const documentData=document.toObject();
        documentData.flashcardCount=flashcardCount;
        documentData.quizCount=quizCount;

        res.status(200).json({
            success:true,
            data:documentData
        });

    }catch(error){
        if(req.file){
            await fs.unlink(req.fil.path).catch(()=>{});
        }
        next(error);
    }
}

//@desc delete doc
//@route delete/api/documents/:id
//@access private

export const deleteDocument=async(req,res,next)=>{
    try{
        const document=await Document.findOne({
            _id:req.params.id,
            userId:req.user._id
        });

        if(!document){
            return res.status(404).json({
                success:false,
                error:'Document not found',
                statusCode:404
            });


        }
        await fs.unlink(document.filePath).catch(()=>{});

        await document.deleteOne();

        res.status(200).json({
            success:true,
            message:"Documnet deleted successfully"
        });

    }catch(error){
        if(req.file){
            await fs.unlink(req.file.path).catch(()=>{});
        }
        next(error);
    }
}
