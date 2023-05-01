import { Router } from 'express';

const router = Router();

// router.get('/metadata/:id');

router.route('/').get().post();
router.route('/:id').get().patch().delete();

export default router;
