const express = require ("express");
const path = require (`path`);
const expressSession = require ("express-session");
const exphbs = require ("express-handlebars");
const mongodb = require ("mongodb");
const MongoClient = mongodb.MongoClient;
const dbUrl = "localhost:27017";
const dbConfig = {useNewUrlParser: true, useUnifiedTopology: true, family: 4};
const dbName = "Farmacia";

const app = express();

app.use(expressSession({
    secret: "Somewhere Only We Know",
    resave: false,
    saveUninitialized: false
}));



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
    if (req.body.usuario && req.body.clave) {
        validateUser(req.body.usuario, req.body.clave, result => {
            if (result) {
                req.body.usuario = req.session.user;
                res.render("/home",{
                    user: req.session.user,
                    title:"Index"
                });
            } else {
                req.session.destroy();
                res.render("/login", {
                    mensajeError: "Usuario y/o clave incorrecta",
                    tipo: `fail`
                });

            }

        });
    } else {
        req.session.destroy();
        res.render("/login", {
            mensajeError: "Usuario y/o clave incorrecta",
            tipo: `fail`
        });
    }
});

app.get("/logout", function(req, res){
    req.session.destroy();
    res.render("/login", {
        title:"Login-Pharma Kitchen",
    });
});

function validateUser(user, pwd, callback) {
    MongoClient.connect(dbUrl, dbConfig, (fail, client) =>{
        const users = client.db("Farmacia").collection("Usuarios");

        users.findOne({user, pwd}, (fail, client)=>{
            if (user) {

            }
        });
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
                    listaRecetas: recetas,
                    title: "Recetas Magistrales"
                });
            }); 
        } else {
            res.render("error",{
                mensajeError: fail
            });
        };   
    });
});

app.get("/elements", function(req, res){
    MongoClient.connect(dbUrl, dbConfig,(fail, client)=>{
        if(!fail) {
            res.render ("elements", {
                title: "Reactivos"
            });
        } 
    });
});


app.get("/products", function(req, res){
    res.render("products",{
        title: "Productos"
    });
});



app.listen(5300, function(){
    console.log("Listening Local Host 5300-Welcome to South Park");
});