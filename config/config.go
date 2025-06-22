package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type Config struct {
	DBFile                string `json:"dbFile"`
	NumberOfCardsInReview int    `json:"numberOfCardsInReview"`
	VimMode               bool   `json:"vimMode"`
	LineNumbers           bool   `json:"lineNumbers"`
}

func LoadConfigFromFile(filePath string) (*Config, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
				return nil, fmt.Errorf("failed to create config directory: %w", err)
			}
			defaultCfg := NewConfig()
			if err := defaultCfg.SaveConfig(filePath); err != nil {
				return nil, err
			}
			return defaultCfg, nil
		}
		return nil, err
	}

	var config Config
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	defaultCfg := NewConfig()
	if config.DBFile == "" {
		config.DBFile = defaultCfg.DBFile
	}
	if config.NumberOfCardsInReview == 0 {
		config.NumberOfCardsInReview = defaultCfg.NumberOfCardsInReview
	}

	return &config, nil
}

func NewConfig() *Config {
	return &Config{
		NumberOfCardsInReview: 20,
		DBFile:                ".mdsrs/mdsrs.db",
		VimMode:               false,
	}
}

func (c *Config) LoadConfig() Config {
	return *c
}

func (c *Config) SaveConfig(filePath string) error {
	data, err := json.MarshalIndent(c, "", "    ")
	if err != nil {
		return err
	}

	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.Write(data)
	if err != nil {
		return err
	}

	return nil
}

func (c *Config) UpdateConfigFromJSON(jsonStr string) error {
	var tempConfig Config
	println(jsonStr)
	err := json.Unmarshal([]byte(jsonStr), &tempConfig)
	if err != nil {
		return err
	}

	*c = tempConfig

	return nil
}
