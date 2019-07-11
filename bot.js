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
// IMPORTANT
const musicQueue = new MusicQueue();
const sounds = {'ourdaddy': true};
client.once('ready', () => {
	console.log('Ready!');
	// polling rates
	setInterval(addGuilds, 5000);
	setInterval(playSongs, 10000);
});
const commandMap = { 'addvoice' : addVoice,
	'enqueue' : enqueue,
	'leavevoice': leaveVoice,
  'sounds': sound
};
client.login(token);

client.on('message', message => {
	const parsedMessage = message.content.split(' ');
  console.log('received a message hyuck');
	if (parsedMessage[0] != `${prefix}mbot` || parsedMessage.length < 2
	|| commandMap[parsedMessage[1]] == null) return;
	console.log(message.content);
	const command = commandMap[parsedMessage[1]];
	const args = [message.guild.id];
	parsedMessage.slice(2).forEach(function(option) {args.push(option);});
	console.log(args);
	command(args);
	// getAudio(parsedMessage[1]);
});

fs.watch('Sounds', (eventType, filename) => {
  console.log(eventType);
  // could be either 'rename' or 'change'. new file event and delete
  // also generally emit 'rename'
  console.log(filename);
})

function playAudio(guildID, url) {
	/*
	Plays the given youtube audio (if its a valid link) to a given channel
	Args: guildID -> String
				url -> String

	*/

	console.log(`Trying ${url} for guild: ${guildID}`);
	musicQueue.lock(guildID);
	try{
		const voiceConnection = musicQueue.getConnection(guildID);
		if(voiceConnection == null) return;
		const streamOptions = { seek: 0, volume: 1 };
		const stream = ytdl(url, { filter : 'audioonly' });
		const dispatcher = voiceConnection.play(stream, streamOptions);
		// dispatcher event handeling
		dispatcher.on('end', function() {
			musicQueue.unlock(guildID);
		});
    dispatcher.on('error', error => {
      console.log(error)
    });

	}
	catch(exception) {
		console.log(exception);
	}
}

function playSound(guildID, soundFile){
	try{
		const voiceConnection = musicQueue.getConnection(guildID);
		if(voiceConnection == null) return;
		const streamOptions = { seek: 0, volume: 1 };
		const stream = `Sounds/${soundFile}.mp3`;
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
			playAudio(guild.id, musicQueue.dequeue(guild.id).url);
		}
	});
}

function sound(args){
  if(args.length == 1){
    console.log('PLACE HOLDER FOR SOUNDS');
    return;
  }
  //console.log(args[0])
  if(sounds[args[1]] == null) return;
  console.log(`${args[1]} found!`);
  playSound(args[0],args[1]);
}
