import { read } from 'fs';
import Quiz from '../models/Quiz.js';
import { totalmem } from 'os';

//@desc get all quizzes fro a doc
//@route get/api/quizzes/:docid
//@access private

export const getQuizzes=async(req,res,next)=>{
    try{
        const quizzes=await Quiz.find({
            userId:req.user._id,
            documentId:req.params.documentId
        })
        .populate('documentId','title fileName')
        .sort({createdAt:-1});

        res.status(200).json({
            success:true,
            count:quizzes.length,
            data:quizzes
        });
    }catch(error){
        next(error);
    }
};

//@desc get a single quiz from id
//@route get/api/quizzes/quiz/:id
//@access private

export const getQuizById=async(req,res,next)=>{
    try{
        const quiz=await Quiz.findOne({
            _id:req.params.id,
            userId:req.user._id
        });

        if(!quiz){
            return res.status(404).json({
                success:false,
                error:'Quiz not found',
                statusCode:404
            });
        }

        res.status(200).json({
            success:true,
            data:quiz
        });
    }catch(error){
        next(error);
    }
};


//@desc submit quiz answer
//@route post/api/quizzes/:id/submit
//@access private

export const submitQuiz=async(req,res,next)=>{
    try{
        const{answers}=req.body;

        if(!Array.isArray(answers)){
            return res.status(400).json({
                success:false,
                error:'Please provide answers array',
                statusCode:400
            });
        }

        const quiz=await Quiz.findOne({
            _id:req.params.id,
            userId:req.user._id
        });

        if(!quiz){
            return res.status(404).json({
                success:false,
                error:'Quiz not found',
                statusCode:404
            });
        }

        // allow re-submission by recalculating the latest score and overwriting the previous attempt
        let correctCount=0;
        const userAnswers=[];

        answers.forEach(answer=>{
            const{questionIndex,selectedAnswer}=answer;

            if(questionIndex<quiz.questions.length){
                const question=quiz.questions[questionIndex];
                const isCorrect=selectedAnswer===question.correctAnswers;

                if(isCorrect) correctCount++;

                userAnswers.push({
                    questionIndex,
                    selectedAnswer,
                    isCorrect,
                    answeredAt:new Date()
                });
            }
        });

        //calc score
        const score=Math.round((correctCount/quiz.totalQuestions)*100);

        // overwrite previous attempt data so the same quiz can be submitted again
        quiz.userAnswers=userAnswers;
        quiz.score=score;
        quiz.completedAt=new Date();

        await quiz.save();

        res.status(200).json({
            success:true,
            data:{
                quizId:quiz._id,
                score,
                correctCount,
                totalQuestions:quiz.totalQuestions,
                percentage:score,
                userAnswers
            },
            message:'Quiz submitted successfully'
        });
    }catch(error){
        next(error);
    }
};
//@desc get quiz results
//@route get/api/quizzes/:id/results
//@access private
export const getQuizResults=async(req,res,next)=>{
    console.log("➡️ getQuizResults HIT");
console.log("PARAM ID:", req.params.id);
console.log("USER:", req.user?._id);
    try{
        const quiz=await Quiz.findOne({
            
            _id:req.params.id,
            userId:req.user._id
        }).populate('documentId','title');
        console.log("QUIZ FETCHED:", quiz);

        if(!quiz){
            return res.status(404).json({
                success:false,
                error:'Quiz not found',
                statusCode:404
            });
        }

        if(!quiz.completedAt){
            return res.status(400).json({
                success:false,
                error:'Quiz not compltede yet',
                statusCode:400
            });
        }

        //bild detailed results
        const detailedResults=quiz.questions.map((question,index)=>{
            const userAnswer=quiz.userAnswers.find(a=>a.questionIndex===index);

            return{
                questionIndex:index,
                question:question.question,
                options:question.options,
                correctAnswer:question.correctAnswers,
                selectedAnswer:userAnswer?.selectedAnswer||null,
                isCorrect:userAnswer?.isCorrect||false,
                explanation:question.explanation || ""
            };
        });

        res.status(200).json({
            success:true,
            data:{
                quiz:{
                    id:quiz._id,
                    title:quiz.title,
                    document:quiz.documentId,
                    score:quiz.score,
                    totalQuestions:quiz.totalQuestions,
                    completedAt:quiz.completedAt
                },
                results:detailedResults
            }
        });
    }catch(error){
        next(error);
    }
};

//@desc delet quiz
//@route delete/api/quizzes/:id
//@access private

export const deleteQuiz=async(req,res,next)=>{
    try{
        const quiz=await Quiz.findOne({
            id:req.params.id,
            userId:req.user._id
        });

        if(!quiz){
            return res.status(404).json({
                success:false,
                error:'Quiz not found',
                statusCode:404
            });
        }
        await quiz.deleteOne();

        res.status(200).json({
            success:true,
            message:'Quiz deleted successfully'
        });
    }catch(error){
        next(error);
    }
};



