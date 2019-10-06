const express = require ("express");
const path = require (`path`);
const app = express();
//const expressSession = require ("express-session");
const exphbs = require ("express-handlebars");
const mongodb = require ("mongodb");
const MongoClient = mongodb.MongoClient;
const dbUrl = "localhost:27017";
const dbConfig = {useNewParser: true, useUnifiedTopology: true, family: 4};
const dbName = "InventarioPharma";


app.use(express.static(path.join(__dirname,"Client")));


app.engine("handlebars", exphbs({
    defaultLayout: `main`,
    layoutsDir: path.join(__dirname, `Views/Layout`)
}));
app.set(`view engine`, "handlebars")
app.set(`Views`, path.join(__dirname, `Views/Layout`));

app.get("/home", function(req, res) {
    res.render("home", {
        title: "Index"
    });
});










app.listen(4100, function(){
    console.log("Escuchando Puerto 4100-Segunda Prueba");
});