package main

import (
	"embed"

	"github.com/dfirebaugh/mdsrs/config"
	"github.com/dfirebaugh/mdsrs/store"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	cfg, err := config.LoadConfigFromFile(".mdsrs/config.json")
	if err != nil {
		cfg = config.NewConfig()
	}

	store.SetDBPath(cfg.DBFile)

	app := NewApp()
	a := &options.App{
		Title:  "mdsrs",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       store.CloseDB,
		Bind: []any{
			app,
			&ConfigService{
				Config: config.NewConfig(),
			},
		},
	}

	err = wails.Run(a)
	if err != nil {
		println("Error:", err.Error())
	}
}
