const express = require('express')
const { json, urlencoded } = require('body-parser')
const config = require('config')
const pg = require('pg')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || config.get('server.port')

const pool = new pg.Pool({
    connectionString: 'postgres://wbnojegc:EicOXz_BCjHJjT7LdnwR9KmJhgzqMv_z@batyr.db.elephantsql.com/wbnojegc',
    ssl: {
        rejectUnauthorized: false
    }
})

const verifyJWT = (req, res, next) => {
    const bearer = req.headers['authorization'];
    
    const token = bearer.split(" ")[1];

    if (!token){
        return res.status(401).json({ 
            auth: false, 
            message: 'Authorization required' 
        });
    }
    
    jwt.verify(token, config.get('secret'), err => {
      
      if (err) {
        return res.status(500).json({ 
            auth: false, 
            essage: 'Authorization failed' 
        });
      }

      next();   
    });
}

const app = express()

app.use(json())
app.use(urlencoded({ extended: true }))

app.route('/login')
.post((req, res) => {
    const query = `SELECT * FROM usuarios WHERE email='${req.body.email}';`

    pool.query(query, (err, selectUser) => {
        
        if (err || selectUser.rows.length <= 0) {
            return res.status(404).send({ 
                email: false, 
                senha: false, 
                token: null 
            })
        }

        else if(!bcrypt.compareSync(req.body.senha, selectUser.rows[0].senha)){
            return res.status(401).send({ 
                email: true, 
                senha: false, 
                token: null 
            })
        }

        const token = jwt.sign(
            {
                data: { 
                    id: selectUser.rows[0].id,
                    email: selectUser.rows[0].email,
                    nome: selectUser.rows[0].nome
                }
            }, 
            config.get('secret'), 
            { expiresIn: '24h' }
        );

        res.status(200).send({ 
            email: true, 
            senha: true, 
            token: token 
        })
    })
})


//---------
//---------
//---------------CRUD - CLIENTES----------
app.route('/clientes')
.get(verifyJWT, (_, res) => {
    const query = 'SELECT * FROM clientes;'

    pool.query(query, (err, dbResponse) => {
        
        if (err) {
            return res.status(500).send(err)
        }
            
        res.status(200).json(dbResponse.rows)
    })
})
.post(verifyJWT, (req, res) => {

    const query = `INSERT INTO clientes (
                        nome, 
                        idade
                   )
                   VALUES (
                        '${req.body.nome}',
                        '${req.body.idade}'
                   );`

    pool.query(query, (err, dbResponse) => { 

        if (err) {
            return res.status(500).send(err)
        }

        res.status(200).send(dbResponse.rows)
    });
})
.put(verifyJWT, (req, res) => {

    const select = `SELECT * FROM clientes WHERE id = ${req.body.id};`

    pool.query(select, (err, dbResponse) => {
        if (err) {
            return res.status(500).send(err)
        }
        else if(dbResponse.rows.length <= 0){
            return res.status(404).send("Cliente não encontrado!")
        }


        const clienteUpdate = {
            nome:  req.body.nome  || dbResponse.rows[0].nome,
            idade: req.body.idade || dbResponse.rows[0].idade,
        }

        console.log(clienteUpdate)
    
        const query = `UPDATE clientes 
                       SET nome  = '${clienteUpdate.nome}', 
                           idade = ${clienteUpdate.idade}
                       WHERE id = ${req.body.id};`
    
        pool.query(query, (err, updateResponse) => { 
    
            if (err) {
                return res.status(500).send(err)
            }
    
            res.status(200).send(updateResponse.rows)
        });
    })
})
.delete(verifyJWT, (req, res) => {
    const select = `SELECT * FROM clientes WHERE id = ${req.body.id};`

    pool.query(select, (err, dbResponse) => {
        if (err) {
            return res.status(500).send(err)
        }
        else if(dbResponse.rows.length <= 0){
            return res.status(404).send("Cliente não encontrado!")
        }

        const query = `DELETE FROM clientes WHERE id = ${req.body.id}`

        pool.query(query, (err, deleteResponse) => { 
    
            if (err) {
                return res.status(500).send(err)
            }
    
            res.status(200).send(deleteResponse.rows)
        });  
    })
})

// GET by id
app.get('/clientes/:id', verifyJWT, (req, res) => {
    const query = `SELECT * FROM clientes WHERE id=${req.params.id}`
    
    pool.query(query, (err, dbResponse) => { 

        if (err) {
            return res.status(500).send(err)
        }
        else if (dbResponse.rows.length <= 0){
            return res.status(404).send("Cliente não encontrado!")
        }
            
        res.status(200).send(...dbResponse.rows)
    });
})

app.get('/clientes/:id/pedidos', verifyJWT, (req, res) => {
    const query = `SELECT * FROM pedidos WHERE clienteId=${req.params.id}`
    
    pool.query(query, (err, dbResponse) => { 

        if (err) {
            return res.status(500).send(err)
        }
        else if (dbResponse.rows.length <= 0){
            return res.status(404).send("Cliente não encontrado!")
        }
            
        res.status(200).send(dbResponse.rows)
    });
})
//---------
//---------

//---------
//---------
//---------------CRUD - PEDIDOS----------
app.route('/pedidos')
.get(verifyJWT, (_, res) => {

    const query = 'SELECT * FROM pedidos;'

    pool.query(query, (err, dbResponse) => {
        
        if (err) {
            return res.status(500).send(err)
        }
            
        res.status(200).json(dbResponse.rows)
    })
})
.post(verifyJWT, (req, res) => {

    const query = `INSERT INTO pedidos (
                        clienteId, 
                        sabor, 
                        quantidade, 
                        tamanho, 
                        status, 
                        data
                   )
                   VALUES (
                       '${req.body.clienteId}', 
                       '${req.body.sabor}',
                       '${req.body.quantidade}',
                       '${req.body.tamanho}',
                       0,
                       extract(epoch from now())
                   );`

    pool.query(query, (err, dbResponse) => { 

        if (err) {
            return res.status(500).send(err)
        }

        res.status(200).send(dbResponse.rows)
    });
})
.put(verifyJWT, (req, res) => {

    const select = `SELECT * FROM pedidos WHERE id = ${req.body.id};`

    pool.query(select, (err, dbResponse) => {
        if (err) {
            return res.status(500).send(err)
        }
        else if(dbResponse.rows.length <= 0){
            return res.status(404).send("Pedido não encontrado!")
        }

        const pedidoUpdate = {
            clienteId:  req.body.clienteId  || dbResponse.rows[0].clienteId,
            sabor:      req.body.sabor      || dbResponse.rows[0].sabor,
            quantidade: req.body.quantidade || dbResponse.rows[0].quantidade,
            tamanho:    req.body.tamanho    || dbResponse.rows[0].tamanho,
            status:     req.body.status     || dbResponse.rows[0].status
        }

        const query = `UPDATE pedidos 
                    SET clienteId  = '${pedidoUpdate.clienteId}', 
                        sabor      = '${pedidoUpdate.sabor}', 
                        quantidade = ${pedidoUpdate.quantidade}, 
                        tamanho    = '${pedidoUpdate.tamanho}', 
                        status     = '${pedidoUpdate.status}', 
                        data       = extract(epoch from now())
                    WHERE id = ${req.body.id};`

        pool.query(query, (err, updateResponse) => { 

            if (err) {
                return res.status(500).send(err)
            }

            res.status(200).send(updateResponse.rows)
        });
    })
})
.delete(verifyJWT, (req, res) => {
    const select = `SELECT * FROM pedidos WHERE id = ${req.body.id};`

    pool.query(select, (err, dbResponse) => {
        if (err) {
            return res.status(500).send(err)
        }

        else if(dbResponse.rows.length <= 0){
            return res.status(404).send("Pedido não encontrado!")
        }

        const query = `DELETE FROM pedidos WHERE id = ${req.body.id}`

        pool.query(query, (err, dbResponse) => { 
    
            if (err) {
                return res.status(500).send(err)
            }
    
            res.status(200).send(dbResponse.rows)
        });
    })
})

// GET by id
app.get('/pedidos/:id', verifyJWT, (req, res) => {
    const query = `SELECT * FROM pedidos WHERE id=${req.params.id}`
    
    pool.query(query, (err, dbResponse) => { 

        if (err) {
            return res.status(500).send(err)
        }
        else if (dbResponse.rows.length <= 0){
            return res.status(404).send("Pedido não encontrado!")
        }
            
        res.status(200).send(...dbResponse.rows)
    });
})
//---------
//---------

app.route('/reset')
.get((_, res) => {

    let query = `DROP TABLE IF EXISTS pedidos;`
    query += `DROP TABLE IF EXISTS clientes;`
    query += `DROP TABLE IF EXISTS usuarios;`

    query += `CREATE TABLE pedidos (
        id SERIAL PRIMARY KEY,
        clienteId INTEGER NOT NULL,
        sabor VARCHAR(100),
        quantidade INTEGER,
        tamanho VARCHAR(25),
        status INTEGER,
        data NUMERIC
    );`

    query += `CREATE TABLE clientes (
        id SERIAL PRIMARY KEY,
        nome TEXT,
        idade INTEGER
    );`

    query += `CREATE TABLE usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT,
        email TEXT,
        senha TEXT
    );
    COMMIT;`
    
    
    //Usário padrão da aplicação
    query += `INSERT INTO usuarios (nome, email, senha)
              VALUES ('BolinhoAdmin', 'bolinho@bolinho.com.br', '${bcrypt.hashSync('123456', 10)}');`


    pool.query(query, err => { 
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