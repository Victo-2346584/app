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

// 🔸 Récupérer toutes les équipes (pour vérif/synchronisation)
app.get('/equipes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM equipes');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 🔸 Synchroniser les équipes (ajouts, modifs, suppressions)
app.post('/synchroniser', async (req, res) => {
    const { equipes } = req.body;

    try {
        // On récupère les UUID existants pour comparer
        const dbEquipesResult = await pool.query('SELECT uuid FROM equipes');
        const dbUuids = dbEquipesResult.rows.map(row => row.uuid);

        // On met à jour et insère les nouvelles équipes
        for (let equipe of equipes) {
            if (dbUuids.includes(equipe.uuid)) {
                // Mise à jour
                await pool.query(
                    `UPDATE equipes
                     SET nom = $1, image = $2, points = $3, favorite = $4
                     WHERE uuid = $5`,
                    [equipe.nom, equipe.image, equipe.points, equipe.favorite, equipe.uuid]
                );
            } else {
                // Insertion
                await pool.query(
                    `INSERT INTO equipes (uuid, nom, image, points, favorite)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [equipe.uuid, equipe.nom, equipe.image, equipe.points, equipe.favorite]
                );
            }
        }

        // Suppression des équipes absentes dans la synchro reçue
        const syncUuids = equipes.map(e => e.uuid);
        const uuidsToDelete = dbUuids.filter(uuid => !syncUuids.includes(uuid));

        for (let uuid of uuidsToDelete) {
            await pool.query('DELETE FROM equipes WHERE uuid = $1', [uuid]);
        }

        res.json({ status: 'Synchronisation terminée' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 🔸 Lancer le serveur
app.listen(3000, () => {
    console.log('Service API en ligne sur http://localhost:3000');
});
