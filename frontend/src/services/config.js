import { Load, Save } from "../../wailsjs/go/main/ConfigService.js";

export default class ConfigService {
	static Load() {
		return Load()
	}
	static Save(config) {
		Save(config)
	}
}
