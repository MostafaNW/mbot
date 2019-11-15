module.exports = {
    extractName : (song) => {
        const regex = /[a-zA-Z0-9]+.mp3/gm;
        return song.match(regex) === null? false: song.slice(0,-4);    
    }, 
    isSong : (audio) => {
        console.log(`checking ${audio}!!!!!!!!!!!!!`);
        const regex = /[a-zA-Z0-9]+.mp3/gm;
        return audio.match(regex) != null;
    },
    isYoutube: (audio) => {
        const regex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        return audio.match(regex) != null;
    }
}