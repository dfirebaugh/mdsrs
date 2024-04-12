package config

import (
	"encoding/json"
	"os"
)

type Config struct {
	NumberOfCardsInReview   int      `json:"numberOfCardsInReview"`
	DecksExcludedFromReview []string `json:"decksExcludedFromReview"`
}

func LoadConfigFromFile(filePath string) (*Config, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			defaultCfg := &Config{
				NumberOfCardsInReview: 20,
			}
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

	return &config, nil
}

func NewConfig() *Config {
	return &Config{}
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
