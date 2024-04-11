package nihongo

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

func Translate(source, sourceLang, targetLang string) (string, error) {
	endpoint := "https://translate.googleapis.com/translate_a/single"
	requestURL := fmt.Sprintf("%s?client=gtx&sl=%s&tl=%s&dt=t&q=%s",
		endpoint, url.QueryEscape(sourceLang), url.QueryEscape(targetLang), url.QueryEscape(source))

	resp, err := http.Get(requestURL)
	if err != nil {
		return "", fmt.Errorf("error making translate request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading response body: %w", err)
	}

	var result []interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("error parsing JSON response: %w", err)
	}

	if len(result) > 0 {
		if firstElem, ok := result[0].([]interface{}); ok && len(firstElem) > 0 {
			if secondElem, ok := firstElem[0].([]interface{}); ok && len(secondElem) > 0 {
				if translatedText, ok := secondElem[0].(string); ok {
					return translatedText, nil
				}
			}
		}
	}

	return "", fmt.Errorf("translated text not found in response")
}
