package main

import (
	"fmt"
	"log"
	"os"

	"github.com/dfirebaugh/mdsrs/internal/nihongo"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go <word>")
		os.Exit(1)
	}

	result, err := nihongo.Lookup(os.Args[1])
	if err != nil {
		log.Fatalf("Error performing lookup: %v", err)
	}

	result.Print()
}
