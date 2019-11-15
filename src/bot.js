/** *
 *                    ___       _
 *      /\/\         / __\ ___ | |_
 *     /    \ _____ /__\/// _ \| __|
 *    / /\/\ \_____/ \/  \ (_) | |_
 *    \/    \/     \_____/\___/ \__|
 *
 */

// DEPENDENCIES, CONFIG
import { Client } from 'discord.js';
import { readdir, watch } from 'fs';
const client = new Client();
import { prefix, token } from './config.json';
const welcome  = '';
import ytdl from 'ytdl-core';
import MusicQueue from './MusicQueue.js';
import { isYoutube, extractName } from './Util.js';
// IMPORTANT
const musicQueue = new MusicQueue();
const sounds = {};
const commandMap = { 'connect' : addVoice,
	'enqueue' : enqueue,
	'disconnect': leaveVoice,
  'sounds': allSounds
};
client.login(token);

client.once('ready', () => {
	console.log('Ready!');
	// polling rates
	setInterval(addGuilds, 5000);
	setInterval(playSongs, 10000);
	setInterval(() => console.log(sounds), 2000);
});

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
		const args = [message];
		parsedMessage.slice(1).forEach(function(option) {args.push(option);});
		console.log(args);
		command(args);
	}
});
client.on('disconnect', event => {
	})

readdir('Sounds', (err, files) => {
	files.forEach(file => {
		addSong(file);
	});
});
watch('Sounds', (eventType, filename) => {
  console.log(eventType);
  if (eventType === 'change'){
	  //new sound file
	 addSong(filename)
  }
  // could be either 'rename' or 'change'. new file event and delete
  // also generally emit 'rename'
  console.log(filename);
})

function playAudio(guildID, url, isSong=false){
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

/*
	BOT COMMANDS

*/
function enqueue([message, url]){
	/*
	queues the given youtube audio (if its a valid link) to a given channel
	Args: message -> Message object
				url -> String

	*/
	musicQueue.addSong(message.guild.id, url);
}
function addVoice([message, name]){
	/*
	Joins a voice channel
	Args:	message -> Message object
			name -> String  , voice channel name to join
	*/
	const guildID = message.guild.id;
	//console.log(name);
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

function leaveVoice([message]){
	/*
	leaves a voice channel
	Args: guildID -> String

	*/
	musicQueue.leaveChannel(message.guild.id);
}

/*
	POLLING FUNCTIONS
*/
function addGuilds(){
	client.guilds.forEach(function(guild) {
		//console.log('Probing potential guilds...');
		if (musicQueue.canditate(guild.id)) {
			console.log(`Found ${guild.id}`);
			musicQueue.addGuild(guild.id);
		}
	});
}

function playSongs(){
	client.guilds.forEach(function(guild) {
		//console.log(`Checking ${guild.id} for audio, size ${musicQueue.sizeQueue(guild.id)}
		//\n , ${musicQueue.guildMap[guild.id].channelID}`);
		if(musicQueue.canPlay(guild.id)) {
			const resource = musicQueue.dequeue(guild.id).url
			if (!isYoutube(resource)){
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
function addSong(name){
	extractedName = extractName(name);
	console.log(`Result: ${extractedName}`);
	if(extractedName)
		sounds[extractedName] = true;
	return;
}
function soundWrapper([message, soundName]){
  //console.log(args[0])
  if(sounds[soundName] == null) return; //the audio clip name either isn't in memory/doesn't exist
  console.log(`${soundName} found!`);
  playAudio(message.guild.id ,soundName, sound=true);
}

function allSounds([message]){
	var response = "\`\`\`Sounds:\n\n"; 
	Object.keys(sounds).forEach((sound) =>{
		response += sound + ' ';
	})
	response += "\`\`\`";
	console.log(response);
	message.reply(response);
}