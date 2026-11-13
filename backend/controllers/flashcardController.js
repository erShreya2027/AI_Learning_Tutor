import Flashcard from '../models/Flashcard.js';

//@desc get all flashcards for a doc
//@route get/api/flashacrds/:docId
//@access private
export const getFlashCards=async(req,res,next)=>{
    try{
        const flashacrds=await Flashcard.find({
            userId:req.user._id,
            documentId:req.params.docId
        })
        .populate('documentId','title fileName')
        .sort({createdAt:-1});
console.log("PARAM DOC ID:", req.params.docId);
console.log("USER ID:", req.user._id);
console.log("FETCHING DOCUMENT ID:", req.params.docId);

        res.status(200).json({
            success:true,
            count:flashacrds.length,
            data:flashacrds
        });
    }catch(error){
        next(error);
    }
};

//@desc get all flashcards sets for a user
//roue get/api/flashcards
//@access private

export const getAllFlashcardSets=async(req,res,next)=>{
    try{
        const flashcardSets=await Flashcard.find({userId:req.user._id})
        .populate('documentId','title')
        .sort({createdAt:-1});
        res.status(200).json({
            success:true,
            count:flashcardSets.length,
            data:flashcardSets,
        });
    }catch(error){
        next(error);
    }
};

//@desc mark flashcard as reviewed
//roue get/api/flashcards/:cardId/review
//@access private

export const reviewFlashcard=async(req,res,next)=>{
    try{
        const flashcardSet=await Flashcard.findOne({
            'cards._id':req.params.cardId,
            userId:req.user._id
        });

        if(!flashcardSet){
            return res.status(404).json({
                success:false,
                error:'Flashcard set or card not found',
                statusCode:404
            });
        }

        const cardIndex=flashcardSet.cards.findIndex(card=>card._id.toString()===req.params.cardId);

        if(cardIndex===-1){
            return res.status(400).json({
                success:false,
                error:'card not found in set',
                statusCode:400
            });
        }

        flashcardSet.cards[cardIndex].lastReviewed=new Date();
        flashcardSet.cards[cardIndex].reviewCount+=1;

        await flashcardSet.save();
        
        res.status(200).json({
            success:true,
            data:flashcardSet,
            message:'Flashcard reviewed successfully'
        });
    }catch(error){
        next(error);
    }
};

//@desc toggle star/fav on flashcard
//roue post/api/flashcards:/cardId/star
//@access private

export const toggleStartFlashcard=async(req,res,next)=>{
    try{
        const flashcardSet=await Flashcard.findOne({
            'cards._id':req.params.cardId,
            userId:req.user._id
        });

        if(!flashcardSet){
            return res.status(400).json({
                success:false,
                error:'Flashcard set or card not found',
                statusCode:404
            });
        }

        const cardIndex=flashcardSet.cards.findIndex(card=>card._id.toString()===req.params.cardId);

        if(cardIndex===-1){
            return res.status(404).json({
                success:false,
                error:'card not found in set',
                statusCode:404
            });
        }

        flashcardSet.cards[cardIndex].isStarred=!flashcardSet.cards[cardIndex].isStarred;

        await flashcardSet.save();

        res.status(200).json({
            success:true,
            data:flashcardSet,
            message:`Flashcard ${flashcardSet.cards[cardIndex].isStarred ? 'starred' : 'unstarred'}`
        });
    }catch(error){
        next(error);
    }
};

//@desc del flashcard set
//roue delete/api/flashcards/:id
//@access private

export const deleteFlashcardSet = async (req, res, next) => {
    try {
        const flashcardSet = await Flashcard.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'flashcard set not found',
                statusCode: 404
            });
        }

        await flashcardSet.deleteOne();

        res.status(200).json({
            success: true,
            message: 'flashcard set deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};