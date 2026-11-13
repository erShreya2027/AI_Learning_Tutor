import express from 'express';
import{
    getFlashCards,
    getAllFlashcardSets,
    reviewFlashcard,
    toggleStartFlashcard,
    deleteFlashcardSet,
} from '../controllers/flashcardController.js';
import protect from '../middleware/auth.js';

const router=express.Router();

router.use(protect);

router.get('/',getAllFlashcardSets);
router.get('/:docId',getFlashCards);
router.post('/:cardId/review',reviewFlashcard);
router.put('/:cardId/star',toggleStartFlashcard);
router.delete('/:id',deleteFlashcardSet);

export default router;