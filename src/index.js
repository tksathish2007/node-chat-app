const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateMessageLocation } = require('./utils/message')
const { addUser, getUser, removeUser, getUsersInRoom } = require('./utils/user')

const app = express()   
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))

let count = 0, msg
io.on('connection', (socket) => {    

    socket.on('join', (options, cb) => {
        const { error, user } =  addUser({ id: socket.id, ...options })
        if(error) return cb(error)

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome to chat app!!!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} joined our group`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        cb()
    })

    socket.on('sendMessage', (msg, cb) => {
        const user = getUser(socket.id)

        const filter = new Filter()
        if(filter.isProfane(msg)) return cb('Profinity is not allowed!!!')
        io.to(user.room).emit('message', generateMessage(user.username, msg))
        cb()
    })

    socket.on('sendLocation', (loc, cb) => {
        const user = getUser(socket.id)
        msg = `http://google.com/maps?q=${loc.lat},${loc.long}`
        io.to(user.room).emit('locationMessage', generateMessageLocation(user.username,msg))
        cb()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user)
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left the group :)`))
    })

    // console.log('New Web Socket Connection')
    // socket.emit('countUpdated', count)
    // socket.on('increment', () => {
    //     count++;
    //     // socket.emit('countUpdated', count)
    //     io.emit('countUpdated', count)
    // })
    // socket.on('decrement', () => {
    //     count--;
    //     // socket.emit('countUpdated', count)
    //     io.emit('countUpdated', count)
    // })
})

server.listen(port, ()=> {
    console.info('Server is up on port '+port)
})