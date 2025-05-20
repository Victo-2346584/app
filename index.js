const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connexion PostgreSQL
const pool = new Pool({
    user: 'f1_ojt2_user',
    host: 'dpg-d0ed1a15pdvs73b0iln0-a',
    database: 'f1_ojt2',
    password: 'yc5C0nACQ5719GPDbqRTyYBkEpaSzHVE',
    port: 5432
});

// GET tous les pilotes
app.get('/api/pilotes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pilotes');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST synchroniser : supprime tout et insère les pilotes envoyés
app.post('/api/pilotes/sync', async (req, res) => {
  const pilotes = req.body;

  if (!Array.isArray(pilotes)) {
    return res.status(400).json({ error: 'Le body doit être un tableau de pilotes.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Supprimer tous les pilotes existants
    await client.query('DELETE FROM pilotes');

    // Insérer tous les pilotes reçus
    for (const pilote of pilotes) {
      await client.query(
        'INSERT INTO pilotes (uuid, nom, no, points) VALUES ($1, $2, $3, $4)',
        [pilote.uuid, pilote.nom, pilote.no, pilote.points]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Base synchronisée avec succès.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});