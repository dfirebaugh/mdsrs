package audio

import (
	"os"
	"time"

	"github.com/hajimehoshi/ebiten/v2/audio"
	"github.com/hajimehoshi/ebiten/v2/audio/mp3"
	"github.com/hajimehoshi/ebiten/v2/audio/vorbis"
)

type MusicType int

const (
	TypeOgg MusicType = iota
	TypeMP3
)

type Player struct {
	audioPlayer  *audio.Player
	audioContext *audio.Context
}

func NewPlayer() *Player {
	return &Player{
		audioContext: audio.NewContext(24000),
	}
}

func (p *Player) PlayAudioFile(filePath string, mType MusicType) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	var player *audio.Player

	switch mType {
	case TypeOgg:
		stream, err := vorbis.DecodeWithoutResampling(file)
		if err != nil {
			return err
		}
		player, err = p.audioContext.NewPlayer(stream)
		if err != nil {
			return err
		}
	case TypeMP3:
		stream, err := mp3.DecodeWithoutResampling(file)
		if err != nil {
			return err
		}
		player, err = p.audioContext.NewPlayer(stream)
		if err != nil {
			return err
		}
	default:
		panic("unsupported music type")
	}

	if p.audioPlayer != nil {
		if err := p.audioPlayer.Close(); err != nil {
			return err
		}
	}

	p.audioPlayer = player
	p.audioPlayer.Play()

	time.Sleep(10 * time.Second)

	return nil
}
