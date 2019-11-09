module.exports = function Util(){
    const regex = /[a-zA-Z0-9]+.mp3/gm;
    const extractName = (song) => {
        return song.match(regex) === null? false: song_file.slice(0,-4);    
    }
    const isSong = (audio) => {
        return audio.match(regex) != null;
    }
}