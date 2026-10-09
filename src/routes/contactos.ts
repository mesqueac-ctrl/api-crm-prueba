import { Router } from 'express';
import * as controlador from '../controllers/contactos';

// Rutas: solo dicen qué URL y método ejecutan qué controlador.
const router = Router();

router.post('/', controlador.crear);
router.get('/', controlador.listar);
router.get('/:id', controlador.obtener);
router.patch('/:id/notas', controlador.agregarNota);
router.delete('/:id', controlador.eliminar);

export default router;
