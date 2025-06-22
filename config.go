package main

import (
	"github.com/dfirebaugh/mdsrs/config"
	"github.com/sirupsen/logrus"
)

type ConfigService struct {
	Config *config.Config
}

type ConfigResult struct {
	Config config.Config
	Error  string
}

func (c *ConfigService) Save(configJSON string) {
	if err := c.Config.UpdateConfigFromJSON(configJSON); err != nil {
		logrus.Error(err)
	}
	println(configJSON)

	if err := c.Config.SaveConfig(".mdsrs/config.json"); err != nil {
		logrus.Error(err)
	}
}

func (c *ConfigService) Load() ConfigResult {
	cfg, err := config.LoadConfigFromFile(".mdsrs/config.json")
	if err != nil {
		logrus.Error("Error loading config:", err)
		return ConfigResult{
			Config: *config.NewConfig(),
			Error:  err.Error(),
		}
	}
	c.Config = cfg
	return ConfigResult{
		Config: *cfg,
		Error:  "",
	}
}
