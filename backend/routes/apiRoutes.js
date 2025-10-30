const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');
const SearchHistory = require('../models/SearchHistory');

// Todas las rutas están protegidas
const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

// GET /api/pokemon - Obtener lista de Pokémon
router.get('/pokemon', protect, async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    const response = await axios.get(
      `${POKEAPI_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener lista de Pokémon:', error);
    res.status(500).json({ message: 'Error al obtener Pokémon', error: error.message });
  }
});

// GET /api/pokemon/:nameOrId - Obtener detalles de un Pokémon específico
router.get('/pokemon/:nameOrId', protect, async (req, res) => {
  try {
    const { nameOrId } = req.params;

    const response = await axios.get(
      `${POKEAPI_BASE_URL}/pokemon/${nameOrId.toLowerCase()}`
    );

    res.json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'Pokémon no encontrado' });
    }
    console.error('Error al obtener detalles del Pokémon:', error);
    res.status(500).json({ message: 'Error al obtener detalles', error: error.message });
  }
});

// POST /api/search - Buscar Pokémon y guardar historial
router.post('/search', protect, async (req, res) => {
  try {
    const { term } = req.body;

    if (!term) {
      return res.status(400).json({ message: 'El término de búsqueda es obligatorio' });
    }

    // Guardar en historial de búsqueda
    await SearchHistory.create({
      term: term.toLowerCase(),
      user: req.user._id
    });

    // Buscar en PokéAPI
    const response = await axios.get(
      `${POKEAPI_BASE_URL}/pokemon/${term.toLowerCase()}`
    );

    res.json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'Pokémon no encontrado' });
    }
    console.error('Error en búsqueda:', error);
    res.status(500).json({ message: 'Error en la búsqueda', error: error.message });
  }
});

// GET /api/search/history - Obtener historial de búsquedas del usuario
router.get('/search/history', protect, async (req, res) => {
  try {
    const history = await SearchHistory.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json(history);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error al obtener historial', error: error.message });
  }
});

module.exports = router;