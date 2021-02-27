const socket = io()

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const $chat = document.querySelector('#chat');
const $submitBtn = document.querySelector('#submit');
const $chatForm = document.querySelector('#chatForm');
const $sendLocationBtn = document.querySelector('#send_location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Template
const message_templete = document.querySelector('#message_templete').innerHTML;
const location_message_templete = document.querySelector('#location_message_templete').innerHTML;
const sidebar_templete = document.querySelector('#sidebar_templete').innerHTML;

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (msg) => {
    // console.log(msg)
    const html = Mustache.render(message_templete, {
        msg : msg.text,
        username: msg.username.toUpperCase(),
        createdAt : moment(msg.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})
socket.on('locationMessage', (url) => {
    // console.log(url)
    const html = Mustache.render(location_message_templete, {
        url : url.url,
        username: url.username.toUpperCase(),
        createdAt : moment(url.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})
socket.on('roomData', ({room, users}) => {
    // console.log('roomData', room, users)
    const html = Mustache.render(sidebar_templete, {
        room : room.toUpperCase(),
        users : users.map((user) => {
            user.username = user.username.toUpperCase()
            return user
        })
    })
    $sidebar.innerHTML = html
})

$chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const message = $chat.value
    if(!message) {
        // alert('Please enter your message...')
        return false;
    }
    $submitBtn.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', message, (e) => {
        if(e) return console.log(e)

        console.log('Message Delivered')
        $submitBtn.removeAttribute('disabled')
        $chat.value = ''
        $chat.focus()
    })
})

let sendLocation;
$sendLocationBtn.addEventListener('click', () => {
    if(!navigator.geolocation) 
        return alert('Geolocation is not supported by your browser...')

    $sendLocationBtn.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition( (pos) => {
        // console.log(pos)
        sendLocation = { 
            lat     : pos.coords.latitude,
            long    : pos.coords.longitude
        }
        socket.emit('sendLocation', sendLocation, () => {            
            console.log('Location shared!')
            $sendLocationBtn.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (err) => {
    if(err) {
        alert(err)
        location.href = '/'
    }
})

// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated!',count)
// })
// document.querySelector("#increment").addEventListener('click', () => {
//     console.log('Clicked')
//     socket.emit('increment')
// })
// document.querySelector("#decrement").addEventListener('click', () => {
//     console.log('Clicked')
//     socket.emit('decrement')
// })