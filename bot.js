/** *
 *                    ___       _
 *      /\/\         / __\ ___ | |_
 *     /    \ _____ /__\/// _ \| __|
 *    / /\/\ \_____/ \/  \ (_) | |_
 *    \/    \/     \_____/\___/ \__|
 *
 */

// DEPENDENCIES, CONFIG
const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
const { prefix, token } = require('./config.json');
const welcome  = '';
const ytdl = require('ytdl-core');
const MusicQueue = require('./MusicQueue.js');
const Util = require('./Util.js')
// IMPORTANT
const musicQueue = new MusicQueue();
const sounds = {'hitman': true, 'shutup': true};
//express
const express = require('express')
const app = express()
const port = 3000
app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

client.once('ready', () => {
	console.log('Ready!');
	// polling rates
	setInterval(addGuilds, 5000);
	setInterval(playSongs, 10000);
});
const commandMap = { 'connect' : addVoice,
	'enqueue' : enqueue,
	'disconnect': leaveVoice,
  'sounds': sound
};
client.login(token);

client.on('message', message => {
	const parsedMessage = message.content.split(' ');
	console.log('received a message hyuck');
	if (parsedMessage[0][0] != `${prefix}`) return;
	console.log(message.content);
	parsedCommand = parsedMessage[0].slice(1,)
	if (!(parsedCommand in commandMap))
		soundWrapper([message.guild.id, parsedCommand]); //should return null if the sound doesn't exist
	else{
		const command = commandMap[parsedCommand];
		const args = [message.guild.id];
		parsedMessage.slice(1).forEach(function(option) {args.push(option);});
		console.log(args);
		command(args);
		// getAudio(parsedMessage[1]);
	}
});

fs.watch('Sounds', (eventType, filename) => {
  console.log(eventType);
  if (eventType === 'change'){
	  //new sound file
	 const songName = Util.extractName(filename);
	 if (songName==false){
		 console.log(filename + ' is not of type .mp3');
		 return;
	 }
	 sounds['songName'] == true;
  }
  // could be either 'rename' or 'change'. new file event and delete
  // also generally emit 'rename'
  console.log(filename);
})

function playAudio(guildID, url, isSong=false) {
	/*
	Plays the given youtube audio (if its a valid link) to a given channel
	Args: guildID -> String
				url -> String

	*/

	console.log(`Trying ${url} for guild: ${guildID}`);
	if (musicQueue.isPlaying(guildID)){
		musicQueue.addSong(guildID, url);
		return;
	}
	musicQueue.lock(guildID);
	try{
		const voiceConnection = musicQueue.getConnection(guildID);
		if(voiceConnection == null) return;
		const streamOptions = { seek: 0, volume: 1 };
		let stream;
		if(!isSong){
			stream = ytdl(url, { filter : 'audioonly' });
		} else {
			stream = `Sounds/${url}.mp3`;
		}
		const dispatcher = voiceConnection.play(stream, streamOptions);
		// dispatcher event handeling
		dispatcher.on('end', function() {
			musicQueue.unlock(guildID);
		});
  		dispatcher.on('error', error => {
			console.log(error)
	 	 	musicQueue.unlock(guildID);
   		});

	}
	catch(exception) {
		console.log(exception);
	}
}
/**
function playSound(guildID, soundFile){
	try{
		const voiceConnection = musicQueue.getConnection(guildID);
		if(voiceConnection == null) return;
		const streamOptions = { seek: 0, volume: 1 };
		
		const dispatcher = voiceConnection.play(stream, streamOptions);
		// dispatcher even handeling
    dispatcher.on('end', function() {
      console.log('got em!~');
    });
    dispatcher.on('error', error => {
      console.log(error)
    });
	}
	catch(exception) {
		console.log(exception);
	}

}

 */

/*
	BOT COMMANDS

*/
function enqueue(args) {
	/*
	queues the given youtube audio (if its a valid link) to a given channel
	Args: guildID -> String
				url -> String

	*/
	const guildID = args[0];
	const url = args[1];
	musicQueue.addSong(guildID, url);
}

function addVoice(args) {
	/*
	Joins a voice channel
	Args: guildID -> String, the discord server context
				name -> String  , voice channel name to join
	*/
	const guildID = args[0];
	const name = args[1];
	console.log(name);
	const voiceChannel = client.channels.find(channel => channel.name == name);
	if(voiceChannel == null) return;
	voiceChannel.join()
		.then(connection => {
			console.log('Connected!');
			// need to use guild id
			musicQueue.storeConnection(guildID, connection);
			musicQueue.updateChannel(guildID, voiceChannel.id);
		})
		.catch(console.error);

}

function leaveVoice(args) {
	/*
	leaves a voice channel
	Args: guildID -> String

	*/
	const guildID = args[0];
	musicQueue.leaveChannel(guildID);
}

/*
	POLLING FUNCTIONS
*/
function addGuilds() {
	client.guilds.forEach(function(guild) {
		//console.log('Probing potential guilds...');
		if (musicQueue.canditate(guild.id)) {
			console.log(`Found ${guild.id}`);
			musicQueue.addGuild(guild.id);
		}
	});
}

function playSongs() {
	client.guilds.forEach(function(guild) {
		//console.log(`Checking ${guild.id} for audio, size ${musicQueue.sizeQueue(guild.id)}
		//\n , ${musicQueue.guildMap[guild.id].channelID}`);
		if(musicQueue.canPlay(guild.id)) {
			const resource = musicQueue.dequeue(guild.id).url
			if (!Util.isYoutube(resource)){
				soundWrapper([guild.id, resource])
			} else {
				playAudio(guild.id, resource);
			}		
		}
	});
}
/**
 * 
 *
 *  */
function soundWrapper([guildID, soundName]){
  //console.log(args[0])
  if(sounds[soundName] == null) return; //the audio clip name either isn't in memory/doesn't exist
  console.log(`${soundName} found!`);
  playAudio(guildID ,soundName, sound=true);
}

function sound() {
	console.log('TIME TO ECHO ALL THE SOUNDS BOI');
}