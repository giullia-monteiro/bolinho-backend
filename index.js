const express = require('express')
const { json, urlencoded } = require('body-parser')
const config = require('config')
const pg = require('pg')

const PORT = process.env.PORT || config.get('server.port')

const pool = new pg.Pool({
    connectionString: 'postgres://uygxkwhb:WuAXbJtfjK7RvukuHSKuAD1CivWdr6kX@tuffi.db.elephantsql.com:5432/uygxkwhb',
    ssl: {
        rejectUnauthorized: false
    }
})

const app = express()

app.use(json())
app.use(urlencoded({ extended: true }))

app.route('/pedidos')
.get((_, res) => {

    const query = 'SELECT * FROM pedidos;'

    pool.query(query, (err, dbResponse) => {
        
        if (err) {
            return res.status(500).send(err)
        }
            
        res.status(200).json(dbResponse.rows)
    })
})
.post((req, res) => {

    const query = `INSERT INTO pedidos (cliente, sabor, quantidade, tamanho)
                   VALUES ('${req.body.cliente}', 
                           '${req.body.sabor}',
                           '${req.body.quantidade}',
                           '${req.body.tamanho}');`

    pool.query(query, (err, dbResponse) => { 

        if (err) {
            return res.status(500).send(err)
        }
            

        res
            .status(200)
            .send(dbResponse.rows)
    });
})

// GET by id
app.get('/pedidos/:id', (req, res) => {
    const query = `SELECT * FROM pedidos WHERE id=${req.params.id}`
    

    pool.query(query, (err, dbResponse) => { 

        //Por id retorna um!!
        if (err && dbResponse.rows.length > 1) {
            return res.status(500).send(err)
        }
            
        res
            .status(200)
            .send(...dbResponse.rows)
    });

})

app.route('/reset')
.get((_, res) => {

    let query = `DROP TABLE IF EXISTS pedidos;`
    query += `CREATE TABLE pedidos (
        id SERIAL PRIMARY KEY,
        cliente VARCHAR(100),
        sabor VARCHAR(100),
        quantidade INTEGER,
        tamanho VARCHAR(25)
    );`

    pool.query(query, (err, _) => { 
        if (err) {
            return res.status(500).send(err)
        }
        
        console.warn('Banco de dados resetado!!')        
        res.status(200).send('Banco de dados resetado!!');
    })
})

app.listen(PORT, () => {
    console.log(`Server on : ${PORT}`)
})