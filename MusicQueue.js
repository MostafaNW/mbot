const FastPriorityQueue = require('fastpriorityqueue');

function MusicQueue() {
	this.guildMap = {};
	this.blackList = {};
}

MusicQueue.prototype.addGuild = function(guildID) {
	/*
  Adds a guild to be monitored by the discord bot
  */
	this.guildMap[guildID] = { 'channelID': null,
		'voiceConnection' : null,
		'playing' : false,
		'dispatcher': false,
		'musicQueue' : new FastPriorityQueue(
			function(a, b) {
				return a.position < b.position;
			}),
	};
};

MusicQueue.prototype.canditate = function(guildID) {
	return !this.checkGuild(guildID) && (this.blackList[guildID] == null);
};

MusicQueue.prototype.checkGuild = function(guildID) {
	/*
  Checks if a guild exits
  */
	return !(this.guildMap[guildID] == null);
};

MusicQueue.prototype.updateChannel = function(guildID, channelID) {
	/*
  Updates the voice channel to the newly specified channelID

  */
	this.guildMap[guildID]['channelID'] = channelID;

};

MusicQueue.prototype.addSong = function(guildID, songURL, position = null) {
	/*
  Adds a guild to be monitored by the discord bot
  */
	const queue = this.guildMap[guildID].musicQueue;
	if(!position) position = queue.size;
	queue.add({ 'url' : songURL, 'position': position });
};


MusicQueue.prototype.dequeue = function(guildID) {
	/*
  Pops and returns the next song in the guild's queue
  */
	const queue = this.guildMap[guildID].musicQueue;
	return queue.poll();
};

MusicQueue.prototype.storeConnection = function(guildID, voiceConnection) {
	/*
  Joins a voice channel
  */
	this.guildMap[guildID].voiceConnection = voiceConnection;
};

MusicQueue.prototype.getConnection = function(guildID) {
	/*
  Joins a voice channel
  */
	return this.guildMap[guildID].voiceConnection;
};

MusicQueue.prototype.isPlaying = function(guildID) {
	// indicates wether audio is currently playing
	return this.guildMap[guildID].playing;
};

MusicQueue.prototype.sizeQueue = function(guildID) {
	// indicates wether audio is currently playing
	return this.guildMap[guildID].musicQueue.size;
};

MusicQueue.prototype.canPlay = function(guildID) {
	// indicates wether a song can be dequeued
	return this.sizeQueue(guildID) != 0
  && !this.isPlaying(guildID)
  && this.isConnected(guildID);
};

MusicQueue.prototype.lock = function(guildID) {
	// indicates that a song is currently being streamed
	this.guildMap[guildID].playing = true;
};

MusicQueue.prototype.unlock = function(guildID) {
	// indicates that a song is currently being streamed
	this.guildMap[guildID].playing = false;
};

MusicQueue.prototype.leaveChannel = function(guildID) {
	// gracefully exits a voice channel
	this.getConnection(guildID).disconnect();
	this.updateChannel(guildID, null);
	this.storeConnection(guildID, null);
};

MusicQueue.prototype.isConnected = function(guildID) {
	// checks if the bot is in a channel with a connection
	return this.guildMap[guildID].channelID != null &&
   this.guildMap[guildID].voiceConnection != null;
};

MusicQueue.prototype.setDispatcher = function(guildID, dispatcher) {
	this.guildMap[guildID].dispatcher = dispatcher;
};
// EXPORTING MODULE
module.exports = MusicQueue;


/*
const musicQueue = new MusicQueue();
musicQueue.addGuild('a');
musicQueue.updateChannel('a', 'ca');
musicQueue.addSong('a', 'youtubelol');
musicQueue.addSong('a', 'youtubelolkek', 1);
console.log(musicQueue.dequeue('a'));
*/
