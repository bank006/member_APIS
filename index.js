const express = require('express')
const { Pool } = require('pg')
require('dotenv').config();
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const app = express()
app.use(express.static('public'));
app.use(cors());
app.use(express.json());
const bcrypt = require('bcryptjs');
app.use(express.urlencoded({ extended: true }));

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

app.post('/users/api/v1/create_user', async (req, res) => {
    try {
        const uuid_user = uuidv4()
        const { data } = req.body
        const username = data.username
        const phonenum = data.phonenum
        const checkphone = await conn.query('SELECT * FROM users WHERE phonenum = $1', [phonenum])
        if (checkphone.rows.length > 0) {
            res.json(checkphone)
        } else {
            const result = await conn.query('INSERT INTO users (fullname , phonenum , uuid) VALUES($1 , $2 , $3)', [username, phonenum, uuid_user])
            res.json(
                result
            )
        }

    } catch (error) {
        console.error('create user feild:', error.message);
        res.status(400).json({ error: 'create user feild:' });
    }
})

app.post('/v1/check_user', async (req, res) => {
    try {
        const { phonenum } = req.body
        const result = await conn.query('SELECT * FROM users WHERE phonenum = $1 ', [phonenum])
        if (result.rows[0]) {
            res.json(result.rows)
        } else {
            res.status(400).json({ error: 'User not found' })
        }

    } catch (error) {
        console.error('find user feild:', error.message);
        res.status(400).json({ error: 'find user feild:' });
    }
})

app.post('/v1/get_userpoint' ,async(req ,res)=>{
    try{
        const {uuid }= req.body
        const result = await conn.query('SELECT * FROM users INNER JOIN point ON users.uuid = point.uuid_user WHERE point.uuid_user = $1',[uuid])
        res.json(result.rows)
    }catch(error){
        console.error('find userpoint feild:', error.message);
        res.status(400).json({ error: 'find userpoint feild:' });
    }
})
//endusers

const port = process.env.PORT || 3003;
const server = app.listen(port, () => {
    console.log('connecting port ' + port);
});