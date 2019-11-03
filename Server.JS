//Librerias requeridas para nuestro servidor: Express, Path y BodyParser(propias de Express), Sessions, Handlebars y MongoDB//Express
const express = require ("express");
const path = require (`path`);
const bodyParser = require(`body-parser`);
const expressSession = require ("express-session");
const exphbs = require ("express-handlebars");
const MongoClient = require ("mongodb").MongoClient;

//Configuración de MongoDB
const db = {
    url: "mongodb://localhost:27017",
    config: {
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        family: 4
    },
    name: 'Farmacia'
}

//Nombre de nuestro servidor y al que vamos a llamar ante cada get y post
const app = express();

//Configuración de ExpressSession
app.use(expressSession({
    secret: "Somewhere Only We Know",
    resave: false,
    saveUninitialized: false
}));

//Parsea los datos provenientes de la url;usado para forms
app.use(bodyParser.urlencoded({extended:true}));

//Middleware para archivos estaticos requeridos desde browser
app.use(express.static(path.join(__dirname,"Client")));
app.use(express.static(path.join(__dirname,"Images")));

//Configuración de Handlebars
app.engine("handlebars", exphbs({
    defaultLayout: `main`,
    layoutsDir: path.join(__dirname, `Views/Layout`)
}));
app.set(`view engine`, "handlebars")
app.set(`Views`, path.join(__dirname, `Views/Layout`));

//Llamado a la pantalla de login- GET
app.get("/", function(req, res){
    if (req.session.user){
        //Renderizamos home.handlebars para devolverla ante llamado
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

//Envio de respuesta para login
app.post("/login", function(req, res){
    console.log('POST /login', 'body:', req.body);
    if (req.body.user && req.body.password) {
        validateUser(req.body.user, req.body.password, result => {
            if (result) {
                //Si se validan los datos, se guarda la sesion e ingresa al home
                req.session.user = req.body.user;
                return res.redirect('/');
            } else {
                //Caso contrario, la sesión se destruye y se visualiza un mensaje de error
                req.session.destroy();
                res.render("login", {
                    mensajeError: "Usuario y/o clave incorrecta",
                    tipo: `fail`
                });

            }

        });
    } else {
        //Lo mismo ocurre en el caso de que no se ingresen los datos o se ingrese uno de ellos
        req.session.destroy();
        res.render("login", {
            mensaje: "Usuario y/o clave incorrecta",
            tipo: `fail`
        });
    }
});

//Cierra la sesión y regresa a la pantalla de login
app.get("/logout", function(req, res){
    req.session.destroy();
    res.render("login", {
        title:"Login-Pharma Kitchen",
    });
});

/**
 * Valida el user y password contra los datos de la collección de MongoDB.
 * @param user User
 * @param pwd Password
 * @param callback Función asincrónica, cuyos paramétros son True o False
 */
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

//Renderiza y devuelve la pantalla de Home
app.get("/home", function(req, res) {
    res.render("home", {
        user: req.session.user,
        title: "Index"
    });
});

//Consulta la base de datos mediante una query
app.get("/recipes", function(req, res){
    //Dato de consola para controlar ingreso de datos
    console.log(req.query);
    //Conexion a MongoDB
    MongoClient.connect(db.url, db.config, (fail, client) =>{
        if (!fail) {
            //Si se logra conectar, determinamos la base de datos y la collección a consultar
            const recipes = client.db(db.name).collection('Recetas');

            //Armo el filtro con la consulta a hacer, especificando que se usa como paramétro el dato del nombre.
            var filter = {};
            if (req.query.recetas) {
                filter = {
                    Nombre: req.query.recetas
                }
            }
            //Y renderizo la pantalla con el buscador
            else {
                res.render("recipes", {
                    user: req.session.user,
                    selected : {recetas: true},
                    listaRecetas: [],
                    title: "Recetas Magistrales"
                });
                return;
            }
            //Dato de filtro consultado en la consola
            console.log(filter);

            //Consulta a la base de datos y convertida en array
            recipes.find(filter).toArray((fail, recipes) =>{
                //Cierro la conexion luego de cada consulta/alta
                client.close();
                //Si son erroneos, devuelve mensaje de error
                if(recipes.length === 0) {
                    res.render("recipes", {
                        mensajeError: "No se encontró nada que concuerde con la búsqueda."
                    });
                    return;
                }
                //Renderizamos la vista con la busqueda
                res.render("recipes", {
                    user: req.session.user,
                    selected : {recetas: true},
                    listaRecetas: recipes,
                    title: "Recetas Magistrales"
                });
            }); 
        } else {
            //Lo mismo si no se ingresan datos
            res.render("fail",{
                mensajeError: fail
            });
        };   
    });
});

//Consulta de base de datos.
app.get("/elements", function(req, res){
    MongoClient.connect(db.url, db.config,(fail, client)=>{
        if(!fail) {
            const elements = client.db('Farmacia').collection('Reactivos');

            elements.find().sort({Reactivo:1}).toArray((fail, elements) =>{
                client.close();
                res.render ("elements", {
                    user: req.session.user,
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

//Consulta de base de datos. A diferencia de la primera, tanto la de reactivos y productos solo consultan datos.
app.get("/products", function(req, res){
    MongoClient.connect(db.url, db.config, (fail, client)=>{
        if(!fail){
            const products = client.db('Farmacia').collection('Productos');

            products.find().sort({Nombre: 1}).toArray((fail, products)=>{
                res.render("products",{
                    user: req.session.user,
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

//Renderiza nueva pantalla para alta de item
app.get("/newProduct", function(req, res){
    res.render("newProduct",{
        user: req.session.user,
        title: "Nuevo Producto"
    });
});

//Por ella se agregan los datos para el nuevo item
app.post("/newProduct", function(req, res){
    //Parametros del nuevo item
    const Product = {
        Nombre: req.body.nombre,
        Cantidad: req.body.cantidad.toString(),
        Forma: req.body.forma
    };
    //Conexión al servidor de MongoDB
    MongoClient.connect(db.url, db.config, function(fail, client){
        if (!fail){
            //Collección de la base de datos a donde ira el nuevo item
            const newProduct = client.db('Farmacia').collection('Productos');
            newProduct.insertOne(Product, function(fail, newProduct){
                //Luego de insertado el item, renderiza la pantalla
                res.render("newProduct",{
                    user: req.session.user,
                    listaProductos: newProduct,
                    mensaje: "Producto Agregado"
                })
            });
        } else {
            //Caso contrario, aparece una pantalla de error
            res.render("fail",{
                mensajeError: "Error en la carga de datos"
            })
        }
    });
});

//Lo mismo ocurre en las pantallas de nuevo reactivo, tanto para el post como para el get
app.get("/newElement", function(req, res){
    res.render("newElement",{
        user: req.session.user,
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
                    user: req.session.user,
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

//Llamado al servidor
app.listen(8379, function(){
    console.log("Running Local Host 8379");
});