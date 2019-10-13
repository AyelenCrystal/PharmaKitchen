const express = require ("express");
const path = require (`path`);
const bodyParser = require(`body-parser`);
const expressSession = require ("express-session");
const exphbs = require ("express-handlebars");
const mongodb = require ("mongodb");
const MongoClient = mongodb.MongoClient;
const dbUrl = "mongodb://localhost:27017";
const dbConfig = {useNewUrlParser: true, useUnifiedTopology: true, family: 4};
const dbName = "Farmacia";

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
    if (req.body.user && req.body.password) {
        validateUser(req.body.user, req.body.clave, result => {
            if (result) {
                req.session.user = req.body.user
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
    MongoClient.connect(dbUrl, dbConfig, (fail, client) =>{
        if (!fail) {
            const users = client.db("Farmacia").collection("Usuarios");
        
            users.findOne({user: user, password: pwd}, (fail, consult)=>{
                client.close();
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
    MongoClient.connect(dbUrl, dbConfig,(fail, client) =>{
        if (!fail) {
            const Farmacia = client.db(dbName);
            const recetas = Farmacia.collection("Recetas");

            var filter = {};
            if (req.query.recetas) filter.Recetas = req.query.recetas;


            recetas.findOne(filter).toArray((fail, recipes) =>{
                client.close();
                res.render("recipes",{
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
    MongoClient.connect(dbUrl, dbConfig,(fail, client)=>{
        if(!fail) {
            const Farmacia = client.db(dbName);
            const elements = Farmacia.collection("Reactivos");

            var filter = {};

            elements.find(filter).toArray((fail, elements) =>{
                client.close();
                res.render ("elements", {
                    title: "Reactivos",
                    Reactivo : req.body.reactivos,
                    Cantidad : parseInt(req.body.cantidad),
                    Forma : req.body.forma
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

    res.render("products",{
        title: "Productos"
    });
});

app.get("/newProduct", function(req, res){
    res.render("newProduct",{
        title: "Nuevo Producto"
    });
});

app.post("/newProduct", function(req, res){
    MongoClient.connect(dbUrl, dbConfig, function(fail, db){
        var Product = db.collection("Productos");

        const Product = {
            nombre: req.body.nombre,
            cantidad: parseInt(req.body.cantidad),
            forma: req.body.forma
        };

        Product.insertOne(Product, function(fail, newProduct){
            if (!fail){
                res.render("newProduct",{
                    mensaje: "Producto Agregado"
                })
            } else {
                res.render("fail",{
                    mensajeError: "Error en la carga de datos"
                })
            }
        });
    });
});

app.listen(5400, function(){
    console.log("Sigo agregando cosas locas al puerto 5400. Ya perdi la fé con el profesor");
});