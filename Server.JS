const express = require ("express");
const path = require (`path`);
const app = express();
const expressSession = require ("express-session");

app.use(express.static(path.join(__dirname,"/Client")));

//app.get("/",(req, res) =>{
    //res.render("/login"); });


const exphbs = require ("express-handlebars");
app.engine("handlebars", exphbs({
    defaultLayout: `main`,
    layoutsDir: path.join(__dirname, `Views/Layout`)
}));
app.set(`view engine`, "handlebars")
app.set(`Views`, path.join(__dirname, `Views/Layout`));

const mongodb = require ("mongodb");
const MongoClient = mongodb.MongoClient;
const dbUrl = "localhost:27017";
const dbConfig = {useNewParser: true, useUnifiedTopology: true, family: 4};
const dbName = "InventarioPharma";

app.get("/home",(res, req) =>{
    
})








































app.listen(4000, function(){
    console.log("Escuchando Puerto 4000-Primera Prueba");
});