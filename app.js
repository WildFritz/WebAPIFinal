var io = require('socket.io')(process.env.PORT || 3000)
var shortid = require('shortid')


var express = require('express')
var app = express()
var mongoose = require('mongoose')

require('./db')
//quick data model
var User = mongoose.model('User', {
    playername:{
        type:String
    },
    score:{
        type:Number
    }
})

app.use(express.urlencoded({extended:true}))
app.use(express.json())

//get rote to get date from database
app.get('/download', function(req, res){
    User.find({}).then(function(user){
        res.json({user})
    })
})

//post route to save date from unity
app.post('/upload', function(req, res){
    console.log("Posting Data")
    //create new instance of the model
    var newUser = new User({
        playername:req.body.playername,
        score:req.body.score
    })

    newUser.save(function(err, result){
        if(err){
            console.log(err)
        }else{
            console.log(result)
        }
    })
})

app.listen(5000, function(){
    console.log("app running on port 5000")
})


//Socket Server code
console.log("server is running")
//console.log(shortid.generate())

var players = []

io.on('connection', function(socket){
    console.log("client connected")
    
     var clientId = shortid.generate()

     players.push(clientId)

    //spawn new players for exstint players
    socket.broadcast.emit('spawn', {id:clientId})

    // //request all existing payer positions
    // socket.broadcast.emit('requestPosition')

    // //playercount objects spawn with the new guy
    // players.forEach(function(playerId){
    //     if(playerId == clientId){
    //         return
    //     }

    //     socket.emit('spawn')
    //     console.log("sending spawn to new player")
    // })

    socket.on('hello', function(data){
        console.log("hello from the connected client")
    })


    players.forEach(function(client){
        if(client == clientId)
        {
            return
        }
        socket.emit('spawn', {id:client})
        console.log('sending spawn to new player', client)
    })

    socket.on('move', function(data){
        data.id = clientId;
        console.log("Getting positions from Client")
        console.log(data)
        socket.broadcast.emit('move', data)
    })

    socket.on('updatePosition', function(data){
        data.id = clientId;
        socket.broadcast.emit('updatePosition', data)
    })

    socket.on('disconnected', function(){
        console.log('player has disconnected')
        players.splice(players.lastIndexOf(clientId),1)
        socket.broadcast.emit('disconnected', {id:clientId})
    })
})