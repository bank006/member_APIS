const express = require('express')
const { Pool } = require('pg')
require('dotenv').config();
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const app = express()
app.use(express.static('public'));
app.use(cors());
app.use(express.json());
const bcrypt = require('bcrypt');

const connectionString = process.env.DATABASE_URL;

const conn = new Pool({
    connectionString: connectionString,
    connectionTimeoutMillis: 10000  // เพิ่มค่า timeout ให้มากขึ้น (เช่น 10 วินาที)
});

conn.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});


//admin
app.get('/get_admin', async (req, res) => {
    try {
        const result = await conn.query('SELECT * FROM admin')
        res.json(
            result
        )
    } catch (error) {
        console.error('find admin error:', error.message);
        res.status(400).json({ error: 'Error find admin' });
    }
})

app.post('/post_admin', async (req, res) => {
    const { data } = req.body
    try {
        const uuid_admin = uuidv4()
        const saltRounds = 10;
        const username = data.username
        const hashedPassword = await bcrypt.hash(String(data.password), saltRounds)
        const query = await conn.query('INSERT INTO admin (uuid, username, password) VALUES ($1 , $2 , $3 )', [uuid_admin, username, hashedPassword])
        res.json(query)

    } catch (error) {
        console.error('Create admin faild', error)
        res.status(400).json({ error: 'Create admin faild' })
    }
})
//endadmin

//users
app.get('/users/api/v1/get_users', async (req, res) => {
    try {
        const result = await conn.query('SELECT * FROM users')
        res.json(
            result
        )
    } catch (error) {
        console.error('find users error:', error.message);
        res.status(400).json({ error: 'Error find users' });
    }
})
//endusers

const port = process.env.PORT || 3003;
const server = app.listen(port, () => {
    console.log('connecting port ' + port);
});