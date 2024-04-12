package nihongo

import (
	"compress/gzip"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

func init() {
	urls := []string{
		"http://ftp.edrdg.org/pub/Nihongo//JMdict_e.gz",
		"http://nihongo.monash.edu/kanjidic2/kanjidic2_dtd.gz",
		"http://ftp.edrdg.org/pub/Nihongo/enamdict.gz",
		"http://ftp.edrdg.org/pub/Nihongo/JMnedict.xml.gz",
	}
	targetDir := ".mdsrs/dictionaries"

	if err := downloadAndExtract(urls, targetDir); err != nil {
		panic(err)
	}
}

func downloadAndExtract(urls []string, targetDir string) error {
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return err
	}

	for _, url := range urls {
		fileName := filepath.Base(url)
		extractedFileName := fileName[:len(fileName)-len(".gz")]
		extractedFilePath := filepath.Join(targetDir, extractedFileName)

		if _, err := os.Stat(extractedFilePath); err == nil {
			continue
		} else if !os.IsNotExist(err) {
			return err
		}

		resp, err := http.Get(url)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		gzReader, err := gzip.NewReader(resp.Body)
		if err != nil {
			return err
		}
		defer gzReader.Close()

		outputFile, err := os.Create(extractedFilePath)
		if err != nil {
			return err
		}
		defer outputFile.Close()

		if _, err := io.Copy(outputFile, gzReader); err != nil {
			return err
		}
	}

	return nil
}
