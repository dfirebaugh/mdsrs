package storage

type SRSData struct {
	Filename   string `json:"filename"`
	ReviewDate string `json:"reviewDate"`
}

func (d *Deck) UpdateSRSData(data SRSData) {}
