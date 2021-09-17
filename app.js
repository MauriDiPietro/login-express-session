const express = require('express');
const app = express();

app.use(express.urlencoded({extended:false}));
app.use(express.json());

const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'});

//directorio public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

const bcryptjs = require('bcryptjs');

const session = require('express-session');

app.use(session({
    secret:'secret',
    resave: true,
    saveUnitialized: true
}));

const connection = require('./database/db');

// app.get('/', (req, res)=>{
//     res.render('index', {msg: 'MENSAJE'})
// });

app.get('/login', (req, res)=>{
    res.render('login')
});

app.get('/register', (req, res)=>{
    res.render('register')
});

app.post('/register', async (req, res)=>{
    const user = req.body.user;
    const name = req.body.name;
    const role = req.body.role;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 8);
    connection.query('INSERT INTO users SET ?', {user, name, role, pass:passwordHash}, async(error, results)=>{
        if(error){
            console.log(error);
        }else{
    
            // res.render('index')
            res.render('register', {
				alert: true,
				alertTitle: "Registration",
				alertMessage: "¡Successful Registration!",
				alertIcon:'success',
				showConfirmButton: false,
				timer: 1500,
				ruta: ''
			});
        }
    })
});

app.post('/auth', async (req, res)=>{
   const user = req.body.user;
   const pass = req.body.pass;
   let passwordHaash = await bcryptjs.hash(pass, 8);
   if(user && pass) {
        connection.query('SELECT * FROM users WHERE user = ?', [user], async(error, results)=>{
            if(results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass))){
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o password incorrectas",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                })
            }else{
                req.session.loggedin = true;    
                req.session.name = results[0].name 
                res.render('login', {
                    alert: true,
                    alertTitle: "Conexión exitosa",
                    alertMessage: "¡Login Correcto!",
                    alertIcon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: ''
                })
            }
            res.end();
		});
	} else {	
        res.render('login', {
            alert: true,
            alertTitle: "Advertencia",
            alertMessage: "¡Por favor ingrese un usuario y contraseña válidos!",
            alertIcon: "warning",
            showConfirmButton: true,
            timer: false,
            ruta: 'login'
        })
		res.end();
	}
});

app.get('/', (req, res)=>{
    if(req.session.loggedin){
        res.render('index', {
            login: true,
            name: req.session.name
        })
    }else{
        res.render('index', {
            login: false,
            name: 'Debe iniciar sesión'
        })
    }
    res.end()
})

//función para limpiar la caché luego del logout
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

 //Logout
//Destruye la sesión.
app.get('/logout', function (req, res) {
	req.session.destroy(() => {
	  res.redirect('/') // siempre se ejecutará después de que se destruya la sesión
	})
});

app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN PORT 3000')
}); 