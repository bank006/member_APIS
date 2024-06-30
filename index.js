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

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await conn.query('SELECT * FROM admin WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({status:'success',  message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

app.post('/users/api/v1/check_user', async (req, res) => {
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

app.post('/users/api/v1/get_userpoint', async (req, res) => {
    try {
        const { uuid } = req.body
        const result = await conn.query('SELECT * FROM users INNER JOIN point ON users.uuid = point.uuid_user WHERE point.uuid_user = $1', [uuid])
        res.json(result.rows)
    } catch (error) {
        console.error('find userpoint feild:', error.message);
        res.status(400).json({ error: 'find userpoint feild:' });
    }
})
//endusers

//exchange
app.get('/exchange/api/v1/get_exchange', async (req, res) => {
    try {
        const result = await conn.query('SELECT * FROM exchangerate')
        res.json(
            result.rows
        )
    } catch (error) {
        console.error('find exchage error:', error.message);
        res.status(400).json({ error: 'Error find exchange' });
    }
})

app.post('/exchange/api/v1/create_exchange', async (req, res) => {
    try {
        const { exchange_rate } = req.body
        const uuid_exchange = uuidv4()
        const checklist = await conn.query("SELECT * FROM exchangerate")
        if (checklist.rows.length > 0) {
            const updateQuery = 'UPDATE exchangerate SET price = $1, rate = $2 ';
            const values = [exchange_rate.price, exchange_rate.rate];
            const updateExchange = await conn.query(updateQuery, values);
            res.json(updateExchange)
        } else {
            const result = await conn.query('INSERT INTO exchangerate (uuid , price , rate) VALUES ($1 , $2 , $3)', [uuid_exchange, exchange_rate.price, exchange_rate.rate])
            res.json(
                result
            )
        }


    } catch (error) {
        console.error('create exchange feild:', error.message);
        res.status(400).json({ error: 'create exchange feild' });
    }
})
//end exchanhe

//point
app.get('/point/api/v1/get_point', async (req, res) => {
    try {
        const result = await conn.query('SELECT * FROM point')
        res.json(
            result
        )
    } catch (error) {
        console.error('find exchage error:', error.message);
        res.status(400).json({ error: 'Error find exchange' });
    }
})

app.post('/point/api/v1/create_point', async (req, res) => {

    try {
        const { data } = req.body
        const point = data.point
        const uuid_user = data.uuid_user
        const uuid_point = uuidv4()

        const checklist = await conn.query('SELECT * FROM point WHERE uuid_user = $1', [uuid_user])
        if (checklist.rows.length > 0) {
            const result = await conn.query('SELECT point FROM point WHERE uuid_user = $1', [uuid_user]);
            const currentPoint = result.rows[0].point;
            const updatedPoint = parseInt(currentPoint) + parseInt(point)
            const updatepoint = await conn.query('UPDATE point SET point = $1 WHERE uuid_user = $2', [updatedPoint, uuid_user]);
            res.json(updatepoint)
        } else {
            const result = await conn.query('INSERT INTO point (uuid , uuid_user , point) VALUES ($1, $2 , $3)', [uuid_point, uuid_user, point])
            res.json(
                result
            )
        }
    } catch (error) {
        console.error('create point feild:', error.message);
        res.status(400).json({ error: 'create point feild' });
    }
})

//use point
app.post('/point/api/v1/use_point', async (req, res) => {

    try {
        const { data } = req.body
        const uuid_user = data.uuid_user
        const point = data.point
        const getpoint = await conn.query('SELECT point FROM point WHERE uuid_user = $1', [uuid_user]);
        const currentPoint = getpoint.rows[0].point;
        const updatedPoint = parseInt(currentPoint) - parseInt(point)
        const result = await conn.query('UPDATE point SET point = $1 WHERE uuid_user = $2', [updatedPoint, uuid_user])
        res.json(result)
    } catch (error) {
        console.error('use point feild:', error.message);
        res.status(400).json({ error: 'use point feild' });
    }
})

app.post('/point/api/v1/update_point', async (req, res) => {

    try {
        const { data } = req.body
        const uuid_user = data.uuid_user
        const point = data.point
        const getpoint = await conn.query('SELECT point FROM point WHERE uuid_user = $1', [uuid_user]);
        const currentPoint = getpoint.rows[0].point;
        const updatedPoint = parseInt(currentPoint) - parseInt(point)
        const result = await conn.query('UPDATE point SET point = $1 WHERE uuid_user = $2', [point, uuid_user])
        res.json(result)
    } catch (error) {
        console.error('use point feild:', error.message);
        res.status(400).json({ error: 'use point feild' });
    }
})


//end point

//promotion
app.get('/promotion/api/v1/get_promotions', async (req, res) => {
    try {
        const result = await conn.query('SELECT * FROM promotions')
        res.json(
            result.rows
        )
    } catch (error) {
        console.error('find promotions error:', error.message);
        res.status(400).json({ error: 'Error find promotions' });
    }
})

// create promotions

app.post('/promotion/api/v1/create_promotion', async (req, res) => {
    try {
        const { data } = req.body
        const uuid_promotion = uuidv4()
        const result = await conn.query('INSERT INTO promotions (uuid , uuid_admin , title , point) VALUES ($1 , $2 , $3 ,$4)', [uuid_promotion, data.uuid_admin, data.title, data.point])
        res.json("create success")
    } catch (error) {
        console.error('create promotion feild', error.message);
        res.status(400).json({ error: 'create promotion feild' });
    }
})


//edit

app.post('/promotion/api/v1/edite_promotion', async (req, res) => {
    try {
        const { data } = req.body
        const checklist = 'UPDATE promotions SET title = $1 , point = $2 WHERE uuid = $3'
        const values = [data.title, data.point, data.uuid]
        const result = await conn.query(checklist, values)
        res.json(result)
    } catch (error) {
        console.error('update promotion feild', error.message);
        res.status(400).json({ error: 'update promotion feild' });
    }
})

//delete
app.delete('/promotion/api/v1/delete_promotions', async (req, res) => {
    try {
        const { uuid_promotion } = req.body
        const result = await conn.query('DELETE FROM promotions WHERE uuid = $1', [uuid_promotion])
        res.json(result)
    } catch (error) {
        console.error('delete promotion feild', error.message);
        res.status(400).json({ error: 'delete promotion feild' });
    }
})
//end promotion

const port = process.env.PORT || 3003;
const server = app.listen(port, () => {
    console.log('connecting port ' + port);
});