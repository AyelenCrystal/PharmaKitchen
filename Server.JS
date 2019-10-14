const express = require ("express");
const path = require (`path`);
const bodyParser = require(`body-parser`);
const expressSession = require ("express-session");
const exphbs = require ("express-handlebars");
const MongoClient = require ("mongodb").MongoClient;

const db = {
    url: "mongodb://localhost:27017",
    config: {
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        family: 4
    },
    name: 'Farmacia'
}

const app = express();

app.use(expressSession({
    secret: "Somewhere Only We Know",
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static(path.join(__dirname,"Client")));
app.use(express.static(path.join(__dirname,"Images")));


app.engine("handlebars", exphbs({
    defaultLayout: `main`,
    layoutsDir: path.join(__dirname, `Views/Layout`)
}));
app.set(`view engine`, "handlebars")
app.set(`Views`, path.join(__dirname, `Views/Layout`));

app.get("/", function(req, res){
    if (req.session.user){
        res.render("home", {
            user: req.session.user,
            title:"Index"
        });
    } else {
        res.render("login", {
            title: "Login - Pharma Kitchen"
        });
    }
});

app.post("/login", function(req, res){
    console.log('POST /login', 'body:', req.body);
    if (req.body.user && req.body.password) {
        validateUser(req.body.user, req.body.password, result => {
            if (result) {
                req.session.user = req.body.user;
                res.render("home",{
                    user: req.session.user,
                    title:"Index"
                });
            } else {
                req.session.destroy();
                res.render("login", {
                    mensajeError: "Usuario y/o clave incorrecta",
                    tipo: `fail`
                });

            }

        });
    } else {
        req.session.destroy();
        res.render("login", {
            mensaje: "Usuario y/o clave incorrecta",
            tipo: `fail`
        });
    }
});

app.get("/logout", function(req, res){
    req.session.destroy();
    res.render("login", {
        title:"Login-Pharma Kitchen",
    });
});

function validateUser(user, pwd, callback) {
    MongoClient.connect(db.url, db.config, (fail, client) =>{
        if (!fail) {
            const users = client.db(db.name).collection('Usuarios');
        
            users.findOne({user: user, password: pwd}, (fail, consult)=>{
                client.close();
                console.log(consult)
                if(!fail) {
                    if (consult) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                } else {
                    callback(false);
                }
            });
        } else {
            callback(false);
        }     
    });
};

app.get("/home", function(req, res) {
    res.render("home", {
        title: "Index"
    });
});

app.get("/recipes", function(req, res){
    MongoClient.connect(db.url, db.config, (fail, client) =>{
        if (!fail) {
           const recipes = client.db(db.name).collection('Recetas');

            var filter = {};
            if (req.query.recetas) filter.recetas = req.query.recetas;

            recipes.find(filter).toArray((fail, recipes) =>{
                client.close();
                res.render("recipes", {
                    selected : {recetas: true},
                    listaRecetas: recipes,
                    title: "Recetas Magistrales"
                });
            }); 
        } else {
            res.render("fail",{
                mensajeError: fail
            });
        };   
    });
});

app.get("/elements", function(req, res){
    MongoClient.connect(db.url, db.config,(fail, client)=>{
        if(!fail) {
            const elements = client.db('Farmacia').collection('Reactivos');

            elements.find().toArray((fail, elements) =>{
                client.close();
                res.render ("elements", {
                    listaReactivos: elements,
                    title: "Reactivos"
                    
                });
            });
        } else {
            res.render ("fail", {
                mensajeError: fail
            });
        }
    });     
});


app.get("/products", function(req, res){
    MongoClient.connect(db.url, db.config, (fail, client)=>{
        if(!fail){
            const products = client.db('Farmacia').collection('Productos');

            products.find().toArray((fail, products)=>{
                res.render("products",{
                    listaProductos: products,
                    title: "Productos"
                });
            })
        } else {
            res.render("fail", {
                title: "Error",
                mensajeError: fail
            })
        }

    })
});

app.get("/newProduct", function(req, res){
    res.render("newProduct",{
        title: "Nuevo Producto"
    });
});

app.post("/newProduct", function(req, res){
    const Product = {
        Nombre: req.body.nombre,
        Cantidad: req.body.cantidad.toString(),
        Forma: req.body.forma
    };

    MongoClient.connect(db.url, db.config, function(fail, client){
        if (!fail){
            const newProduct = client.db('Farmacia').collection('Productos');
            newProduct.insertOne(Product, function(fail, newProduct){
                res.render("newProduct",{
                    listaProductos: newProduct,
                    mensaje: "Producto Agregado"
                })
            });
        } else {
            res.render("fail",{
                mensajeError: "Error en la carga de datos"
            })
        }
    });
});

app.get("/newElement", function(req, res){
    res.render("newElement",{
        title: "Nuevo Reactivo"
    });
});

app.post("/newElement", function(req, res){
    const Element = {
        Reactivo: req.body.reactivo,
        Cantidad: req.body.cantidad.toString(),
        Forma: req.body.forma
    }

    MongoClient.connect(db.url, db.config, function(fail, client){
        if(!fail){
            const newElement = client.db('Farmacia').collection('Reactivos');
            newElement.insertOne(Element, function(fail, newElement){
                res.render("newElement",{
                    listaReactivos: newElement,
                    mensaje: "Reactivo Agregado"
                })
            })
        } else {
            res.render("fail", {
                mensajeError: "Error en la carga de Datos"
            })
        }
    })
})

app.listen(5400, function(){
    console.log("Ya va el 60% del proyecto. Y yo sola me complico las cosas.");
});