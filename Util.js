function Util(){
    const regex = /[a-zA-Z0-9]+.mp3/gm;
    extractName = (song) => {
        return song.match(regex) === null? false: song_file.slice(0,-4);    
    }
}

module.exports = Util;